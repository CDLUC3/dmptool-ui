'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { useRouter } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { useQuery, useMutation } from '@apollo/client/react';
import {
  Breadcrumb,
  Breadcrumbs,
  Button,
  Dialog,
  DialogTrigger,
  Form,
  Link,
  Modal,
  ModalOverlay,
} from "react-aria-components";

// GraphQL
import {
  AddQuestionCustomizationDocument,
  UpdateQuestionCustomizationDocument,
  RemoveQuestionCustomizationDocument,
  QuestionCustomizationByVersionedQuestionDocument,
  PublishedQuestionDocument,
  QuestionCustomizationErrors,
  MeDocument,
} from '@/generated/graphql';

import { Question } from '@/app/types';

// Components
import PageHeader from "@/components/PageHeader";
import {
  ContentContainer,
  LayoutWithPanel,
  SidebarPanel,
} from '@/components/Container';
import FormTextArea from '@/components/Form/FormTextArea';
import ErrorMessages from '@/components/ErrorMessages';
import Loading from '@/components/Loading';
import { DmpIcon } from "@/components/Icons";
import QuestionView from '@/components/QuestionView';
import QuestionPreview from '@/components/QuestionPreview';

// Utils
import { SanitizeHTML } from '@/utils/sanitize';
import logECS from '@/utils/clientLogger';
import { useToast } from '@/context/ToastContext';
import { scrollToTop } from '@/utils/general';
import { routePath } from '@/utils/routes';
import { extractErrors } from '@/utils/errorHandler';
import { stripHtmlTags } from '@/utils/general';
import styles from './questionCustomEdit.module.scss';

const QuestionCustomizePage: React.FC = () => {
  const toastState = useToast();
  const params = useParams();
  const router = useRouter();

  const templateCustomizationId = String(params.templateCustomizationId);
  const versionedQuestionId = String(params.versionedQuestionId);

  const hasInitialized = useRef(false);
  const errorRef = useRef<HTMLDivElement | null>(null);

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [questionCustomizationId, setQuestionCustomizationId] = useState<number | null>(null);
  const [errorMessages, setErrorMessages] = useState<string[]>([]);

  // Base question data from the published question - used for preview and as reference for customization
  const [baseQuestion, setBaseQuestion] = useState<Question | undefined>(undefined);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Customizable fields
  const [customQuestionData, setCustomQuestionData] = useState({
    guidanceText: '',
    sampleText: '',
  });

  // Localization
  const Global = useTranslations('Global');
  const QuestionCustomize = useTranslations('QuestionCustomize');
  const QuestionEdit = useTranslations('QuestionEdit');

  // URLs
  const TEMPLATE_URL = routePath('template.customize', { templateCustomizationId });
  const UPDATE_QUESTION_URL = routePath('template.customize.question', { templateCustomizationId, versionedQuestionId });

  // Mutations
  const [addQuestionCustomization] = useMutation(AddQuestionCustomizationDocument);
  const [updateQuestionCustomization] = useMutation(UpdateQuestionCustomizationDocument);
  const [removeQuestionCustomization] = useMutation(RemoveQuestionCustomizationDocument);

  // Queries
  const { data: publishedQuestion, loading: publishedQuestionLoading } = useQuery(PublishedQuestionDocument, {
    variables: { versionedQuestionId: Number(versionedQuestionId) },
  });

  const { data: meData, loading: meLoading } = useQuery(MeDocument);

  const { data: questionCustomization, loading: questionCustomizationLoading } = useQuery(
    QuestionCustomizationByVersionedQuestionDocument,
    {
      variables: {
        templateCustomizationId: Number(templateCustomizationId),
        versionedQuestionId: Number(versionedQuestionId),
      },
    }
  );

  const updateCustomQuestionContent = (key: string, value: string | boolean) => {
    setCustomQuestionData(prev => ({ ...prev, [key]: value }));
    setHasUnsavedChanges(true);
  };

  const handleSave = async (): Promise<[Record<string, string | null | undefined>, boolean]> => {
    try {
      const response = await updateQuestionCustomization({
        variables: {
          input: {
            questionCustomizationId: Number(questionCustomizationId),
            guidanceText: customQuestionData.guidanceText,
            sampleText: customQuestionData.sampleText,
          },
        },
        refetchQueries: [QuestionCustomizationByVersionedQuestionDocument]
      });

      const responseErrors = response.data?.updateQuestionCustomization?.errors;
      if (responseErrors && Object.values(responseErrors).some(err => err && err !== 'QuestionCustomizationErrors')) {
        return [responseErrors, false];
      }

      return [{}, true];
    } catch (error) {
      logECS('error', 'updateQuestionCustomization', {
        error,
        url: { path: UPDATE_QUESTION_URL },
      });
      setErrorMessages([QuestionCustomize('messages.error.errorUpdatingCustomization')]);
      return [{}, false];
    }
  };

  const handleDeleteQuestionCustomization = async () => {
    if (isDeleting) return;
    setIsDeleting(true);
    setErrorMessages([]);

    try {
      const response = await removeQuestionCustomization({
        variables: { questionCustomizationId: Number(questionCustomizationId) },
        refetchQueries: [QuestionCustomizationByVersionedQuestionDocument],
      });

      const responseErrors = response.data?.removeQuestionCustomization?.errors;
      if (responseErrors && Object.keys(responseErrors).length > 0) {
        const errs = extractErrors<QuestionCustomizationErrors>(responseErrors, ['general', 'guidanceText', 'sampleText']);
        if (errs.length > 0) {
          setErrorMessages(errs);
          return;
        }
      }

      toastState.add(QuestionCustomize('messages.success.successfullyDeletedCustomization'), { type: 'success' });
      setIsRedirecting(true);
      router.push(TEMPLATE_URL);
    } catch (error) {
      logECS('error', 'deleteQuestionCustomization', {
        error,
        url: { path: UPDATE_QUESTION_URL },
      });
      setErrorMessages([QuestionCustomize('messages.error.errorDeletingCustomization')]);
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    setErrorMessages([]);

    const [errors, success] = await handleSave();

    if (!success) {
      setErrorMessages([errors?.general ?? QuestionCustomize('messages.error.errorUpdatingCustomization')]);
      setIsSubmitting(false);
    } else {
      setHasUnsavedChanges(false);
      toastState.add(QuestionCustomize('messages.success.successfullyUpdatedCustomization'), { type: 'success' });
      setIsRedirecting(true);
      router.push(TEMPLATE_URL);
    }
  };

  // Initialize or load existing customization
  useEffect(() => {
    const initializeCustomization = async () => {
      if (hasInitialized.current || questionCustomizationLoading) return;
      hasInitialized.current = true;

      if (!questionCustomization?.questionCustomizationByVersionedQuestion) {
        // No existing customization — create one
        const response = await addQuestionCustomization({
          variables: {
            input: {
              templateCustomizationId: Number(templateCustomizationId),
              versionedQuestionId: Number(versionedQuestionId),
            },
          },
        });
        setQuestionCustomizationId(response.data?.addQuestionCustomization?.id ?? null);
      } else {
        const existing = questionCustomization.questionCustomizationByVersionedQuestion;
        setQuestionCustomizationId(existing.id ?? null);
        setCustomQuestionData({
          guidanceText: existing.guidanceText ?? '',
          sampleText: existing.sampleText ?? '',
        });
      }
    };

    initializeCustomization();
  }, [questionCustomizationLoading, questionCustomization]);

  // Warn on unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Scroll errors into view
  useEffect(() => {
    if (errorMessages.length > 0) scrollToTop(errorRef);
  }, [errorMessages]);

  useEffect(() => {
    if (publishedQuestion?.publishedQuestion) {
      const q = publishedQuestion.publishedQuestion;
      setBaseQuestion({
        id: q.id,
        displayOrder: q.displayOrder,
        questionText: stripHtmlTags(q.questionText) ?? null,
        requirementText: q.requirementText ?? null,
        guidanceText: q.guidanceText ?? null,
        sampleText: q.sampleText ?? null,
        useSampleTextAsDefault: q.useSampleTextAsDefault ?? false,
        required: q.required ?? false,
        json: q.json ?? null,
        templateId: q.versionedTemplateId ?? null,
        ownerAffiliation: q.ownerAffiliation ? {
          acronyms: q.ownerAffiliation.acronyms ?? null,
          displayName: q.ownerAffiliation.displayName,
          uri: q.ownerAffiliation.uri,
          name: q.ownerAffiliation.name,
        } : null,
      });
    }
  }, [publishedQuestion]);


  if (publishedQuestionLoading || meLoading || questionCustomizationLoading) return <Loading message={Global('messaging.loading')} />;
  if (isRedirecting) return <Loading message={Global('messaging.loading')} />;

  return (
    <>
      <PageHeader
        title={QuestionCustomize('title')}
        description=""
        showBackButton={false}
        breadcrumbs={
          <Breadcrumbs>
            <Breadcrumb><Link href={routePath('app.home')}>{Global('breadcrumbs.home')}</Link></Breadcrumb>
            <Breadcrumb><Link href={routePath('template.customizations')}>{Global('breadcrumbs.templateCustomizations')}</Link></Breadcrumb>
            <Breadcrumb><Link href={TEMPLATE_URL}>{Global('breadcrumbs.editTemplate')}</Link></Breadcrumb>
            <Breadcrumb>{QuestionCustomize('title')}</Breadcrumb>
          </Breadcrumbs>
        }
        actions={null}
        className=""
      />

      <LayoutWithPanel>
        <ContentContainer>

          <div className={styles.questionContainer}>
            <ErrorMessages errors={errorMessages} ref={errorRef} />

            <Form onSubmit={handleFormSubmit}>
              {baseQuestion?.requirementText && (
                <div className="field-display">
                  <h2>{QuestionCustomize('labels.requirements')}</h2>
                  <SanitizeHTML html={baseQuestion?.requirementText} />
                </div>
              )}

              {baseQuestion && (
                <div className={styles.baseQuestionPreview}>
                  {/**Key the inert div so it remounts when preview closes */}
                  <div
                    key={String(isPreviewOpen)}
                    className={styles.baseQuestionView}
                    inert
                  >
                    <QuestionView
                      isPreview={true}
                      question={baseQuestion}
                      isDisabled={true}
                      path={routePath('template.customize', { templateCustomizationId })}
                      cardOnly={true}
                    />
                  </div>
                </div>
              )}


              {baseQuestion?.guidanceText && (
                <div className="field-display">
                  <h2>{QuestionCustomize('labels.guidance')}</h2>
                  <SanitizeHTML html={baseQuestion?.guidanceText} />
                </div>
              )}

              {/* Editable customization fields */}
              <div className={styles.additionalGuidance}>
                <FormTextArea
                  name="guidanceText"
                  isRequired={false}
                  richText={true}
                  label={QuestionCustomize('labels.additionalGuidanceText')}
                  helpMessage={QuestionCustomize('helpText.additionalGuidanceText')}
                  value={customQuestionData.guidanceText}
                  onChange={(value) => updateCustomQuestionContent('guidanceText', value)}
                />
              </div>

              {baseQuestion?.sampleText && (
                <>
                  <div className="field-display">
                    <h2>{QuestionCustomize('labels.sampleText')}</h2>
                    <SanitizeHTML html={baseQuestion?.sampleText} />
                  </div>

                  <div className={styles.additionalSampleText}>
                    <FormTextArea
                      name="sampleText"
                      isRequired={false}
                      richText={true}
                      label={QuestionCustomize('labels.additionalSampleText')}
                      helpMessage={QuestionCustomize('helpText.additionalSampleText')}
                      value={customQuestionData?.sampleText}
                      onChange={(value) => updateCustomQuestionContent('sampleText', value)}
                    />
                  </div>
                </>
              )}

              <Button
                type="submit"
                aria-disabled={isSubmitting}
                isDisabled={isSubmitting}
              >
                {isSubmitting ? Global('buttons.saving') : Global('buttons.saveAndUpdate')}
              </Button>
            </Form>

            {/* Delete customization */}
            <div className={styles.deleteQuestionCustomizationContainer}>
              <h3>{QuestionCustomize('buttons.deleteCustomization')}</h3>
              <p className={styles.dangerZoneDescription}><DmpIcon icon="warning" />{QuestionCustomize.rich("descriptions.deleteCustomization", {
                strong: (chunks) => <strong>{chunks}</strong>
              })}</p>
              <DialogTrigger isOpen={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
                <Button className="danger" isDisabled={isDeleting}>
                  {isDeleting
                    ? `${QuestionCustomize('buttons.deletingCustomization')}...`
                    : QuestionCustomize('buttons.deleteCustomization')}
                </Button>
                <ModalOverlay>
                  <Modal>
                    <Dialog>
                      {({ close }) => (
                        <>
                          <h3>{QuestionCustomize('heading.deleteCustomization')}</h3>
                          <p className={styles.dangerZoneDescription}>{QuestionCustomize.rich("descriptions.deleteCustomization", {
                            strong: (chunks) => <strong>{chunks}</strong>
                          })}</p>
                          <div className={styles.deleteConfirmButtons}>
                            <Button className="secondary" autoFocus onPress={close}>
                              {Global('buttons.cancel')}
                            </Button>
                            <Button className="danger" onPress={() => { handleDeleteQuestionCustomization(); }}>
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
        </ContentContainer >
        <SidebarPanel>
          <>
            <h2>{Global('headings.preview')}</h2>
            <p>{QuestionEdit('descriptions.previewText')}</p>
            {/** When modal closes, isPreviewOpen flips from true -> false, the key changes and React unmounts and remounts the inert QuestionView 
             * with a fresh TinyMCEEditor instance. This was needed because sometimes the TinyMCEEditor did not rerender after coming back from Preview*/}
            <QuestionPreview
              buttonLabel={QuestionEdit('buttons.previewQuestion')}
              previewDisabled={baseQuestion ? false : true}
              onOpenChange={setIsPreviewOpen}
            >
              <QuestionView
                isPreview={true}
                question={baseQuestion}
                path={routePath('template.customize.question', {
                  templateCustomizationId,
                  versionedQuestionId,
                })}
                isDisabled={true}
                orgGuidance={customQuestionData.guidanceText}
                org={meData?.me?.affiliation?.displayName ?? meData?.me?.affiliation?.name ?? ''}
              />
            </QuestionPreview>

            <h3>{QuestionEdit('headings.bestPractice')}</h3>
            <p>{QuestionEdit('descriptions.bestPracticePara1')}</p>
            <p>{QuestionEdit('descriptions.bestPracticePara2')}</p>
            <p>{QuestionEdit('descriptions.bestPracticePara3')}</p>
          </>
        </SidebarPanel>
      </LayoutWithPanel >
    </>
  );
};

export default QuestionCustomizePage;