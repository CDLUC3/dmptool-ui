'use client';

import React, { useState, useRef } from 'react';
import {
  Breadcrumb,
  Breadcrumbs,
  Button,
  Dialog,
  Form,
  Link,
  Modal,
  Radio
} from "react-aria-components";
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

// Components
import PageHeader from "@/components/PageHeader";
import { ContentContainer, LayoutContainer, } from "@/components/Container";
import { FormInput, RadioGroupComponent } from '@/components/Form';
import ErrorMessages from '@/components/ErrorMessages';

// Other
import { logECS, routePath } from '@/utils/index';
import { useToast } from '@/context/ToastContext';
import { addProjectCollaboratorAction } from './actions/index';
import { CollaboratorResponse } from '@/app/types';

// Email validation regex pattern
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;


const ProjectsProjectCollaborationInvite = () => {
  // Get projectId param
  const params = useParams();
  const router = useRouter();
  const projectId = String(params.projectId);

  // Localization keys
  const Global = useTranslations('Global');
  const ProjectsProjectCollaboration = useTranslations('ProjectsProjectCollaboration');
  const t = useTranslations('ProjectsProjectCollaborationInvite');

  const toastState = useToast(); // Access the toast state from context

  // State management with useState
  const [accessLevel, setAccessLevel] = useState<string>('edit');
  const [email, setEmail] = useState<string>('');
  const [errorMessages, setErrorMessages] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [invitedEmail, setInvitedEmail] = useState<string>('');
  const [emailError, setEmailError] = useState<string | null>(null);

  // To be used in the translation key for the modal
  const accessLevelDescription =
    accessLevel === 'comment'
      ? t('accessLevelOn', { accessLevel })
      : accessLevel; //e.g.

  // Set refs for error messages and scrolling
  const errorRef = useRef<HTMLDivElement | null>(null);

  // Route paths
  const INVITE_ROUTE = routePath('projects.collaboration.invite', { projectId });
  const MEMBERS_ROUTE = routePath('projects.members.index', { projectId });
  const COLLABORATION_ROUTE = routePath('projects.collaboration', { projectId });

  // Handle access level radio button change
  const handleRadioChange = (value: string) => {
    setAccessLevel(value);
  };

  // Handle change to email input field
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Reset email error when user starts typing
    setEmailError(null);
    setEmail(e.target.value);
  }

  // Close modal and redirect to Collaboration page
  const handleModalClose = () => {
    setIsModalOpen(false);
    // Reset form after closing the modal
    setEmail('');
    // Redirect back to collaboration page
    router.push(COLLABORATION_ROUTE);
  };

  // Go to project page
  const handleGoToProject = () => {
    setIsModalOpen(false);
    // Reset form after closing the modal
    setEmail('');
    // Redirect to project page
    router.push(`/projects/${projectId}`);
  };

  // Validate email before submitting
  const validateEmail = (email: string): boolean => {
    return EMAIL_REGEX.test(email);
  };

  // Use Server Action to add project collaborator
  const addProjectCollaborator = async (email: string, accessLevel: string): Promise<CollaboratorResponse> => {
    // Don't need a try-catch block here, as the error is handled in the server action
    const response = await addProjectCollaboratorAction({
      projectId: Number(projectId),
      email,
      accessLevel: accessLevel.toUpperCase(),
    });

    if (response.redirect) {
      router.push(response.redirect);
    }

    return {
      success: response.success,
      errors: response.errors,
      data: response.data,
    };
  }

  // Handle form submission to add project collaborator
  const handleAddProjectCollaborator = async (e: React.FormEvent) => {
    e.preventDefault();

    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    // Extract email and access level from form data
    const emailValue = formData.get('email') as string;

    // Validate email field
    if (!emailValue || !validateEmail(emailValue)) {
      setEmailError(t('messaging.errors.email'));
      return;
    }

    const result = await addProjectCollaborator(email, accessLevel);

    if (!result.success) {
      const errors = result.errors;

      // Check if errors is an array or an object
      if (Array.isArray(errors)) {
        logECS('error', 'addProjectCollaborator', {
          errors,
          url: { path: INVITE_ROUTE }
        });
        //Handle errors as an array
        setErrorMessages([...errorMessages, Global('messaging.somethingWentWrong')]);
      } else if (result.data?.errors?.general) {
        // Handle general error from failed result
        toastState.add(result.data.errors.general, { type: 'error' });
      }
    } else {
      if (result.data?.errors?.general) {
        const errorMsg = result.data.errors.general;
        toastState.add(errorMsg, { type: 'error' });
      } else {
        if (result.data?.errors?.email) {
          setErrorMessages([...errorMessages, result.data.errors.email]);
        }
        // Store the email for use in the modal
        setInvitedEmail(email);

        // Open the confirmation modal
        setIsModalOpen(true);
      }
    }
  };


  return (
    <>
      <PageHeader
        title={t('title')}
        description=""
        showBackButton={false}
        breadcrumbs={
          <Breadcrumbs>
            <Breadcrumb><Link href={routePath('app.home')}>{Global('breadcrumbs.home')}</Link></Breadcrumb>
            <Breadcrumb><Link href={routePath('projects.index')}>{Global('breadcrumbs.projects')}</Link></Breadcrumb>
            <Breadcrumb><Link href={routePath('projects.show', { projectId })}>{Global('breadcrumbs.project')}</Link></Breadcrumb>
            <Breadcrumb><Link href={routePath('projects.collaboration', { projectId })}>{Global('breadcrumbs.feedback')}</Link></Breadcrumb>
            <Breadcrumb>{t('title')}</Breadcrumb>
          </Breadcrumbs >
        }
        actions={
          <>
          </>
        }
        className="page-project-members"
      />

      <ErrorMessages errors={errorMessages} ref={errorRef} />
      <LayoutContainer>
        <ContentContainer>
          <div >
            <Form onSubmit={handleAddProjectCollaborator} data-testid="add-collaborator-form">
              <div>
                <FormInput
                  name="email"
                  type="email"
                  value={email}
                  onChange={handleInputChange}
                  isRequired={true}
                  label={t('formLabels.email')}
                  placeholder={t('placeHolders.email')}
                  isInvalid={!emailError ? false : true}
                  errorMessage={t('messaging.errors.email')}
                />
              </div>

              <div>
                <RadioGroupComponent
                  name="accessLevel"
                  value={accessLevel}
                  radioGroupLabel={t('radioButtons.access.label')}
                  onChange={handleRadioChange}
                >
                  <div>
                    <Radio value="edit">{ProjectsProjectCollaboration('canEdit')}</Radio>
                  </div>
                  <div>
                    <Radio value="comment">{ProjectsProjectCollaboration('canComment')}</Radio>
                  </div>
                  <div>
                    <Radio value="own">{ProjectsProjectCollaboration('own')}</Radio>
                  </div>
                </RadioGroupComponent>
              </div>

              <div>
                <Button
                  type="submit"
                  className="react-aria-Button react-aria-Button--primary"
                >
                  {t('buttons.grantAccess')}
                </Button>
              </div>

              <div>
                <p>
                  {t.rich('para1', {
                    strong: (chunks) => <strong>{chunks}</strong>
                  })}
                </p>
                <p>
                  {t('para2')}
                </p>
                <p>
                  <Link href="/help/sharing" className="text-base underline">{Global('links.learnMore')}</Link>
                </p>
              </div>
            </Form>
          </div>
        </ContentContainer>
      </LayoutContainer>

      {/* Confirmation Modal */}
      < Modal
        isDismissable
        isOpen={isModalOpen}
        onOpenChange={(isOpen) => setIsModalOpen(isOpen)}
        data-testid="invite-confirmation-modal"
      >
        <Dialog
          aria-labelledby="invite-confirmation">
          <div >
            <h2 id="invite-confirmation">{t('headings.h2InviteSent')}</h2>

            <p >
              {t.rich('para3', {
                strong: (chunks) => <strong>{chunks}</strong>,
                email: invitedEmail
              })}

            </p>
            <hr />

            <p >
              {t.rich('para4', {
                projectmember: (chunks) => <a href={MEMBERS_ROUTE}>{chunks}</a>
              })}
            </p>
            <p>

              {t('para5', { access: accessLevelDescription })}
            </p>
          </div>
          <div className="button-container">
            <Button className="react-aria-Button react-aria-Button--primary" onPress={handleGoToProject}>{Global('buttons.goToProject')}</Button>
            <Button data-secondary className="secondary" onPress={handleModalClose}>{Global('buttons.close')}</Button>
          </div>
        </Dialog>
      </Modal >
    </>
  );
};

export default ProjectsProjectCollaborationInvite;
