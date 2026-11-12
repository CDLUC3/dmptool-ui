'use client';

import React, {
  useState,
  type TransitionStartFunction
} from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import { useLazyQuery } from '@apollo/client/react';
import {
  Breadcrumb,
  Breadcrumbs,
  Form,
  Link,
} from "react-aria-components";
import sanitizeHtml from 'sanitize-html';

// Components
import PageHeader from "@/components/PageHeader";
import TemplateSelectTemplatePage from '@/components/SelectExistingTemplate';
import { ContentContainer, LayoutContainer, } from '@/components/Container';
import FormInput from '@/components/Form/FormInput';
import { TransitionButton } from '@/components/Form';

// GraphQL
import { TemplateNameAvailableDocument } from '@/generated/graphql';

// Utils
import { useQueryStep } from '@/app/[locale]/template/create/useQueryStep';
import { handleApolloError } from '@/utils/apolloErrorHandler';

const TemplateCreatePage: React.FC = () => {
  const router = useRouter();
  const [templateName, setTemplateName] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const step = useQueryStep();

  //Localization keys
  const TemplateCreate = useTranslations('TemplateCreatePage');
  const Global = useTranslations('Global');

  const [checkTemplateName] = useLazyQuery(TemplateNameAvailableDocument, {
    fetchPolicy: 'network-only',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrors({});
    setTemplateName(e.target.value);
  };

  const handleNext = async ({ startTransition }: { startTransition: TransitionStartFunction }) => {
    setErrors({});

    const sanitizedName = sanitizeHtml(templateName);
    if (sanitizedName.length <= 2) {
      setErrors({ templateName: TemplateCreate('messages.templateNameError') });
      return;
    }

    try {
      const { data, error } = await checkTemplateName({
        variables: { name: sanitizedName.trim() },
      });

      if (error) {
        const { wasRealError } = handleApolloError(error, 'TemplateCreatePage.handleNext');
        if (wasRealError) {
          setErrors({ templateName: TemplateCreate('messages.templateNameCheckError') });
        }
        return;
      }

      const isAvailable = data?.templateNameAvailable;
      if (isAvailable === undefined) {
        setErrors({ templateName: TemplateCreate('messages.templateNameCheckError') });
        return;
      }

      if (!isAvailable) {
        setErrors({ templateName: TemplateCreate('messages.templateNameTaken') });
        return;
      }
    } catch (err) {
      const { wasRealError } = handleApolloError(err, 'TemplateCreatePage.handleNext');
      if (wasRealError) {
        setErrors({ templateName: TemplateCreate('messages.templateNameCheckError') });
      }
      return;
    }

    startTransition(() => {
      router.push('/template/create?step=2');
    });
  };

  return (
    <>
      {step === 1 && (
        <>
          <PageHeader
            title={Global('breadcrumbs.createTemplate')}
            showBackButton={false}
            breadcrumbs={
              <Breadcrumbs>
                <Breadcrumb><Link href="/">{Global('breadcrumbs.home')}</Link></Breadcrumb>
                <Breadcrumb><Link href="/template">{Global('breadcrumbs.template')}</Link></Breadcrumb>
                <Breadcrumb>{Global('breadcrumbs.createTemplate')}</Breadcrumb>
              </Breadcrumbs>
            }
            actions={null}
            className="page-template-list"
          />

          <LayoutContainer>
            <ContentContainer>
              <Form onSubmit={(e) => e.preventDefault()}>
                <FormInput
                  name="templateName"
                  type="text"
                  label={TemplateCreate('nameOfYourTemplate')}
                  placeholder=""
                  value={templateName}
                  onChange={handleInputChange}
                  helpMessage={TemplateCreate('helpText')}
                  errorMessage={errors.templateName ? errors.templateName : ''}
                  isInvalid={!!errors.templateName}
                />

                <TransitionButton type="submit" onPress={handleNext}>
                  {Global('buttons.next')}
                </TransitionButton>
              </Form>
            </ContentContainer>
          </LayoutContainer>
        </>
      )}
      {step == 2 && (
        <TemplateSelectTemplatePage
          templateName={sanitizeHtml(templateName)}
        />
      )}

    </>
  );
}

export default TemplateCreatePage;
