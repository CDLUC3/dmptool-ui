'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useQuery, useMutation } from '@apollo/client/react';
import {
  Breadcrumb,
  Breadcrumbs,
  Form,
  Label,
  Link,
  Tab,
  TabList,
  TabPanel,
  Tabs,
} from "react-aria-components";

// GraphQL queries and mutations
import {
  SectionErrors,
  SectionsDisplayOrderDocument,
  AddSectionDocument,
} from '@/generated/graphql';
import {
  SectionFormErrorsInterface,
  SectionFormInterface,
} from '@/app/types';

//Components
import { ContentContainer, LayoutContainer, } from '@/components/Container';
import PageHeader from "@/components/PageHeader";
import TinyMCEEditor from "@/components/TinyMCEEditor";
import ErrorMessages from '@/components/ErrorMessages';
import FormInput from '@/components/Form/FormInput';
import { TransitionButton } from '@/components/Form';

// Utils and other
import { stripHtmlTags } from '@/utils/general';
import { scrollToTop } from '@/utils/general';
import logECS from '@/utils/clientLogger';
import { useToast } from '@/context/ToastContext';

const CreateSectionPage: React.FC = () => {

  const toastState = useToast(); // Access the toast state from context

  // Get templateId param
  const params = useParams();
  const router = useRouter();
  const { templateId } = params; // From route /template/:templateId/section/create

  //For scrolling to error in page
  const errorRef = useRef<HTMLDivElement | null>(null);
  // Track whether there are unsaved changes
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  // Form state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  //For scrolling to top of page
  const topRef = useRef<HTMLDivElement | null>(null);

  //Set initial Rich Text Editor field values
  const [sectionNameContent, setSectionNameContent] = useState('');
  const [sectionIntroductionContent, setSectionIntroductionContent] = useState('');
  const [sectionRequirementsContent, setSectionRequirementsContent] = useState('');
  const [sectionGuidanceContent, setSectionGuidanceContent] = useState('');

  //Keep form field values in state
  const [formData, setFormData] = useState<SectionFormInterface>({
    sectionName: '',
    sectionIntroduction: '',
    sectionRequirements: '',
    sectionGuidance: '',
    sectionTags: []
  })

  // Keep track of which checkboxes have been selected
  const [maxDisplayOrderNum, setMaxDisplayOrderNum] = useState<number>(0);
  // Save errors in state to display on page
  const [errors, setErrors] = useState<string[]>([]);
  const [fieldErrors, setFieldErrors] = useState<SectionFormInterface>({
    sectionName: '',
    sectionIntroduction: '',
    sectionRequirements: '',
    sectionGuidance: '',
  });

  // localization keys
  const Global = useTranslations('Global');
  const CreateSectionPage = useTranslations('CreateSectionPage');
  const Section = useTranslations('Section');

  // Initialize user addSection mutation
  const [addSectionMutation] = useMutation(AddSectionDocument);

  // Query for all section displayOrder
  const { data: sectionDisplayOrders } = useQuery(SectionsDisplayOrderDocument, {
    variables: {
      templateId: Number(templateId)
    }
  })

  // Get the current max display order number + 1
  const getNewDisplayOrder = () => {
    return maxDisplayOrderNum + 1;
  }

  // Client-side validation of fields
  const validateField = (name: string, value: string | string[] | undefined) => {
    let error = '';
    switch (name) {
      case 'sectionName':
        if (!value || value.length <= 2) {
          error = CreateSectionPage('messages.fieldLengthValidation')
        }
        break;
    }

    setFieldErrors(prevErrors => ({
      ...prevErrors,
      [name]: error
    }));
    if (error.length > 1) {
      setErrors(prev => [...prev, error]);
    }

    return error;
  }

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
    Object.keys(formData).forEach((key) => {
      const name = key as keyof SectionFormErrorsInterface;
      const value = formData[name];
      // Call validateField to update errors for each field
      const error = validateField(name, value);
      if (error) {
        isValid = false;
        errors[name] = error;
      }
    });
    return isValid;
  };

  const clearAllFieldErrors = () => {
    //Remove all field errors
    setFieldErrors({
      sectionName: '',
      sectionIntroduction: '',
      sectionRequirements: '',
      sectionGuidance: '',
      sectionTags: []
    });
  }

  // Make GraphQL mutation request to create section
  const createSection = async (): Promise<SectionErrors> => {
    // string all HTML tags from sectionName before sending to backend
    const cleanedSectionName = stripHtmlTags(sectionNameContent);

    try {
      const newDisplayOrder = getNewDisplayOrder();
      const response = await addSectionMutation({
        variables: {
          input: {
            templateId: Number(templateId),
            name: cleanedSectionName,
            introduction: sectionIntroductionContent,
            requirements: sectionRequirementsContent,
            guidance: sectionGuidanceContent,
            displayOrder: newDisplayOrder,
          }
        },
        refetchQueries: [{ //Need to update the sectionDisplayOrders with latest from db
          query: SectionsDisplayOrderDocument,
          variables: {
            templateId: Number(templateId)
          }
        }]
      });

      if (response.data?.addSection?.errors) {
        return response.data.addSection.errors;
      }
    } catch (error) {
      setErrors(prevErrors => [...prevErrors, CreateSectionPage('messages.errorCreatingSection')]);
      logECS("error", "Creating Section in CreateSectionPage", {
        errors: error,
      });
    }
    return {};
  };

  // Show Success Message
  const showSuccessToast = () => {
    const successMessage = CreateSectionPage('messages.success');
    toastState.add(successMessage, { type: 'success' });
  }

  // Handle form submit
  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    // Prevent double submission
    if (isSubmitting) return;
    setIsSubmitting(true);

    // Clear previous errors
    clearAllFieldErrors();
    setErrors([]);

    if (isFormValid()) {
      // Create new section
      const errors = await createSection();

      // Check if there are any errors (always exclude the GraphQL `_typename` entry)
      if (errors && Object.values(errors).filter((err) => err && err !== 'SectionErrors').length > 0) {
        setFieldErrors({
          sectionName: errors.name || '',
          sectionIntroduction: errors.introduction || '',
          sectionRequirements: errors.requirements || '',
          sectionGuidance: errors.guidance || ''
        });

        setErrors([errors.general || CreateSectionPage('messages.errorCreatingSection')]);
      } else {
        setIsSubmitting(false);
        setHasUnsavedChanges(false);
        // Show success message
        showSuccessToast();
        // Redirect to the edit template page
        router.push(`/template/${templateId}`)
      }

      scrollToTop(topRef);
    }
  };

  useEffect(() => {
    if (sectionDisplayOrders?.sections && sectionDisplayOrders.sections.length > 0) {
      const sections = sectionDisplayOrders?.sections;

      // Find the maximum displayOrder
      const maxDisplayOrder = sections.reduce(
        (max, section) => (section?.displayOrder ?? -Infinity) > max ? section?.displayOrder ?? max : max,
        0
      );

      setMaxDisplayOrderNum(maxDisplayOrder);
    }
  }, [sectionDisplayOrders])

  useEffect(() => {
    setFormData({
      ...formData,
      sectionName: sectionNameContent,
      sectionIntroduction: sectionIntroductionContent,
      sectionRequirements: sectionRequirementsContent,
      sectionGuidance: sectionGuidanceContent
    });
  }, [sectionNameContent, sectionIntroductionContent, sectionRequirementsContent, sectionGuidanceContent])

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

  return (
    <>
      <PageHeader
        title={CreateSectionPage('title')}
        description=""
        showBackButton={false}
        breadcrumbs={
          <Breadcrumbs>
            <Breadcrumb><Link href="/">{Global('breadcrumbs.home')}</Link></Breadcrumb>
            <Breadcrumb><Link href="/template">{Global('breadcrumbs.templates')}</Link></Breadcrumb>
            <Breadcrumb><Link href={`/template/${templateId}`}>{Global('breadcrumbs.editTemplate')}</Link></Breadcrumb>
            <Breadcrumb>{Global('breadcrumbs.createSection')}</Breadcrumb>
          </Breadcrumbs>
        }
        actions={null}
        className=""
      />

      <LayoutContainer>
        <ContentContainer>
          <div className="template-editor-container" ref={topRef}>
            <div className="main-content">

              <ErrorMessages errors={errors} ref={errorRef} />

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
                      value={formData.sectionName}
                      onChange={e => {
                        setSectionNameContent(e.currentTarget.value);
                        setHasUnsavedChanges(true);
                      }}
                      isInvalid={fieldErrors['sectionName'] !== ''}
                      errorMessage={fieldErrors['sectionName']}
                    />

                    <Label htmlFor="sectionIntroduction" id="sectionIntroductionLabel">{Section('labels.sectionIntroduction')}</Label>
                    <TinyMCEEditor
                      content={sectionIntroductionContent}
                      setContent={(value) => {
                        setSectionIntroductionContent(value);
                        setHasUnsavedChanges(true);
                      }}
                      error={fieldErrors['sectionIntroduction']}
                      id="sectionIntroduction"
                      labelId="sectionIntroductionLabel"
                      helpText={Section('helpText.sectionIntroduction')}
                    />

                    <Label htmlFor="sectionRequirements" id="sectionRequirementsLabel">{Section('labels.sectionRequirements')}</Label>
                    <TinyMCEEditor
                      content={sectionRequirementsContent}
                      setContent={(value) => {
                        setSectionRequirementsContent(value);
                        setHasUnsavedChanges(true);
                      }}
                      error={fieldErrors['sectionRequirements']}
                      id="sectionRequirements"
                      labelId="sectionRequirementsLabel"
                      helpText={Section('helpText.sectionRequirements')}
                    />

                    <Label htmlFor="sectionGuidance" id="sectionGuidanceLabel">{Section('labels.sectionGuidance')}</Label>
                    <TinyMCEEditor
                      content={sectionGuidanceContent}
                      setContent={(value) => {
                        setSectionGuidanceContent(value);
                        setHasUnsavedChanges(true);
                      }}
                      error={fieldErrors['sectionGuidance']}
                      id="sectionGuidance"
                      labelId="sectionGuidanceLabel"
                      helpText={Section('helpText.sectionGuidance')}
                    />

                    <TransitionButton
                      type="submit"
                      isDisabled={isSubmitting}
                      loadingLabel={CreateSectionPage('button.creatingSection')}
                      showLoading={false}
                      aria-disabled={isSubmitting}
                    >
                      {CreateSectionPage('button.createSection')}
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
            </div>
          </div>
        </ContentContainer>
      </LayoutContainer>
    </>
  );
}

export default CreateSectionPage;
