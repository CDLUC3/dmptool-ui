'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { useParams } from 'next/navigation';
import { useRouter } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import {
  Breadcrumb,
  Breadcrumbs,
  Button,
  Dialog,
  DialogTrigger,
  Form,
  Label,
  Link,
  Tab,
  TabList,
  TabPanel,
  Tabs,
  Modal,
  ModalOverlay,
} from "react-aria-components";

// GraphQL
import {
  CustomSectionErrors,
  CustomSectionDocument,
  UpdateCustomSectionDocument,
  RemoveCustomSectionDocument,
} from '@/generated/graphql';

//Components
import { ContentContainer, LayoutContainer, } from '@/components/Container';
import PageHeader from "@/components/PageHeader";
import TinyMCEEditor from "@/components/TinyMCEEditor";
import ErrorMessages from '@/components/ErrorMessages';
import FormInput from '@/components/Form/FormInput';
import Loading from '@/components/Loading';
import { DmpIcon } from "@/components/Icons";

import {
  SectionFormErrorsInterface,
  SectionFormInterface,
} from '@/app/types';

// Utils and other
import logECS from '@/utils/clientLogger';
import { useToast } from '@/context/ToastContext';
import { scrollToTop } from '@/utils/general';
import { routePath } from '@/utils/routes';
import { stripHtmlTags } from '@/utils/general';
import styles from './customSectionEdit.module.scss';

const CustomSectionEdit: React.FC = () => {
  const toastState = useToast();

  // Get sectionId param
  const params = useParams();
  const router = useRouter();

  // Get templateCustomizationId and customSectionId params
  const templateCustomizationId = String(params.templateCustomizationId);
  const customSectionId = String(params.customSectionId);

  // State for section data
  const [sectionData, setSectionData] = useState<SectionFormInterface>({
    sectionName: '',
    sectionIntroduction: '',
    sectionRequirements: '',
    sectionGuidance: '',
  });

  //For scrolling to error in page
  const errorRef = useRef<HTMLDivElement | null>(null);
  // Track whether there are unsaved changes
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  // Form state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  /*To be able to show a loading state when redirecting after successful update because otherwise there is a 
  bit of a stutter where the page reloads before redirecting*/
  const [isRedirecting, setIsRedirecting] = useState(false);
  // State for delete confirmation modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  //For scrolling to top of page
  const topRef = useRef<HTMLDivElement | null>(null);
  // Ref to track whether customization is being deleted to prevent refetching deleted customization
  const isBeingDeletedRef = useRef(false);

  // Save errors in state to display on page
  const [errorMessages, setErrorMessages] = useState<string[]>([]);
  const [fieldErrors, setFieldErrors] = useState<SectionFormInterface>({
    sectionName: '',
    sectionIntroduction: '',
    sectionRequirements: '',
    sectionGuidance: '',
  });

  // localization keys
  const Global = useTranslations('Global');
  const SectionUpdatePage = useTranslations('SectionUpdatePage');
  const SectionCustomize = useTranslations('SectionCustomize');
  const Section = useTranslations('Section');

  // Set URLs
  const TEMPLATE_CUSTOMIZE_URL = routePath('template.customize', { templateCustomizationId });
  const UPDATE_CUSTOM_SECTION_URL = routePath('template.customSection', { templateCustomizationId, customSectionId });


  // Initialize user updateCustomSection mutation
  const [updateCustomSectionMutation] = useMutation(UpdateCustomSectionDocument);

  // Initialize removeCustomSection mutation
  const [removeCustomSectionMutation] = useMutation(RemoveCustomSectionDocument);


  // Query for the specified custom section
  const { data, loading } = useQuery(CustomSectionDocument, {
    variables: {
      customSectionId: Number(customSectionId)
    },
    skip: isBeingDeletedRef.current, // Skip the query if the section is being deleted to avoid errors from trying to fetch a deleted section
  })

  // Update custom section data in state when fields are edited
  const updateSectionContent = (key: string, value: string) => {
    setSectionData((prevContents) => ({
      ...prevContents,
      [key]: value,
    }));
    setHasUnsavedChanges(true);
  };

  // Client-side validation of section name field since it's required
  const validateField = (name: string, value: string | string[] | undefined): string => {
    switch (name) {
      case 'sectionName':
        if (!value || value.length <= 2) {
          return SectionUpdatePage('messages.fieldLengthValidation');
        }
        break;
    }
    return '';
  };

  // Check whether form is valid before submitting
  const isFormValid = (): boolean => {
    // Initialize a flag for form validity
    let isValid = true;
    const errors: SectionFormInterface = {
      sectionName: '',
      sectionIntroduction: '',
      sectionRequirements: '',
      sectionGuidance: '',
    };

    // Iterate over formData to validate each field
    Object.keys(sectionData).forEach((key) => {
      const name = key as keyof SectionFormErrorsInterface;
      const value = sectionData[name];
      // Call validateField to update errors for each field
      const error = validateField(name, value);
      if (error) {
        isValid = false;
        errors[name] = error;
      }
    });

    // Update state with all errors
    setFieldErrors(errors);
    setErrorMessages(errors.sectionName ? [errors.sectionName] : []);
    return isValid;
  };

  const clearAllFieldErrors = () => {
    //Remove all field errors
    setFieldErrors({
      sectionName: '',
      sectionIntroduction: '',
      sectionRequirements: '',
      sectionGuidance: '',
    });
  }

  // Make GraphQL mutation request to update section
  const updateSection = async (): Promise<[CustomSectionErrors, boolean]> => {
    // strip any HTML from section name
    const cleanedSectionName = stripHtmlTags(sectionData.sectionName);

    try {
      const response = await updateCustomSectionMutation({
        variables: {
          input: {
            customSectionId: Number(customSectionId),
            name: cleanedSectionName,
            introduction: sectionData.sectionIntroduction,
            requirements: sectionData.sectionRequirements,
            guidance: sectionData.sectionGuidance,
          }
        }
      });

      const responseErrors = response.data?.updateCustomSection?.errors
      if (responseErrors) {
        if (responseErrors && Object.values(responseErrors).filter((err) => err && err !== 'CustomSectionErrors').length > 0) {
          return [responseErrors, false];
        }
      }

      return [{}, true];
    } catch (error) {
      logECS('error', 'updateSection', {
        error,
        url: { path: UPDATE_CUSTOM_SECTION_URL }
      });
      setErrorMessages(prevErrors => [...prevErrors, SectionUpdatePage('messages.errorUpdatingSection')]);
      return [{}, false];
    }
  };

  // Handle custom section deletion
  const handleDeleteSectionCustomization = async () => {
    isBeingDeletedRef.current = true; // No re-render of page needed since re-routing after deletion
    setIsDeleting(true);
    try {
      const response = await removeCustomSectionMutation({
        variables: {
          customSectionId: Number(customSectionId)
        },
      });

      const responseErrors = response.data?.removeCustomSection?.errors
      if (responseErrors) {
        if (responseErrors && Object.values(responseErrors).filter((err) => err && err !== 'CustomSectionErrors').length > 0) {
          setErrorMessages([responseErrors.general || SectionUpdatePage('messages.errorDeletingSection')]);
          return;
        }
      }

      // Show success message and redirect to template page
      toastState.add(SectionUpdatePage('messages.successDeletingSection'), { type: 'success' });
      router.push(TEMPLATE_CUSTOMIZE_URL);
    } catch (error) {
      logECS('error', 'deleteSection', {
        error,
        url: { path: UPDATE_CUSTOM_SECTION_URL }
      });
      setErrorMessages([SectionUpdatePage('messages.errorDeletingSection')]);
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
      setIsSubmitting(false);
    }
  };

  // Show Success Message
  const showSuccessToast = () => {
    const successMessage = SectionUpdatePage('messages.success');
    toastState.add(successMessage, { type: 'success' });
  }

  const handleSectionNameChange = (sectionData: SectionFormInterface) => {
    setSectionData(sectionData);
    setHasUnsavedChanges(true);
  };

  // Handle form submit
  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    // Prevent double submission
    if (isSubmitting) return;
    setIsSubmitting(true);

    // Clear previous error messages
    clearAllFieldErrors();
    setErrorMessages([]);

    if (isFormValid()) {
      // Create new section
      const [errors, success] = await updateSection();

      if (!success) {
        if (errors) {
          setFieldErrors({
            sectionName: errors.name || '',
            sectionIntroduction: errors.introduction || '',
            sectionRequirements: errors.requirements || '',
            sectionGuidance: errors.guidance || ''
          });
        }
        setErrorMessages([errors.general || SectionUpdatePage('messages.errorUpdatingSection')]);
        logECS('error', 'handleFormSubmit', {
          error: [errors, SectionUpdatePage('messages.errorUpdatingSection')],
          url: { path: UPDATE_CUSTOM_SECTION_URL }
        });
        setIsSubmitting(false); // Reset on error
      } else {
        setHasUnsavedChanges(false);
        setIsSubmitting(false);
        setIsRedirecting(true); // Set redirecting state to true to display loading state
        router.push(TEMPLATE_CUSTOMIZE_URL);
        // Show success message and redirect back to Edit Templates page
        showSuccessToast();
      }
    } else {
      // Form validation failed - reset submitting state
      setIsSubmitting(false);
    }
  };

  // Warn user of unsaved changes if they try to leave the page
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = ''; // Required for Chrome/Firefox to show the confirm dialog
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasUnsavedChanges]);


  useEffect(() => {
    // Update state values from data results
    if (data?.customSection) {
      const section = data.customSection;
      const cleanedSectionName = stripHtmlTags(section.name);
      setSectionData({
        sectionName: cleanedSectionName,
        sectionIntroduction: section?.introduction ? section.introduction : '',
        sectionRequirements: section?.requirements ? section.requirements : '',
        sectionGuidance: section?.guidance ? section.guidance : '',
      })
    }
  }, [data])

  // If errors when submitting publish form, scroll them into view
  useEffect(() => {
    if (errorMessages.length > 0) {
      scrollToTop(errorRef);
    }
  }, [errorMessages]);

  // We need this so that the page waits to render until data is available
  if (loading) {
    return <Loading message={Global('messaging.loading')} />;
  }

  if (isRedirecting) {
    return <Loading message={Global('messaging.loading')} />;
  }
  return (
    <>
      <PageHeader
        title={SectionUpdatePage('title')}
        description=""
        showBackButton={false}
        breadcrumbs={
          <Breadcrumbs>
            <Breadcrumb><Link href={routePath('app.home')}>{Global('breadcrumbs.home')}</Link></Breadcrumb>
            <Breadcrumb><Link href={routePath('template.customizations', { templateCustomizationId })}>{Global('breadcrumbs.templateCustomizations')}</Link></Breadcrumb>
            <Breadcrumb><Link href={routePath('template.customize', { templateCustomizationId })}>{Global('breadcrumbs.editTemplate')}</Link></Breadcrumb>
            <Breadcrumb>{SectionUpdatePage('title')}</Breadcrumb>
          </Breadcrumbs>
        }
        actions={null}
        className=""
      />

      <LayoutContainer>
        <ContentContainer>
          <div className="template-editor-container" ref={topRef}>
            <div className="main-content">

              <ErrorMessages errors={errorMessages} ref={errorRef} />
              <Tabs>
                <TabList aria-label="Question editing">
                  <Tab id="edit">{Section('tabs.editSection')}</Tab>
                  <Tab id="options">{Section('tabs.options')}</Tab>
                  <Tab id="logic">{Section('tabs.logic')}</Tab>
                </TabList>
                <TabPanel id="edit">
                  <Form onSubmit={handleFormSubmit}>

                    <FormInput
                      name="sectionName"
                      id="sectionName"
                      type="text"
                      isRequiredVisualOnly={true}
                      label={Section('labels.sectionName')}
                      value={sectionData.sectionName ? sectionData.sectionName : ''}
                      onChange={(e) => handleSectionNameChange({
                        ...sectionData,
                        sectionName: e.currentTarget.value
                      })}
                      errorMessage={fieldErrors['sectionName']}
                    />

                    <Label htmlFor="sectionIntroduction" id="sectionIntroductionLabel">{Section('labels.sectionIntroduction')}</Label>
                    <TinyMCEEditor
                      content={sectionData.sectionIntroduction}
                      setContent={(value) => updateSectionContent('sectionIntroduction', value)}
                      error={fieldErrors['sectionIntroduction']}
                      id="sectionIntroduction"
                      labelId="sectionIntroductionLabel"
                      helpText={Section('helpText.sectionIntroduction')}
                    />

                    <Label htmlFor="sectionRequirements" id="sectionRequirementsLabel">{Section('labels.sectionRequirements')}</Label>
                    <TinyMCEEditor
                      content={sectionData.sectionRequirements}
                      setContent={(value) => updateSectionContent('sectionRequirements', value)}
                      error={fieldErrors['sectionRequirements']}
                      id="sectionRequirements"
                      labelId="sectionRequirementsLabel"
                      helpText={Section('helpText.sectionRequirements')}
                    />

                    <Label htmlFor="sectionGuidance" id="sectionGuidanceLabel">{Section('labels.sectionGuidance')}</Label>
                    <TinyMCEEditor
                      content={sectionData.sectionGuidance}
                      setContent={(value) => updateSectionContent('sectionGuidance', value)}
                      error={fieldErrors['sectionGuidance']}
                      id="sectionGuidance"
                      labelId="sectionGuidanceLabel"
                      helpText={Section('helpText.sectionGuidance')}
                    />
                    <Button
                      type="submit"
                      aria-disabled={isSubmitting}
                    >
                      {isSubmitting ? Global('buttons.saving') : Global('buttons.saveAndUpdate')}
                    </Button>
                  </Form>
                </TabPanel>
                <TabPanel id="options">
                  <h2>{Section('tabs.options')}</h2>
                </TabPanel>
                <TabPanel id="logic">
                  <h2>{Section('tabs.logic')}</h2>
                </TabPanel>
              </Tabs>

              {/* Delete Customization Button and Modal */}
              <div className={styles.deleteSectionContainer}>
                <h3 className={styles.dangerZoneTitle}>{SectionCustomize("heading.deleteCustomSection")}</h3>
                <p className={styles.dangerZoneDescription}><DmpIcon icon="warning" />{SectionCustomize.rich("descriptions.deleteCustomSection", {
                  strong: (chunks) => <strong>{chunks}</strong>
                })}</p>
                <DialogTrigger isOpen={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
                  <Button
                    className="danger"
                    isDisabled={isDeleting}
                  >
                    {isDeleting ? `${SectionCustomize('buttons.deletingCustomizations')}...` : SectionCustomize("buttons.deleteCustomization")}
                  </Button>
                  <ModalOverlay>
                    <Modal>
                      <Dialog>
                        {({ close }) => (
                          <>
                            <h3>{SectionCustomize("heading.deleteCustomSection")}</h3>
                            <p>{SectionCustomize.rich("descriptions.deleteCustomSection", {
                              strong: (chunks) => <strong>{chunks}</strong>
                            })}</p>
                            <div className={styles.deleteConfirmButtons}>
                              <Button
                                className="secondary"
                                autoFocus
                                onPress={close}>
                                {Global('buttons.cancel')}
                              </Button>
                              <Button
                                className="danger"
                                onPress={async () => {
                                  await handleDeleteSectionCustomization();
                                  close();
                                }}
                              >
                                {Global('buttons.delete')}
                              </Button>
                            </div>
                          </>
                        )}
                      </Dialog>
                    </Modal>
                  </ModalOverlay>
                </DialogTrigger>
              </div>
            </div>
          </div>
        </ContentContainer>
      </LayoutContainer >
    </>
  );
}

export default CustomSectionEdit;
