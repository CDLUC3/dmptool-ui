import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Button, Form, } from "react-aria-components";
import { useMutation } from '@apollo/client/react';

// Graphql mutations
import {
  MeDocument,
  AddUserEmailDocument,
  UserEmailErrors,
  RemoveUserEmailDocument,
  SetPrimaryUserEmailDocument
} from '@/generated/graphql';

// Components
import EmailAddressRow from '@/components/EmailAddressRow';
import FormInput from '@/components/Form/FormInput';
import ErrorMessages from '@/components/ErrorMessages';
//Interfaces
import { EmailInterface } from '@/app/types';
// Utils and other
import logECS from '@/utils/clientLogger';
import styles from './updateEmailAddress.module.scss';
import { useToast } from '@/context/ToastContext';
import { routePath } from '@/utils/routes';

const GET_USER = MeDocument;

export interface UpdateEmailAddressProps {
  emailAddresses: EmailInterface[];
}

const UpdateEmailAddress: React.FC<UpdateEmailAddressProps> = ({
  emailAddresses,
}) => {
  const t = useTranslations('UserProfile');
  const toastState = useToast(); // Access the toast state from context
  const [errors, setErrors] = useState<UserEmailErrors>({});
  const [addAliasValue, setAddAliasValue] = useState<string>('');

  // Initialize graphql mutations for component
  const [setPrimaryUserEmailMutation] = useMutation(SetPrimaryUserEmailDocument);
  const [addUserEmailMutation] = useMutation(AddUserEmailDocument);
  const [removeUserEmailMutation] = useMutation(RemoveUserEmailDocument);

  const clearErrors = () => {
    setErrors({});
  }

  // Set given email as isPrimary
  const makePrimaryEmail = async (primaryEmail: string) => {
    try {
      const response = await setPrimaryUserEmailMutation({
        variables: {
          email: primaryEmail,
        },
        refetchQueries: [
          {
            query: GET_USER,
          },
        ],
      });

      const emailArray = response?.data?.setPrimaryUserEmail || [];
      let foundError = false;
      /* eslint-disable @typescript-eslint/no-explicit-any */
      emailArray.forEach((emailObj: any) => {
        if (emailObj.errors?.general || emailObj.errors?.email) {
          const errorMessage = emailObj.errors.email || emailObj.errors.general;
          setErrors(prevErrors => ({ ...prevErrors, general: errorMessage[0] }));
          foundError = true;
        }
      });

      if (!foundError) {
        clearErrors();
      }
    } catch (err) {
      // Display other errors
      setErrors(prevErrors => ({
        ...prevErrors,
        general: t('messages.errorSettingPrimaryEmail')
      }));
      logECS('error', 'makePrimaryEmail', {
        error: err,
        url: { path: routePath('account.profile') }
      });
    }
  }


  // Show Success Message
  const showSuccessToast = () => {
    const successMessage = t('messages.emailAddressUpdateSuccess');
    toastState.add(successMessage, {
      type: 'success',
      priority: 1,
      timeout: 10000
    });
  }
  // Adding new email alias
  const handleAddingAlias = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    clearErrors();
    try {
      const response = await addUserEmailMutation({
        variables: {
          email: addAliasValue,
          isPrimary: false
        },
        refetchQueries: [
          {
            query: GET_USER,
          },
        ],
      });

      const emailData = response?.data?.addUserEmail;
      if (emailData?.errors && Object.keys(emailData.errors).length > 0) {
        const errorMessage = emailData?.errors.email || emailData?.errors.general;
        setErrors(prevErrors => {
          return {
            ...prevErrors,
            email: errorMessage
          }
        });
      }
      // Clear the add alias input field
      setAddAliasValue('');
      showSuccessToast();
    } catch (err) {
      // Display other errors
      setErrors(prevErrors => ({
        ...prevErrors,
        general: t("messages.errorAddingNewEmail")
      }));
      logECS('error', 'handleAddingAlias', {
        error: err,
        url: { path: routePath('account.profile') }
      });
    }
  }

  // Delete provided email
  const deleteEmail = async (emailToDelete: string) => {
    try {
      const response = await removeUserEmailMutation({
        variables: {
          email: emailToDelete
        },
        refetchQueries: [
          {
            query: GET_USER,
          },
        ],
      })

      const emailData = response?.data?.removeUserEmail;
      if (emailData?.errors && Object.keys(emailData.errors).length > 0) {
        setErrors(emailData.errors ?? {});
        return;
      }
      clearErrors();
    } catch (err) {
      // Display other errors
      setErrors(prevErrors => ({
        ...prevErrors,
        general: t('messages.errorDeletingEmail')
      }));
      logECS('error', 'deleteEmail', {
        error: err,
        url: { path: routePath('account.profile') }
      });
    }
  }

  const handleAliasChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAddAliasValue(value);
  }

  /*Reset errors when email addresses change so that
  errors don't continue to display on page*/
  useEffect(() => {
    setErrors({});
  }, [emailAddresses])

  return (
    <div>
      <h2 className={styles.title}>{t('emailAndAuth')}</h2>
      <div className="sectionContainer">
        <div className="sectionContent">
          <div className={styles.subSection}>
            <ErrorMessages errors={[errors?.general ? errors?.general : '']} />

            <h3 className="mt-0 mb-2">{t('headingPrimaryEmail')}</h3>
            <p className={"my-1 pb-0"}>{t('primaryEmailDesc')}</p>

            {/* Render the primary email */}
            {emailAddresses.filter(emailObj => emailObj.isPrimary).map((emailObj) => (
              <EmailAddressRow
                key={emailObj.email}
                email={emailObj.email}
                isAlias={false}
                deleteDisabled
              />
            ))}
            <div className="mt-2">
              <p className={"mb-1 pb-0"}><strong>{t('headingSSO')}</strong></p>
              <p className={"my-0 pb-0"}>{t('SSODesc')}</p>

              <p className={"mb-1 pb-0"}>
                <strong>{t('headingNotifications')}</strong></p>
              <p className={"my-0 pb-4"}>{t.rich('notificationsDesc', {
                manage: (chunks) => <Link
                  href={routePath('account.notifications')}
                  target="_blank">{chunks}</Link>
              })}</p>
            </div>
            <hr />
          </div>
          <div className={styles.subSection}>

            <h3 className="mb-2">{t('headingAliasEmailAddr')}</h3>
            <p className="mt-0">{t('aliasEmailDesc')}</p>

            {emailAddresses.filter(emailObj => !emailObj.isPrimary).map((emailObj) => (
              <EmailAddressRow
                key={emailObj.email}
                email={emailObj.email}
                isAlias={true}
                deleteEmail={deleteEmail}
                makePrimaryEmail={makePrimaryEmail}
              />
            ))}

            <Form onSubmit={e => handleAddingAlias(e)}>
              <div className={styles.addContainer}>
                <FormInput
                  name="addAlias"
                  type="text"
                  label={t('headingAddAliasEmail')}
                  className={`${styles.addAliasTextField} react-aria-TextField`}
                  isInvalid={errors?.email ? true : false}
                  errorMessage={errors?.email ?? ''}
                  helpMessage={t('helpTextForAddAlias')}
                  onChange={handleAliasChange}
                  value={addAliasValue}
                />
                <Button type="submit">{t('btnAdd')}</Button>
              </div>
            </Form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UpdateEmailAddress;
