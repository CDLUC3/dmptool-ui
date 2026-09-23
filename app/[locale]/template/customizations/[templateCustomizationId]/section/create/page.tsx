'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { useRouter } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { useQuery, useMutation } from '@apollo/client/react';
import {
  Breadcrumb,
  Breadcrumbs,
  Button,
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
  CustomSectionErrors,
  CustomizableObjectOwnership,
  AddCustomSectionDocument,
  TemplateCustomizationOverviewDocument
} from '@/generated/graphql';

import {
  SectionFormErrorsInterface,
  SectionFormInterface,
} from '@/app/types';

// Components
import { ContentContainer, LayoutContainer, } from '@/components/Container';
import PageHeader from "@/components/PageHeader";
import TinyMCEEditor from "@/components/TinyMCEEditor";
import ErrorMessages from '@/components/ErrorMessages';
import FormInput from '@/components/Form/FormInput';
import Loading from '@/components/Loading';

// Utils
import { stripHtmlTags } from '@/utils/general';
import { scrollToTop } from '@/utils/general';
import { logECS, routePath } from "@/utils/index";
import { useToast } from '@/context/ToastContext';
import { extractErrors } from '@/utils/errorHandler';

type CreateCustomSectionResult = {
  errorObj: CustomSectionErrors;
  errorMessages: string[];
} | null;


const CreateCustomSectionPage: React.FC = () => {

  const toastState = useToast();

  // Get templateCustomizationId param
  const params = useParams();
  const router = useRouter();
  const templateCustomizationId = String(params.templateCustomizationId);

  //For scrolling to error in page
  const errorRef = useRef<HTMLDivElement | null>(null);
  // Track whether there are unsaved changes
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  // Form state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Ref to track whether form is currently being submitted to prevent double submission
  const isSubmittingRef = useRef(false);
  //For scrolling to top of page
  const topRef = useRef<HTMLDivElement | null>(null);

  //Keep form field values in state
  const [formData, setFormData] = useState<SectionFormInterface>({
    sectionName: '',
    sectionIntroduction: '',
    sectionRequirements: '',
    sectionGuidance: '',
  })

  // Track the last section to pin the new section after
  const [lastSectionId, setLastSectionId] = useState<number | null>(null);

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

  // Initialize mutation
  const [addCustomSectionMutation] = useMutation(AddCustomSectionDocument);

  // Run template query to get all sections and questions under the given templateCustomizationId
  const {
    data,
    loading,
    error: templateQueryErrors,
  } = useQuery(TemplateCustomizationOverviewDocument, {
    variables: { templateCustomizationId: Number(templateCustomizationId) },
  });
  // Update form fields in state when fields are edited
  const updateSectionContent = (key: string, value: string) => {
    clearAllFieldErrors();
    setFormData((prevContents) => ({
      ...prevContents,
      [key]: value,
    }));
    setHasUnsavedChanges(true);
  };

  // Show Success Message
  const showSuccessToast = () => {
    const successMessage = CreateSectionPage('messages.success');
    toastState.add(successMessage, { type: 'success' });
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

    return error;
  }

  // Check whether form is valid before submitting
  const isFormValid = (): boolean => {
    const newErrors: string[] = [];
    const newFieldErrors = { ...fieldErrors };
    let isValid = true;

    Object.keys(formData).forEach((key) => {
      const name = key as keyof SectionFormErrorsInterface;
      const value = formData[name];
      const error = validateField(name, value);
      if (error) {
        isValid = false;
        newFieldErrors[name] = error;
        newErrors.push(error);
      }
    });

    setFieldErrors(newFieldErrors);
    setErrors(newErrors);
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
    setErrors([]);
  }

  // Make GraphQL mutation request to create custom section
  const createCustomSection = async (): Promise<CreateCustomSectionResult> => {
    // strip all tags from sectionName before sending to backend
    const cleanedSectionName = stripHtmlTags(formData.sectionName);

    try {
      // First, create the custom section
      const addResponse = await addCustomSectionMutation({
        variables: {
          input: {
            name: cleanedSectionName,
            introduction: formData.sectionIntroduction,
            requirements: formData.sectionRequirements,
            guidance: formData.sectionGuidance,
            templateCustomizationId: Number(templateCustomizationId),
            ...(lastSectionId !== null && {
              pinnedSectionId: lastSectionId,
              pinnedSectionType: CustomizableObjectOwnership.Custom
            })
          }
        },
        // Refetch the template overview query to get the updated list of sections after adding the new section
        // otherwise it won't display on the template customization page without a full page refresh
        refetchQueries: [{
          query: TemplateCustomizationOverviewDocument,
          variables: {
            templateCustomizationId: Number(templateCustomizationId)
          }
        }]
      });

      if (addResponse.data?.addCustomSection?.errors) {
        const errorObj = addResponse.data.addCustomSection.errors;

        // Extract all error messages from the error object
        const errorMessages = extractErrors<CustomSectionErrors>(errorObj, ["general", "guidance", "introduction", "name", "requirements", "pinnedSectionId", "pinnedSectionType", "templateCustomizationId"]);

        if (errorMessages.length > 0) {
          // Set all error messages for display
          setErrors(prevErrors => [...prevErrors, ...errorMessages]);
          return { errorObj, errorMessages };
        }
      }
    } catch (error) {
      setErrors(prevErrors => [...prevErrors, CreateSectionPage('messages.errorCreatingSection')]);
      logECS("error", "Creating Custom Section in CreateCustomSectionPage", {
        errors: error,
      });
    }
    return null;
  };

  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    // Prevent double submission. useRef check prevents double submission since ref updates are synchronous,
    // unlike useState which is batched and won't block a second click in the same tick
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setIsSubmitting(true);

    // Clear previous errors
    clearAllFieldErrors();
    setErrors([]);

    if (isFormValid()) {
      // Create new custom section
      const result = await createCustomSection();

      if (result) {

        const { errorObj, errorMessages } = result;
        setErrors(errorMessages);
        setFieldErrors({
          sectionName: errorObj.name || '',
          sectionIntroduction: errorObj.introduction || '',
          sectionRequirements: errorObj.requirements || '',
          sectionGuidance: errorObj.guidance || '',
        });

        setIsSubmitting(false);
      } else {
        isSubmittingRef.current = false;
        setIsSubmitting(false);
        setHasUnsavedChanges(false);
        showSuccessToast();
        // Redirect to the template customization page
        router.push(routePath('template.customize', { templateCustomizationId }))
      }

      scrollToTop(topRef);
    } else {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  // Find the last section to pin the new custom section after it
  useEffect(() => {
    if (data?.templateCustomizationOverview?.sections && data.templateCustomizationOverview.sections.length > 0) {
      const sections = data.templateCustomizationOverview.sections;

      // Find the section with the highest displayOrder
      const lastSection = sections.reduce((max, section) => {
        if (!section) return max;
        if (!max || section.displayOrder > max.displayOrder) {
          return section;
        }
        return max;
      }, sections[0]);

      if (lastSection) {
        setLastSectionId(lastSection.id);
      }
    }
  }, [data]);

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

  // Handle errors from template query
  useEffect(() => {
    if (templateQueryErrors) {
      logECS('error', 'TemplateCustomizationOverview query error in CreateCustomSectionPage', {
        error: templateQueryErrors,
      });
      setErrors(prev => [...prev, CreateSectionPage('messaging.error')]);
    }
  }, [templateQueryErrors]);


  if (loading) {
    return <Loading message={Global('messaging.loading')} />;
  }

  return (
    <>
      <PageHeader
        title={CreateSectionPage('title')}
        description=""
        showBackButton={false}
        breadcrumbs={
          <Breadcrumbs>
            <Breadcrumb><Link href={routePath('app.home')}>{Global('breadcrumbs.home')}</Link></Breadcrumb>
            <Breadcrumb><Link href={routePath('template.customizations')}>{Global('breadcrumbs.templateCustomizations')}</Link></Breadcrumb>
            <Breadcrumb><Link href={routePath('template.customize', { templateCustomizationId })}>{Global('breadcrumbs.template')}</Link></Breadcrumb>
            <Breadcrumb>{CreateSectionPage('title')}</Breadcrumb>
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
                      onChange={e => updateSectionContent('sectionName', e.target.value)}
                      isInvalid={fieldErrors['sectionName'] !== ''}
                      errorMessage={fieldErrors['sectionName']}
                    />

                    <Label htmlFor="sectionIntroduction" id="sectionIntroductionLabel">{Section('labels.sectionIntroduction')}</Label>
                    <TinyMCEEditor
                      content={formData.sectionIntroduction}
                      setContent={(value) => updateSectionContent('sectionIntroduction', value)}
                      error={fieldErrors['sectionIntroduction']}
                      id="sectionIntroduction"
                      labelId="sectionIntroductionLabel"
                      helpText={Section('helpText.sectionIntroduction')}
                    />

                    <Label htmlFor="sectionRequirements" id="sectionRequirementsLabel">{Section('labels.sectionRequirements')}</Label>
                    <TinyMCEEditor
                      content={formData.sectionRequirements}
                      setContent={(value) => updateSectionContent('sectionRequirements', value)}
                      error={fieldErrors['sectionRequirements']}
                      id="sectionRequirements"
                      labelId="sectionRequirementsLabel"
                      helpText={Section('helpText.sectionRequirements')}
                    />

                    <Label htmlFor="sectionGuidance" id="sectionGuidanceLabel">{Section('labels.sectionGuidance')}</Label>
                    <TinyMCEEditor
                      content={formData.sectionGuidance}
                      setContent={(value) => updateSectionContent('sectionGuidance', value)}
                      error={fieldErrors['sectionGuidance']}
                      id="sectionGuidance"
                      labelId="sectionGuidanceLabel"
                      helpText={Section('helpText.sectionGuidance')}
                    />

                    <Button
                      type="submit"
                      aria-disabled={isSubmitting}
                      isDisabled={isSubmitting}
                    >
                      {isSubmitting ? CreateSectionPage('button.creatingSection') : CreateSectionPage('button.createSection')}
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
            </div>
          </div>
        </ContentContainer>
      </LayoutContainer>
    </>
  );
}

export default CreateCustomSectionPage;
