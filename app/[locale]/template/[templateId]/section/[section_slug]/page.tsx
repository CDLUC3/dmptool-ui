'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useMutation } from '@apollo/client/react';
import { useParams, useRouter } from 'next/navigation';
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
  SectionErrors,
  UpdateSectionDocument,
  RemoveSectionDocument,
} from '@/generated/graphql';

//Components
import { ContentContainer, LayoutContainer, } from '@/components/Container';
import PageHeader from "@/components/PageHeader";
import TinyMCEEditor from "@/components/TinyMCEEditor";
import ErrorMessages from '@/components/ErrorMessages';
import FormInput from '@/components/Form/FormInput';
import Loading from '@/components/Loading';
import { TransitionButton } from '@/components/Form';

import {
  SectionFormErrorsInterface,
  SectionFormInterface,
} from '@/app/types';

// Hooks
import { useSectionData } from "@/hooks/sectionData";

// Utils and other
import logECS from '@/utils/clientLogger';
import { useToast } from '@/context/ToastContext';
import { scrollToTop } from '@/utils/general';
import { routePath } from '@/utils/routes';
import { stripHtmlTags } from '@/utils/general';
import styles from './sectionUpdate.module.scss';

const SectionUpdatePage: React.FC = () => {
  const toastState = useToast(); // Access the toast state from context

  // Get sectionId param
  const params = useParams();
  const router = useRouter();

  // Get templateId and sectionId params
  const templateId = String(params.templateId);
  const sectionId = String(params.section_slug);

  //For scrolling to error in page
  const errorRef = useRef<HTMLDivElement | null>(null);
  // Track whether there are unsaved changes
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  // Form state for submitting Section form
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  // To be able to show a loading state when redirecting after successful update because otherwise there is a bit of a stutter where the page reloads before redirecting
  const [isRedirecting, setIsRedirecting] = useState(false);
  // State for delete confirmation modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  //For scrolling to top of page
  const topRef = useRef<HTMLDivElement | null>(null);

  const {
    sectionData,
    loading,
    setSectionData,
  } = useSectionData(Number(sectionId));


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
  const Section = useTranslations('Section');

  // Set URLs
  const TEMPLATE_URL = routePath('template.show', { templateId });
  const UPDATE_SECTION_URL = routePath('template.section.slug', { templateId, section_slug: sectionId });


  // Initialize user addSection mutation
  const [updateSectionMutation] = useMutation(UpdateSectionDocument);

  // Initialize remove section mutation
  const [removeSectionMutation] = useMutation(RemoveSectionDocument);

  const updateSectionContent = (key: string, value: string) => {
    setSectionData((prevContents) => ({
      ...prevContents,
      [key]: value,
    }));
    setHasUnsavedChanges(true);
  };

  // Client-side validation of fields
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
    const errors: SectionFormErrorsInterface = {
      sectionName: '',
      sectionIntroduction: '',
      sectionRequirements: '',
      sectionGuidance: ''
    };

    let hasError = false;

    // Validate all fields and collect errors
    Object.keys(sectionData).forEach((key) => {
      const name = key as keyof SectionFormErrorsInterface;
      const value = sectionData[name];
      const error = validateField(name, value);

      if (error) {
        hasError = true;
        errors[name] = error;
      }
    });

    // Update state with all errors
    setFieldErrors(errors);
    if (errors) {
      setErrorMessages(Object.values(errors).filter((e) => e)); // Store only non-empty error messages
    }

    return !hasError;
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
  const updateSection = async (): Promise<[SectionErrors, boolean]> => {
    // string all HTML tags from sectionName before sending to backend
    const cleanedSectionName = stripHtmlTags(sectionData.sectionName);

    try {
      const response = await updateSectionMutation({
        variables: {
          input: {
            sectionId: Number(sectionId),
            name: cleanedSectionName,
            introduction: sectionData.sectionIntroduction,
            requirements: sectionData.sectionRequirements,
            guidance: sectionData.sectionGuidance,
            displayOrder: sectionData.displayOrder,
            bestPractice: sectionData.bestPractice ?? false, // have to write it this way, otherwise the 'false' will remove this prop from input
          }
        }
      });

      const responseErrors = response.data?.updateSection?.errors
      if (responseErrors) {
        if (responseErrors && Object.values(responseErrors).filter((err) => err && err !== 'SectionErrors').length > 0) {
          return [responseErrors, false];
        }
      }

      return [{}, true];
    } catch (error) {
      logECS('error', 'updateSection', {
        error,
        url: { path: UPDATE_SECTION_URL }
      });
      setErrorMessages(prevErrors => [...prevErrors, SectionUpdatePage('messages.errorUpdatingSection')]);
      return [{}, false];
    }
  };

  // Handle section deletion
  const handleDeleteSection = async (close: () => void) => {
    setIsDeleting(true);
    try {
      await removeSectionMutation({
        variables: {
          sectionId: Number(sectionId)
        }
      });
      // Show success message and redirect to template page
      toastState.add(SectionUpdatePage('messages.successDeletingSection'), { type: 'success' });
      close(); // Close the modal
      router.push(TEMPLATE_URL);
    } catch (error) {
      logECS('error', 'deleteSection', {
        error,
        url: { path: UPDATE_SECTION_URL }
      });
      setErrorMessages([SectionUpdatePage('messages.errorDeletingSection')]);
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
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

      } else {
        setHasUnsavedChanges(false);
        // Show success message and redirect back to Edit Templates page
        showSuccessToast();
        setIsRedirecting(true); // Set redirecting state to true to display loading state
        router.push(TEMPLATE_URL);
      }
    } else {
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
            <Breadcrumb><Link href={routePath('projects.index')}>{Global('breadcrumbs.home')}</Link></Breadcrumb>
            <Breadcrumb><Link href={routePath('template.index', { templateId })}>{Global('breadcrumbs.templates')}</Link></Breadcrumb>
            <Breadcrumb><Link href={routePath('template.show', { templateId })}>{Global('breadcrumbs.editTemplate')}</Link></Breadcrumb>
            <Breadcrumb>{Global('breadcrumbs.updateSection')}</Breadcrumb>
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

                    <TransitionButton
                      type="submit"
                      isDisabled={isSubmitting}
                      loadingLabel={Global('buttons.saving')}
                    >
                      {Global('buttons.saveAndUpdate')}
                    </TransitionButton>
                  </Form>
                </TabPanel>
                <TabPanel id="options">
                  <h2>{Section('tabs.options')}</h2>
                </TabPanel>
                <TabPanel id="logic">
                  <h2>{Section('tabs.logic')}</h2>
                </TabPanel>
              </Tabs>

              {/* Delete Section Button and Modal */}
              <div className={styles.deleteSectionContainer}>
                <h3 className={styles.dangerZoneTitle}>{SectionUpdatePage('deleteSection.heading')}</h3>
                <p className={styles.dangerZoneDescription}>
                  {SectionUpdatePage('deleteSection.description')}
                </p>
                <DialogTrigger isOpen={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
                  <Button
                    className={`react-aria-Button danger`}
                    isDisabled={isDeleting}
                  >
                    {isDeleting ? 'Deleting...' : SectionUpdatePage('buttons.deleteSection')}
                  </Button>
                  <ModalOverlay>
                    <Modal>
                      <Dialog>
                        {({ close }) => (
                          <>
                            <h3>{SectionUpdatePage('deleteModal.title')}</h3>
                            <p>{SectionUpdatePage('deleteModal.content')}</p>
                            <div className={styles.deleteConfirmButtons}>
                              <Button className='react-aria-Button' autoFocus onPress={close}>
                                {SectionUpdatePage('deleteModal.cancelButton')}
                              </Button>
                              <TransitionButton
                                className="danger"
                                loadingLabel={SectionUpdatePage('buttons.deletingSection')}
                                onPress={async () => { await handleDeleteSection(close); }}
                              >
                                {SectionUpdatePage('deleteModal.deleteButton')}
                              </TransitionButton>
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

export default SectionUpdatePage;
