'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useMutation } from '@apollo/client/react';
import {
  Breadcrumb,
  Breadcrumbs,
  Form,
  Link,
  Radio,
  Text
} from "react-aria-components";

//GraphQL
import {
  AddProjectDocument,
  ProjectErrors,
} from '@/generated/graphql';

// Components
import PageHeader from "@/components/PageHeader";
import {
  ContentContainer,
  LayoutContainer,
} from "@/components/Container";
import {
  FormInput,
  RadioGroupComponent,
  TransitionButton
} from '@/components/Form';
import ErrorMessages from '@/components/ErrorMessages';

// Utils and other
import { scrollToTop } from '@/utils/general';
import { routePath } from '@/utils/routes';
import { useToast } from '@/context/ToastContext';
import { checkErrors } from '@/utils/errorHandler';
import styles from './projectsCreateProject.module.scss';
import { handleApolloError } from '@/utils/apolloErrorHandler';


interface CreateProjectInterface {
  projectName: string;
  radioGroup?: string;
}

interface CreateProjectErrorsInterface {
  projectName: string;
  radioGroup?: string;
}

const ProjectsCreateProject = () => {
  const toastState = useToast();
  const router = useRouter();
  //For scrolling to error in page
  const errorRef = useRef<HTMLDivElement | null>(null);
  const inputFieldRef = useRef<HTMLInputElement | null>(null);

  const [fieldErrors, setFieldErrors] = useState<CreateProjectErrorsInterface>({
    projectName: '',
    radioGroup: '',
  });
  const [formData, setFormData] = useState<CreateProjectInterface>({
    projectName: '',
    radioGroup: ''
  })
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  // localization keys
  const Global = useTranslations('Global');
  const CreateProject = useTranslations('ProjectsCreateProject');

  const [addProjectMutation] = useMutation(AddProjectDocument);

  // Update form data
  const handleUpdate = (name: string, value: string | string[]) => {
    setFormSubmitted(false);
    setFormData({ ...formData, [name]: value });
  };

  // Handle any changes to form field values
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    handleUpdate(name, value);
  };

  const updateProjectContent = (
    key: string,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      [key]: value
    }))
  };

  // Handle changes from CheckboxGroup
  const handleRadioChange = (value: string) => {
    setFormSubmitted(false);
    updateProjectContent('radioGroup', value);
  };


  // Show Success Message
  const showSuccessToast = () => {
    const successMessage = CreateProject('messages.success');
    toastState.add(successMessage, { type: 'success' });
  }

  // Client-side validation of fields
  const validateField = (name: keyof CreateProjectInterface, value: string | string[]) => {
    switch (name) {
      case 'projectName':
        if (!value || value.length <= 2) {
          return CreateProject('messages.errors.titleLength')
        }
        break;
    }
    return '';
  }

  // Check whether form is valid before submitting
  const isFormValid = (): boolean => {
    const errors: CreateProjectErrorsInterface = {
      projectName: '',
      radioGroup: '',
    };

    let hasError = false;

    // Validate all fields and collect errors
    Object.keys(formData).forEach((key) => {
      const name = key as keyof CreateProjectInterface;
      const value = formData[name];
      const error = validateField(name, value ? value : '');

      if (error) {
        hasError = true;
        errors[name] = error as string;
      }
    });

    // Update state with all errors
    setFieldErrors(errors);

    return !hasError;
  };

  // Handle form submit
  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setFormSubmitted(true);
    setErrors([]);

    if (isFormValid()) {
      const isTestProject = formData.radioGroup === "true";

      // Create new section
      addProjectMutation({
        variables: {
          isTestProject,
          title: formData.projectName,
        }
      }).then(({ data }) => {
        const result = data!.addProject;
        const [hasErrors, errs] = checkErrors(
          result?.errors as ProjectErrors,
          ['general', 'title'],
        );

        if (hasErrors) {
          setFieldErrors({
            ...fieldErrors,
            projectName: String(errs.title),
          });
          setErrors([
            String(errs.general || CreateProject('messages.errors.createProjectError'))
          ]);
        } else {
          // Show success message
          showSuccessToast();
          router.push(routePath('projects.create.funding.search', {
            projectId: String(result!.id)
          }));
        }
      }).catch((error) => {
        handleApolloError(error, 'ProjectsCreateProject.handleFormSubmit');
        setErrors(prevErrors => [...prevErrors, CreateProject('messages.errors.createProjectError')]);
      });
    }
  };

  useEffect(() => {
    // Scroll to the Project name field if there is a field-level error
    if (fieldErrors.projectName.length > 0) {
      scrollToTop(inputFieldRef);
    }
  }, [fieldErrors.projectName])

  return (
    <>
      <PageHeader
        title={CreateProject('pageTitle')}
        description={CreateProject('description')}
        showBackButton={false}
        breadcrumbs={
          <Breadcrumbs>
            <Breadcrumb><Link href="/">{Global('breadcrumbs.home')}</Link></Breadcrumb>
            <Breadcrumb><Link href="/projects">{Global('breadcrumbs.projects')}</Link></Breadcrumb>
            <Breadcrumb>{CreateProject('pageTitle')}</Breadcrumb>
          </Breadcrumbs>
        }
        actions={
          <>
          </>
        }
        className="page-project-create-project"
      />
      <LayoutContainer>
        <ContentContainer>
          <ErrorMessages errors={errors} ref={errorRef} />
          <Form onSubmit={handleFormSubmit}>
            <FormInput
              ref={inputFieldRef}
              name="projectName"
              type="text"
              value={formData.projectName}
              label={CreateProject('form.projectTitle')}
              helpMessage={CreateProject('form.projectTitleHelpText')}
              isRequiredVisualOnly={true}
              onChange={handleInputChange}
              isInvalid={(!formData.projectName || !!fieldErrors.projectName) && formSubmitted}
              errorMessage={fieldErrors.projectName.length > 0 ? fieldErrors.projectName : CreateProject('messages.errors.title')}
              id="projectName"
            />

            <RadioGroupComponent
              name="projectType"
              value={formData.radioGroup}
              classes={`${styles.radioGroup} react-aria-RadioGroup`}
              radioGroupLabel={CreateProject('form.radioGroupLabel')}
              onChange={handleRadioChange}
            >
              <div>
                <Radio value="true">{CreateProject('labels.mockProject')}</Radio>
                <Text
                  slot="description"
                >
                  {CreateProject('descriptions.mockProject')}
                </Text>
              </div>

              <div>
                <Radio value="false">{CreateProject('labels.realProject')}</Radio>
                <Text
                  slot="description"
                >
                  {CreateProject('descriptions.realProject')}
                </Text>
              </div>
            </RadioGroupComponent>

            <TransitionButton
              type="submit"
              className=""
              loadingLabel={Global('buttons.loading')}
              showLoading={false}
              isDisabled={formSubmitted}
            >
              {Global('buttons.continue')}
            </TransitionButton>
          </Form>
        </ContentContainer>
      </LayoutContainer>
    </>
  );
};

export default ProjectsCreateProject;
