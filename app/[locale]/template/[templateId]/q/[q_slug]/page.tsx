'use client'

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useQuery } from '@apollo/client/react';
import {
  Breadcrumb,
  Breadcrumbs,
  Button,
  Checkbox,
  Dialog,
  DialogTrigger,
  Form,
  Input,
  Label,
  Link,
  Modal,
  ModalOverlay,
  Radio,
  Tab,
  TabList,
  TabPanel,
  Tabs,
  Text,
  TextField
} from "react-aria-components";

// GraphQL
import {
  QuestionDocument,
  QuestionsDocument
} from '@/generated/graphql';

import {
  removeQuestionAction,
  updateQuestionAction
} from './actions/index';

import {
  AnyParsedQuestion,
  Question,
  QuestionOption,
  QuestionOptions,
  QuestionFormatInterface,
  RemoveQuestionErrors,
  UpdateQuestionErrors,
} from '@/app/types';
import { DisplayLogic } from '@/app/types/displayLogic';

// Components
import PageHeader from "@/components/PageHeader";
import QuestionOptionsComponent
  from '@/components/Form/QuestionOptionsComponent';
import QuestionPreview from '@/components/QuestionPreview';
import {
  FormTextArea,
  RadioGroupComponent,
  RangeComponent,
  TypeAheadSearch,
  ResearchOutputComponent
} from '@/components/Form';
import DisplayLogicComponent from './DisplayLogicComponent';
import ErrorMessages from '@/components/ErrorMessages';
import QuestionView from '@/components/QuestionView';
import { getParsedQuestionJSON } from '@/components/hooks/getParsedQuestionJSON';
import { TransitionButton } from "@/components/Form";
import Loading from '@/components/Loading';

//Utils and Other
import { useResearchOutputTable } from '@/app/hooks/useResearchOutputTable';
import { useTriggerQuestions } from './hooks/useTriggerQuestions';
import { useToast } from '@/context/ToastContext';
import { routePath } from '@/utils/routes';
import { stripHtmlTags } from '@/utils/general';
import logECS from '@/utils/clientLogger';
import { extractErrors } from "@/utils/errorHandler";
import {
  getQuestionFormatInfo,
  getQuestionTypes,
  questionTypeHandlers
} from '@/utils/questionTypeHandlers';

import {
  RANGE_QUESTION_TYPE,
  TYPEAHEAD_QUESTION_TYPE,
  DATE_RANGE_QUESTION_TYPE,
  NUMBER_RANGE_QUESTION_TYPE,
  TEXT_AREA_QUESTION_TYPE,
  RESEARCH_OUTPUT_QUESTION_TYPE,
  QUESTION_TYPES_EXCLUDED_FROM_COMMENT_FIELD,
} from '@/lib/constants';
import {
  isOptionsType,
  getOverrides,
} from '@/app/hooks/useEditQuestion';
import {
  toSaveInput,
} from './displayLogicMapper';
import styles from './questionEdit.module.scss';

const QuestionEdit = () => {
  // hooks
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const toastState = useToast();

  // params
  const templateId = String(params.templateId);
  const questionId = String(params.q_slug); //question id
  const questionTypeIdQueryParam = searchParams.get('questionType') || null;

  //For scrolling to error in page
  const errorRef = useRef<HTMLDivElement | null>(null);
  // Track whether the component has hydrated to avoid running certain effects on the server
  const hasHydrated = useRef(false);
  // Track whether there are unsaved changes
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  // Form state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSavingLogic, setIsSavingLogic] = useState<boolean>(false);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  // State for managing form inputs
  const [question, setQuestion] = useState<Question>();
  const [rows, setRows] = useState<QuestionOptions[]>([{ id: 0, text: "", isSelected: false }]);
  const [questionType, setQuestionType] = useState<string>('');
  const [questionTypeName, setQuestionTypeName] = useState<string>(''); // Added to store friendly question name
  const [formSubmitted, setFormSubmitted] = useState<boolean>(false);
  const [hasOptions, setHasOptions] = useState<boolean | null>(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [dateRangeLabels, setDateRangeLabels] = useState<{ start: string; end: string }>({ start: '', end: '' });
  const [typeaheadHelpText, setTypeAheadHelpText] = useState<string>('');
  const [typeaheadSearchLabel, setTypeaheadSearchLabel] = useState<string>('');
  const [parsedQuestionJSON, setParsedQuestionJSON] = useState<AnyParsedQuestion>();
  const [isConfirmOpen, setConfirmOpen] = useState(false);

  // Display logic tab state — null means "no logic configured yet",
  // which drives the empty state (description + Add Display Logic button).
  const [displayLogic, setDisplayLogic] = useState<DisplayLogic | null>(null);

  // Add state for live region announcements
  const [announcement, setAnnouncement] = useState('');

  // localization keys
  const Global = useTranslations('Global');
  const t = useTranslations('QuestionEdit');
  const QuestionAdd = useTranslations('QuestionAdd');

  // Set URLs
  const TEMPLATE_URL = routePath('template.show', { templateId });

  // Helper function to make announcements
  const announce = (message: string) => {
    setAnnouncement(message);
    // Clear after announcement is made
    setTimeout(() => setAnnouncement(''), 100);
  };

  // Research Output Table Hooks
  const {
    buildResearchOutputFormState,
    hydrateFromJSON,
    licensesData,
    defaultResearchOutputTypesData,
    expandedFields,
    nonCustomizableFieldIds,
    standardFields,
    additionalFields,
    newOutputType,
    setNewOutputType,
    newLicenseType,
    setNewLicenseType,
    handleRepositoriesChange,
    handleMetaDataStandardsChange,
    handleStandardFieldChange,
    handleCustomizeField,
    handleToggleMetaDataStandards,
    handleTogglePreferredRepositories,
    handleLicenseModeChange,
    handleAddCustomLicenseType,
    handleRemoveCustomLicenseType,
    handleOutputTypeModeChange,
    handleAddCustomOutputType,
    handleRemoveCustomOutputType,
    addAdditionalField,
    handleDeleteAdditionalField,
    handleUpdateAdditionalField,
    updateStandardFieldProperty
  } = useResearchOutputTable({ setHasUnsavedChanges, announce });

  // GraphQL Queries
  const {
    data: selectedQuestion,
    loading,
    error: selectedQuestionQueryError
  } = useQuery(QuestionDocument, {
    variables: {
      questionId: Number(questionId)
    }
  });

  // All questions in the same section as this one — the source list that
  // Display Logic's trigger-question dropdown filters down from.
  const {
    data: questionsData,
    loading: questionsLoading,
    error: questionsError
  } = useQuery(QuestionsDocument, {
    variables: { sectionId: selectedQuestion?.question?.sectionId ?? 0 },
    skip: !selectedQuestion?.question?.sectionId
  });


  // Candidate questions this question's display logic can trigger off of:
  // prior multiple-choice/checkbox questions in the same section.
  const { triggerQuestions } = useTriggerQuestions(
    questionsData?.questions,
    Number(questionId),
    (question?.displayOrder ? Number(question.displayOrder) : undefined)
  );

  // Update rows state and question.json when options change
  const updateRows = (newRows: QuestionOptions[]) => {
    setRows(newRows);

    if (hasOptions && questionType && question?.json) {
      const updatedJSON = buildUpdatedJSON(question, newRows);

      if (updatedJSON) {
        setQuestion((prev) => ({
          ...prev,
          json: JSON.stringify(updatedJSON.data),
        }));
        setHasUnsavedChanges(true);
      }
    }
  };

  // Return user back to the page to select a question type
  const redirectToQuestionTypes = () => {
    const sectionId = selectedQuestion?.question?.sectionId;
    // questionId as query param included to let page know that user is updating an existing question
    router.push(routePath('template.q.new', { templateId }, { section_id: sectionId, step: 1, questionId }))
  }

  //Handle change to Question Text
  const handleQuestionTextChange = (value: string) => {
    setQuestion(prev => ({
      ...prev,
      questionText: value
    }));
    setHasUnsavedChanges(true);
  };

  // Update common input fields when any of them change
  const handleInputChange = (field: keyof Question, value: string | boolean | undefined) => {
    setQuestion((prev) => ({
      ...prev,
      [field]: value === undefined ? '' : value, // Default to empty string if value is undefined
    }));
    setHasUnsavedChanges(true);
  };


  // Handle changes from RadioGroup
  const handleRadioChange = (value: string) => {
    if (value) {
      const isRequired = value === 'yes' ? true : false;
      setQuestion(prev => ({
        ...prev,
        required: isRequired
      }));
      setHasUnsavedChanges(true);
    }
  };

  // Handler for date range label changes
  const handleRangeLabelChange = (field: 'start' | 'end', value: string) => {
    setDateRangeLabels(prev => ({ ...prev, [field]: value }));

    if (parsedQuestionJSON && (parsedQuestionJSON?.type === "dateRange" || parsedQuestionJSON?.type === "numberRange")) {
      if (parsedQuestionJSON?.columns?.[field]) {
        const updatedParsed = structuredClone(parsedQuestionJSON); // To avoid mutating state directly
        updatedParsed.columns[field].label = value;
        setQuestion(prev => ({
          ...prev,
          json: JSON.stringify(updatedParsed),
        }));
        setHasUnsavedChanges(true);
      }
    }
  };

  // Handler for typeahead search label changes
  const handleTypeAheadSearchLabelChange = (value: string) => {
    setTypeaheadSearchLabel(value);

    if (parsedQuestionJSON && parsedQuestionJSON?.type === "affiliationSearch") {
      const updatedParsed = structuredClone(parsedQuestionJSON); // To avoid mutating state directly
      updatedParsed.attributes.label = value;
      setQuestion(prev => ({
        ...prev,
        json: JSON.stringify(updatedParsed),
      }));
      setHasUnsavedChanges(true);
    }
  };

  // Handler for typeahead help text changes
  const handleTypeAheadHelpTextChange = (value: string) => {
    setTypeAheadHelpText(value);

    if (parsedQuestionJSON && parsedQuestionJSON?.type === "affiliationSearch") {
      if (parsedQuestionJSON?.attributes?.help) {
        const updatedParsed = structuredClone(parsedQuestionJSON); // To avoid mutating state directly
        updatedParsed.attributes.help = value;
        setQuestion(prev => ({
          ...prev,
          json: JSON.stringify(updatedParsed),
        }));
        setHasUnsavedChanges(true);
      }
    }
  };

  // Handler for display logic changes (Display Logic tab)
  const handleDisplayLogicChange = (logic: DisplayLogic | null) => {
    setDisplayLogic(logic);
    setHasUnsavedChanges(true);
  };

  // Handler for saving display logic changes (Display Logic tab)
  const handleSaveDisplayLogic = async () => {
    if (!question) return;
    setIsSavingLogic(true);

    try {
      // Simulate a save until backend is implemented
      if (displayLogic) {
        toSaveInput(Number(questionId), displayLogic, triggerQuestions);
      }

      setHasUnsavedChanges(false);
      toastState.add(t('messages.success.displayLogicUpdated'), { type: 'success' });
    } catch {
      logECS('error', 'QuestionEdit.handleSaveDisplayLogic', {
        error: 'Invalid question type in parsed JSON',
        url: { path: routePath('template.q.slug', { templateId, q_slug: questionId }) }
      });
      setErrors(prev => [...prev, t('messages.error.errorSavingDisplayLogic')]);
    } finally {
      setIsSavingLogic(false);
    }
  };

  // Prepare input for the questionTypeHandler. For options questions, we update the 
  // values with rows state. For non-options questions, we use the parsed JSON
  const getFormState = (question: Question, rowsOverride?: QuestionOptions[]) => {
    if (hasOptions) {
      const useRows = rowsOverride ?? rows;
      return {
        options: useRows.map(row => ({
          label: row.text,
          value: row.text,
          selected: row.isSelected,
        })),
      };
    }

    const { parsed, error } = getParsedQuestionJSON(question, routePath('template.q.slug', { templateId, q_slug: questionId }), Global);

    if (questionType === RESEARCH_OUTPUT_QUESTION_TYPE) {
      return buildResearchOutputFormState();
    }

    if (!parsed) {
      if (error) {
        setErrors(prev => [...prev, error])
      }
      return;
    }
    return {
      ...parsed,
      attributes: {
        ...('attributes' in parsed ? parsed.attributes : {}),
        ...getOverrides(questionType),
      },
    };
  };

  // Pass the merged userInput to questionTypeHandlers to generate json and do type and schema validation
  const buildUpdatedJSON = (question: Question, rowsOverride?: QuestionOptions[]) => {
    const userInput = getFormState(question, rowsOverride);
    const { parsed, error } = getParsedQuestionJSON(question, routePath('template.q.slug', { templateId, q_slug: questionId }), Global);

    if (!parsed) {
      if (error) {
        setErrors(prev => [...prev, error])
      }
      return;
    }
    return questionTypeHandlers[questionType as keyof typeof questionTypeHandlers](
      parsed,
      userInput
    );
  };

  // Handle form submission to update the question
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitted(true);

    // Prevent double submission
    if (isSubmitting) return;
    setIsSubmitting(true);

    // Set formSubmitted to true to indicate the form has been submitted
    setFormSubmitted(true);

    if (question) {
      const updatedJSON = buildUpdatedJSON(question);
      const { success, error } = updatedJSON ?? {};

      if (success && !error) {
        // Strip all tags from questionText before sending to backend
        const cleanedQuestionText = stripHtmlTags(question.questionText ?? '');

        const response = await updateQuestionAction({
          questionId: Number(questionId),
          displayOrder: Number(question.displayOrder),
          json: JSON.stringify(updatedJSON ? updatedJSON.data : ''),
          questionText: cleanedQuestionText,
          requirementText: String(question.requirementText),
          guidanceText: String(question.guidanceText),
          sampleText: String(question.sampleText),
          useSampleTextAsDefault: question?.useSampleTextAsDefault || false,
          required: Boolean(question.required),
        });

        if (response.redirect) {
          router.push(response.redirect);
        }

        if (!response.success) {
          const errors = response.errors;
          setIsSubmitting(false);
          // Announcement for screen readers
          announce(QuestionAdd('researchOutput.announcements.errorOccurred') || 'An error occurred. Please check the form.');

          //Check if errors is an array or an object
          if (Array.isArray(errors)) {
            //Handle errors as an array
            setErrors(errors);
          }
        } else {
          if (response?.data?.errors) {
            const errs = extractErrors<UpdateQuestionErrors>(response?.data?.errors, ["general", "questionText"]);
            if (errs.length > 0) {
              setIsSubmitting(false);
              setErrors(errs);
            }
          }
          setHasUnsavedChanges(false);
          toastState.add(QuestionAdd('messages.success.questionUpdated'), { type: 'success' });
          // Redirect user to the Edit Question view with their new question id after successfully adding the new question
          router.push(TEMPLATE_URL);
        }
      }
    }
  };

  // Handle form submission to delete the question
  const handleDelete = async () => {
    const response = await removeQuestionAction({
      questionId: Number(questionId),
    });

    if (response.redirect) {
      router.push(response.redirect);
      return;
    }

    if (!response.success) {
      const errors = response.errors;

      //Check if errors is an array or an object
      if (Array.isArray(errors)) {
        //Handle errors as an array
        setErrors(errors);
      }
    } else {
      if (response?.data?.errors) {
        const errs = extractErrors<RemoveQuestionErrors>(response?.data?.errors, ["general", "guidanceText", "questionText", "requirementText", "sampleText"]);
        if (errs.length > 0) {
          setErrors(errs);
        } else {
          // Show success message and redirect to Edit Template page
          toastState.add(t('messages.success.questionRemoved'), { type: 'success' });
          router.push(TEMPLATE_URL);
        }
      }
    }
  };

  // Saves any query errors to errors state
  useEffect(() => {
    const allErrors = [];

    if (selectedQuestionQueryError) {
      allErrors.push(selectedQuestionQueryError.message);
    }

    if (questionsError) {
      allErrors.push(questionsError.message);
    }

    setErrors(allErrors);
  }, [selectedQuestionQueryError, questionsError]);

  // Set question details in state when data is loaded
  useEffect(() => {
    if (selectedQuestion?.question) {
      const q = {
        ...selectedQuestion.question,
        required: selectedQuestion.question.required ?? false // convert null to false
      };
      try {
        const { parsed, error } = getParsedQuestionJSON(q, routePath('template.show', { templateId }), Global);
        if (!parsed?.type) {
          if (error) {
            logECS('error', 'Parsing error', {
              error: 'Invalid question type in parsed JSON',
              url: { path: routePath('template.q.slug', { templateId, q_slug: questionId }) }
            });

            setErrors(prev => [...prev, error])
          }
          return;
        }

        const questionType = parsed.type;
        const translationKey = `questionTypes.${questionType}`;
        const questionTypeFriendlyName = Global(translationKey);

        setQuestionType(questionType);
        setQuestionTypeName(questionTypeFriendlyName);
        setParsedQuestionJSON(parsed);

        const isOptionsQuestion = isOptionsType(questionType);
        setQuestion({
          ...q,
          showCommentField: 'showCommentField' in parsed ? parsed.showCommentField : false // Default to false if not present
        });

        setHasOptions(isOptionsQuestion);

        if (questionType === TYPEAHEAD_QUESTION_TYPE) {
          setTypeaheadSearchLabel(parsed?.attributes?.label ?? '');
          setTypeAheadHelpText(parsed?.attributes?.help ?? '');
        }

        // Set options info with proper type checking
        if (isOptionsQuestion && 'options' in parsed && parsed.options && Array.isArray(parsed.options)) {
          const optionRows: QuestionOptions[] = parsed.options
            .map((option: QuestionOption, index: number) => ({
              id: index,
              text: option?.label || '',
              isSelected: option?.selected || option?.checked || false,
            }));
          setRows(optionRows);
        }
      } catch (error) {
        logECS('error', 'Parsing error', {
          error,
          url: { path: routePath('template.q.slug', { templateId, q_slug: questionId }) }
        });
        setErrors(prev => [...prev, 'Error parsing question data']);
      }
    }
  }, [selectedQuestion, questionId]);

  useEffect(() => {
    if (questionType) {
      // To determine if we have an options question type
      const isOptionQuestion = isOptionsType(questionType);

      setHasOptions(isOptionQuestion);
    }

  }, [questionType])

  // Set labels for dateRange and numberRange
  useEffect(() => {
    if ((parsedQuestionJSON?.type === DATE_RANGE_QUESTION_TYPE || parsedQuestionJSON?.type === NUMBER_RANGE_QUESTION_TYPE)) {
      try {
        setDateRangeLabels({
          start: parsedQuestionJSON?.columns?.start?.label ?? '',
          end: parsedQuestionJSON?.columns?.end?.label ?? '',
        });
      } catch {
        setDateRangeLabels({ start: '', end: '' });
      }
    }
  }, [parsedQuestionJSON])

  // Research Output Question - Hydrate state from JSON
  useEffect(() => {
    if (!hasHydrated.current &&
      parsedQuestionJSON?.type === RESEARCH_OUTPUT_QUESTION_TYPE &&
      Array.isArray(parsedQuestionJSON.columns)) {
      try {
        hydrateFromJSON(parsedQuestionJSON);
        hasHydrated.current = true;
      } catch (error) {
        console.error('Error hydrating research output fields from JSON', error);
      }
    }
  }, [parsedQuestionJSON, hydrateFromJSON]);

  // If a user changes their question type, then we need to fetch the question types to set the new json schema
  useEffect(() => {
    // Only fetch question types if we have a questionType query param present
    if (questionTypeIdQueryParam) {
      getQuestionTypes();
    }
  }, [questionTypeIdQueryParam]);


  // If a user passes in a questionType query param we will find the matching questionTypes 
  // json schema and update the question with it
  useEffect(() => {
    if (questionType && questionTypeIdQueryParam && question) {
      // Find the matching question type
      const qInfo: QuestionFormatInterface | null = getQuestionFormatInfo(questionTypeIdQueryParam);

      if (qInfo?.defaultJSON) {
        // Update the question object with the new JSON
        setQuestion(prev => ({
          ...prev,
          json: JSON.stringify(qInfo.defaultJSON)
        }));

        setHasUnsavedChanges(true);

        setQuestionType(questionTypeIdQueryParam)

        // Update the questionTypeName
        const questionTypeFriendlyName = Global(`questionTypes.${questionTypeIdQueryParam}`);
        setQuestionTypeName(questionTypeFriendlyName);

        const isOptionsQuestion = isOptionsType(questionTypeIdQueryParam)
        setHasOptions(isOptionsQuestion);

      }
    }
  }, [questionType, questionTypeIdQueryParam]);

  // Set parsed question JSON whenever question state changes
  useEffect(() => {
    if (question) {
      const { parsed, error } = getParsedQuestionJSON(question, routePath('template.show', { templateId }), Global);
      if (!parsed) {
        if (error) {
          setErrors(prev => [...prev, error])
        }
        return;
      }
      setParsedQuestionJSON(parsed);
    }
  }, [question])

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
    const stillLoading = loading || (!!selectedQuestion?.question?.sectionId && questionsLoading);
    if (!stillLoading && !initialLoadComplete) {
      setInitialLoadComplete(true);
    }
  }, [loading, questionsLoading, selectedQuestion, initialLoadComplete]);

  if (!initialLoadComplete) {
    return <Loading message={Global('messaging.loading')} />;
  }


  return (
    <>
      <PageHeader
        title={t('title')}
        description=""
        showBackButton={false}
        breadcrumbs={
          <Breadcrumbs>
            <Breadcrumb><Link href={routePath('app.home')}>{Global('breadcrumbs.home')}</Link></Breadcrumb>
            <Breadcrumb><Link href={routePath('template.index', { templateId })}>{Global('breadcrumbs.templates')}</Link></Breadcrumb>
            <Breadcrumb><Link href={routePath('template.show', { templateId })}>{Global('breadcrumbs.editTemplate')}</Link></Breadcrumb>
            <Breadcrumb>{Global('breadcrumbs.question')}</Breadcrumb>
          </Breadcrumbs>
        }
        actions={null}
        className="mb-3"
      />

      {/* Live region for announcements - visually hidden but read by screen readers */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="hidden-accessibly"
      >
        {announcement}
      </div>
      <ErrorMessages errors={errors} ref={errorRef} />

      <div className="template-editor-container">
        <div className="main-content">
          <Tabs>
            <TabList aria-label="Question editing">
              <Tab id="edit">{t('tabs.editQuestion')}</Tab>
              <Tab id="options">{t('tabs.options')}</Tab>
              <Tab id="logic">{t('tabs.logic')}</Tab>
            </TabList>

            {/* Tab: Edit Question Tab */}
            <TabPanel id="edit">
              <Form onSubmit={handleUpdate}>
                <TextField
                  name="type"
                  type="text"
                  className={`${styles.searchField} react-aria-TextField`}
                  isRequired
                >
                  <Label
                    className={`${styles.searchLabel} react-aria-Label`}>{t('labels.type')}</Label>
                  <Input
                    value={questionTypeName}
                    className={`${styles.searchInput} react-aria-Input`}
                    disabled />
                  <Button className={`${styles.searchButton} react-aria-Button`}
                    type="button"
                    onPress={redirectToQuestionTypes}>{t('buttons.changeType')}</Button>
                  <Text slot="description"
                    className={`${styles.searchHelpText} help-text`}>
                    {t('helpText.textField')}
                  </Text>
                </TextField>

                <FormTextArea
                  name="question_text"
                  isRequired={true}
                  label={t('labels.questionText')}
                  value={question?.questionText ? question.questionText : ''}
                  onChange={handleQuestionTextChange}
                  helpMessage={t('helpText.questionText')}
                  isInvalid={!question?.questionText}
                  errorMessage={t('messages.errors.questionTextRequired')}
                  richText={false}
                  textAreaClasses={styles.questionFormField}
                />

                {/**Question type fields here */}
                {hasOptions && (
                  <div className={styles.optionsWrapper}>
                    <p
                      className={styles.optionsDescription}>{t('helpText.questionOptions', { questionType })}</p>
                    <QuestionOptionsComponent
                      rows={rows}
                      setRows={updateRows}
                      questionJSON={(() => {
                        if (!question) return undefined;
                        const result = getParsedQuestionJSON(question, routePath('template.show', { templateId }), Global);
                        return result.parsed ? JSON.stringify(result.parsed) : undefined;
                      })()}
                      formSubmitted={formSubmitted}
                      setFormSubmitted={setFormSubmitted} />
                  </div>
                )}

                {/**Date and Number range question types */}
                {questionType && RANGE_QUESTION_TYPE.includes(questionType) && (
                  <RangeComponent
                    startLabel={dateRangeLabels.start}
                    endLabel={dateRangeLabels.end}
                    handleRangeLabelChange={handleRangeLabelChange}
                  />
                )}

                {/**Typeahead search question type */}
                {questionType && (questionType === TYPEAHEAD_QUESTION_TYPE) && (
                  <TypeAheadSearch
                    typeaheadSearchLabel={typeaheadSearchLabel}
                    typeaheadHelpText={typeaheadHelpText}
                    handleTypeAheadSearchLabelChange={handleTypeAheadSearchLabelChange}
                    handleTypeAheadHelpTextChange={handleTypeAheadHelpTextChange}
                  />
                )}

                {!QUESTION_TYPES_EXCLUDED_FROM_COMMENT_FIELD.includes(questionType ?? '') && (
                  <RadioGroupComponent
                    name="radioGroup"
                    value={question?.showCommentField ? 'yes' : 'no'}
                    radioGroupLabel={QuestionAdd('labels.additionalCommentBox')}
                    onChange={(value) => handleInputChange('showCommentField', value === 'yes')}
                  >
                    <div>
                      <Radio value="yes">{QuestionAdd('labels.showCommentField')}</Radio>
                    </div>

                    <div>
                      <Radio value="no">{QuestionAdd('labels.doNotShowCommentField')}</Radio>
                    </div>
                  </RadioGroupComponent>
                )}

                <FormTextArea
                  name="question_requirements"
                  isRequired={false}
                  richText={true}
                  helpMessage={t('helpText.requirementText')}
                  textAreaClasses={styles.questionFormField}
                  label={t('labels.requirementText')}
                  value={question?.requirementText ? question.requirementText : ''}
                  onChange={(newValue) => {
                    setQuestion(prev => ({
                      ...prev,
                      requirementText: newValue
                    }));
                    setHasUnsavedChanges(true);
                  }}
                />


                <FormTextArea
                  name="question_guidance"
                  isRequired={false}
                  richText={true}
                  textAreaClasses={styles.questionFormField}
                  label={t('labels.guidanceText')}
                  value={question?.guidanceText ? question?.guidanceText : ''}
                  onChange={(newValue) => {
                    setQuestion(prev => ({
                      ...prev,
                      guidanceText: newValue
                    }));
                    setHasUnsavedChanges(true);
                  }}
                  helpMessage={t('helpText.guidanceText')}
                />

                {questionType === TEXT_AREA_QUESTION_TYPE && (
                  <div className={styles.sampleTextGroup}>
                    <FormTextArea
                      name="sample_text"
                      isRequired={false}
                      richText={true}
                      description={t('descriptions.sampleText')}
                      textAreaClasses={styles.questionFormField}
                      label={t('labels.sampleText')}
                      value={question?.sampleText ? question?.sampleText : ''}
                      onChange={(newValue) => {
                        setQuestion(prev => ({
                          ...prev,
                          sampleText: newValue
                        }));
                        setHasUnsavedChanges(true);
                      }}
                    />

                    <Checkbox
                      onChange={() => {
                        setQuestion({
                          ...question,
                          useSampleTextAsDefault: !question?.useSampleTextAsDefault
                        });
                        setHasUnsavedChanges(true);
                      }}
                      isSelected={question?.useSampleTextAsDefault || false}
                    >
                      <div className="checkbox">
                        <svg viewBox="0 0 18 18" aria-hidden="true">
                          <polyline points="1 9 7 14 15 4" />
                        </svg>
                      </div>
                      {t('descriptions.sampleTextAsDefault')}
                    </Checkbox>
                  </div>
                )}

                {questionType === RESEARCH_OUTPUT_QUESTION_TYPE && (
                  <ResearchOutputComponent
                    standardFields={standardFields}
                    additionalFields={additionalFields}
                    expandedFields={expandedFields}
                    nonCustomizableFieldIds={nonCustomizableFieldIds}
                    newOutputType={newOutputType}
                    setNewOutputType={setNewOutputType}
                    newLicenseType={newLicenseType}
                    setNewLicenseType={setNewLicenseType}
                    defaultResearchOutputTypesData={defaultResearchOutputTypesData}
                    licensesData={licensesData}
                    onStandardFieldChange={handleStandardFieldChange}
                    onCustomizeField={handleCustomizeField}
                    onUpdateStandardFieldProperty={updateStandardFieldProperty}
                    onTogglePreferredRepositories={handleTogglePreferredRepositories}
                    onRepositoriesChange={handleRepositoriesChange}
                    onToggleMetaDataStandards={handleToggleMetaDataStandards}
                    onMetaDataStandardsChange={handleMetaDataStandardsChange}
                    onOutputTypeModeChange={handleOutputTypeModeChange}
                    onAddCustomOutputType={handleAddCustomOutputType}
                    onRemoveCustomOutputType={handleRemoveCustomOutputType}
                    onLicenseModeChange={handleLicenseModeChange}
                    onAddCustomLicenseType={handleAddCustomLicenseType}
                    onRemoveCustomLicenseType={handleRemoveCustomLicenseType}
                    onDeleteAdditionalField={handleDeleteAdditionalField}
                    onUpdateAdditionalField={handleUpdateAdditionalField}
                    onAddAdditionalField={addAdditionalField}
                  />
                )}

                <RadioGroupComponent
                  name="radioGroup"
                  value={question?.required ? 'yes' : 'no'}
                  radioGroupLabel={Global('labels.requiredField')}
                  description={Global('descriptions.requiredFieldDescription')}
                  onChange={handleRadioChange}
                >
                  <div>
                    <Radio value="yes">{Global('form.yesLabel')}</Radio>
                  </div>

                  <div>
                    <Radio value="no">{Global('form.noLabel')}</Radio>
                  </div>
                </RadioGroupComponent>

                <TransitionButton
                  type="submit"
                  isDisabled={isSubmitting}
                  loadingLabel={Global('buttons.saving')}
                  showLoading={false}
                >
                  {Global('buttons.saveAndUpdate')}
                </TransitionButton>
              </Form>
            </TabPanel>

            {/** Tab: Options Tab */}
            <TabPanel id="options">
              <h2>{t('tabPanel.headings.options')}</h2>
            </TabPanel>

            {/** Tab: Display Logic Tab */}
            <TabPanel id="logic">
              <h2>{t('tabPanel.headings.logic')}</h2>
              <DisplayLogicComponent
                triggerQuestions={triggerQuestions}
                displayLogic={displayLogic}
                onDisplayLogicChange={handleDisplayLogicChange}
                onDisplayLogicSave={handleSaveDisplayLogic}
                isSaving={isSavingLogic}
              />

            </TabPanel>
          </Tabs>

          <div className={styles.deleteZone}>
            <h2>{t('headings.deleteQuestion')}</h2>
            <p>{t('descriptions.deleteWarning')}</p>
            <DialogTrigger isOpen={isConfirmOpen} onOpenChange={setConfirmOpen}>
              <Button className={`danger`}>{t('buttons.deleteQuestion')}</Button>
              <ModalOverlay>
                <Modal>
                  <Dialog>
                    {({ close }) => (
                      <>
                        <h3>{t('headings.confirmDelete')}</h3>
                        <p>{t('descriptions.deleteWarning')}</p>
                        <div className={styles.deleteConfirmButtons}>
                          <Button className='react-aria-Button' autoFocus onPress={close}>{Global('buttons.cancel')}</Button>
                          <TransitionButton
                            className="danger"
                            onPress={async () => {
                              await handleDelete();
                              close();
                            }}
                            loadingLabel={Global('buttons.confirming')}
                            showLoading={false}
                          >
                            {Global('buttons.confirm')}
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



        <div className="sidebar">
          <h2>{Global('headings.preview')}</h2>
          <p>{t('descriptions.previewText')}</p>
          <QuestionPreview
            buttonLabel={t('buttons.previewQuestion')}
            previewDisabled={question ? false : true}
          >
            <QuestionView
              isPreview={true}
              question={question}
              templateId={Number(templateId)}
              path={routePath('template.q.slug', { templateId, q_slug: questionId })}
            />
          </QuestionPreview>

          <h3>{t('headings.bestPractice')}</h3>
          <p>{t('descriptions.bestPracticePara1')}</p>
          <p>{t('descriptions.bestPracticePara2')}</p>
          <p>{t('descriptions.bestPracticePara3')}</p>
        </div>
      </div >
    </>

  );
}

export default QuestionEdit;