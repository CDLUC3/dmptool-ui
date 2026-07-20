'use client'

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useQuery, useMutation } from '@apollo/client/react';
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
  Text,
  TextField
} from "react-aria-components";

// GraphQL
import {
  UpdateCustomQuestionDocument,
  CustomQuestionDocument,
  RemoveCustomQuestionDocument
} from '@/generated/graphql';


import {
  AnyParsedQuestion,
  Question,
  QuestionOption,
  QuestionOptions,
  QuestionFormatInterface,
} from '@/app/types';

// Components
import PageHeader from "@/components/PageHeader";
import QuestionOptionsComponent
  from '@/components/Form/QuestionOptionsComponent';
import QuestionPreview from '@/components/QuestionPreview';
import {
  FormInput,
  RadioGroupComponent,
  RangeComponent,
  TypeAheadSearch,
  ResearchOutputComponent
} from '@/components/Form';
import FormTextArea from '@/components/Form/FormTextArea';
import ErrorMessages from '@/components/ErrorMessages';
import QuestionView from '@/components/QuestionView';
import { getParsedQuestionJSON } from '@/components/hooks/getParsedQuestionJSON';
import Loading from '@/components/Loading';
import {
  ContentContainer,
  LayoutWithPanel,
  SidebarPanel
} from '@/components/Container';

//Utils and Other
import { useResearchOutputTable } from '@/app/hooks/useResearchOutputTable';
import { useToast } from '@/context/ToastContext';
import { routePath } from '@/utils/routes';
import { stripHtmlTags } from '@/utils/general';
import logECS from '@/utils/clientLogger';
import {
  getQuestionFormatInfo,
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
import styles from './customQuestionEdit.module.scss';

const CustomQuestionEdit = () => {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const toastState = useToast(); // Access the toast state from context
  const templateCustomizationId = String(params.templateCustomizationId);
  const customQuestionId = String(params.customQuestionId);
  const questionTypeIdQueryParam = searchParams.get('questionType') || null;

  //For scrolling to error in page
  const errorRef = useRef<HTMLDivElement | null>(null);
  // Ref to track whether customization is being deleted to prevent refetching deleted customization
  const isBeingDeletedRef = useRef(false);

  const hasHydrated = useRef(false);
  // Track whether there are unsaved changes
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  // Form state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  /*To be able to show a loading state when redirecting after successful update because otherwise there is a 
  bit of a stutter where the page reloads before redirecting*/
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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

  // Add state for live region announcements
  const [announcement, setAnnouncement] = useState('');

  // localization keys
  const Global = useTranslations('Global');
  const t = useTranslations('QuestionEdit');
  const QuestionAdd = useTranslations('QuestionAdd');
  const QuestionEdit = useTranslations("QuestionEdit");

  // Set URLs
  const TEMPLATE_URL = routePath('template.customize', { templateCustomizationId });

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


  // Initialize user updateCustomQuestion mutation
  const [updateCustomQuestionMutation] = useMutation(UpdateCustomQuestionDocument);

  // Initialize removeCustomQuestion mutation
  const [removeCustomQuestionMutation] = useMutation(RemoveCustomQuestionDocument);

  // Run selected question query
  const {
    data: selectedQuestion,
    loading,
    error: selectedQuestionQueryError
  } = useQuery(CustomQuestionDocument, {
    variables: { customQuestionId: Number(customQuestionId) },
    skip: isBeingDeletedRef.current,
  });

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
    const sectionId = selectedQuestion?.customQuestion?.sectionId;
    // questionId as query param included to let page know that user is updating an existing question
    router.push(routePath('template.customize.question.create', { templateCustomizationId }, { section_id: sectionId, step: 1, customQuestionId }))
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

    const { parsed, error } = getParsedQuestionJSON(question, routePath('template.customize', { templateCustomizationId }), Global);

    if (questionType === RESEARCH_OUTPUT_QUESTION_TYPE) {
      return buildResearchOutputFormState();
    }

    if (!parsed) {
      if (error) {
        setErrors([error]);
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
    const { parsed, error } = getParsedQuestionJSON(question, routePath('template.customize', { templateCustomizationId }), Global);

    if (!parsed) {
      if (error) {
        setErrors([error]);
      }
      return;
    }
    return questionTypeHandlers[questionType as keyof typeof questionTypeHandlers](
      parsed,
      userInput
    );
  };

  // Make GraphQL mutation request to update the custom question
  const handleUpdateCustomQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return; // Prevent double submissions
    setIsSubmitting(true);
    setFormSubmitted(true);

    if (!question) {
      setIsSubmitting(false);
      return;
    }

    const updatedJSON = buildUpdatedJSON(question);
    const { success, error } = updatedJSON ?? {};

    if (!success || error) {
      const errorMessage = error ?? t('messages.errors.questionUpdateError');
      setErrors([errorMessage]);
      announce(QuestionAdd('researchOutput.announcements.errorOccurred') || 'An error occurred.');
      setIsSubmitting(false);
      return;
    }

    const cleanedQuestionText = stripHtmlTags(question.questionText ?? '');

    try {
      const response = await updateCustomQuestionMutation({
        variables: {
          input: {
            customQuestionId: Number(customQuestionId),
            questionText: cleanedQuestionText,
            json: JSON.stringify(updatedJSON?.data ?? {}),
            requirementText: question.requirementText ?? null,
            guidanceText: question.guidanceText ?? null,
            sampleText: question.sampleText ?? null,
            useSampleTextAsDefault: question.useSampleTextAsDefault ?? false,
            required: question.required ?? false,
          }
        }
      });

      const responseErrors = response.data?.updateCustomQuestion?.errors;
      if (responseErrors && Object.values(responseErrors).some(err => err && err !== 'CustomQuestionErrors')) {
        setErrors([responseErrors.general ?? t('messages.errors.questionUpdateError')]);
        setIsSubmitting(false);
        return;
      }

      setHasUnsavedChanges(false);
      setIsRedirecting(true);
      toastState.add(QuestionAdd('messages.success.questionUpdated'), { type: 'success' });
      router.push(TEMPLATE_URL);
    } catch (error) {
      setIsSubmitting(false);
      logECS('error', 'updateCustomQuestion', {
        error,
        url: { path: TEMPLATE_URL }
      });
      setErrors([t('messages.errors.questionUpdateError')]);
    }
  };

  const handleDeleteCustomQuestion = async () => {
    if (isDeleting) return; // Prevent double-clicks
    isBeingDeletedRef.current = true;
    setIsDeleting(true);
    try {
      const response = await removeCustomQuestionMutation({
        variables: { customQuestionId: Number(customQuestionId) },
      });

      const responseErrors = response.data?.removeCustomQuestion?.errors;
      if (responseErrors && Object.values(responseErrors).some(err => err && err !== 'CustomQuestionErrors')) {
        setErrors([responseErrors.general ?? QuestionEdit('messages.error.errorDeletingQuestion')]);
        return;
      }

      toastState.add(QuestionEdit('messages.success.successDeletingQuestion'), { type: 'success' });
      router.push(TEMPLATE_URL);
    } catch (error) {
      logECS('error', 'deleteCustomQuestion', {
        error,
        url: { path: routePath('template.customQuestion', { templateCustomizationId, customQuestionId }) }
      });
      setErrors([QuestionEdit('messages.error.errorDeletingQuestion')]);
    } finally {
      setIsDeleting(false);
      setConfirmOpen(false);
    }
  };

  // Set question details in state when data is loaded
  useEffect(() => {
    if (selectedQuestion?.customQuestion) {
      const q = {
        ...selectedQuestion.customQuestion,
        required: selectedQuestion.customQuestion.required ?? false // convert null to false
      };
      try {
        const { parsed, error } = getParsedQuestionJSON(q, routePath('template.customize', { templateCustomizationId }), Global);
        if (!parsed?.type) {
          if (error) {
            logECS('error', 'Parsing error', {
              error: 'Invalid question type in parsed JSON',
              url: { path: routePath('template.customize', { templateCustomizationId }) }
            });

            setErrors([error])
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
          url: { path: routePath('template.customize', { templateCustomizationId }) }
        });
        setErrors([Global('messaging.errors.errorParsingData')]);
      }
    }
  }, [selectedQuestion]);

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
      const { parsed, error } = getParsedQuestionJSON(question, routePath('template.customize', { templateCustomizationId }), Global);
      if (!parsed) {
        if (error) {
          setErrors([error])
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

  if (loading || isRedirecting) {
    return <Loading message={Global("messaging.loading")} />;
  }

  if (selectedQuestionQueryError) {
    return <ErrorMessages errors={[selectedQuestionQueryError.message]} />;
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
            <Breadcrumb><Link href={routePath('template.customizations')}>{Global('breadcrumbs.templateCustomizations')}</Link></Breadcrumb>
            <Breadcrumb><Link href={routePath('template.customize', { templateCustomizationId })}>{Global('breadcrumbs.template')}</Link></Breadcrumb>
            <Breadcrumb>{Global('breadcrumbs.question')}</Breadcrumb>
          </Breadcrumbs>
        }
        actions={null}
        className=""
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
      <LayoutWithPanel>
        <ContentContainer>
          <div className={styles.questionContainer}>
            <Form onSubmit={handleUpdateCustomQuestion}>
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

              <FormInput
                name="question_text"
                type="text"
                isRequired={true}
                label={t('labels.questionText')}
                value={question?.questionText ? question.questionText : ''}
                onChange={(e) => handleQuestionTextChange(e.target.value)}
                helpMessage={t('helpText.questionText')}
                isInvalid={!question?.questionText}
                errorMessage={t('messages.errors.questionTextRequired')}
              />

              {/**Question type fields here */}
              {hasOptions && (
                <div className={styles.optionsWrapper}>
                  <p
                    className={styles.optionsDescription}>{t('helpText.questionOptions', { questionType })}</p>
                  <QuestionOptionsComponent
                    rows={rows}
                    setRows={updateRows}
                    questionJSON={parsedQuestionJSON ? JSON.stringify(parsedQuestionJSON) : undefined}
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
                  name="radioGroupShowCommentField"
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
                name="radioGroupRequired"
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


              <Button
                type="submit"
                aria-disabled={isSubmitting}
                onPress={() => setFormSubmitted(true)}
              >
                {isSubmitting ? Global('buttons.saving') : Global('buttons.saveAndUpdate')}
              </Button>
            </Form>




            <div className={styles.deleteZone}>
              <h2>{t('headings.deleteQuestion')}</h2>
              <p>{t('descriptions.deleteWarning')}</p>
              <DialogTrigger isOpen={isConfirmOpen} onOpenChange={setConfirmOpen}>
                <Button
                  className={`danger`}
                  isDisabled={isDeleting}
                >
                  {isDeleting ? Global('buttons.deletingCustomization') : Global('buttons.deleteCustomization')}
                </Button>
                <ModalOverlay>
                  <Modal>
                    <Dialog>
                      {({ close }) => (
                        <>
                          <h3>{t('headings.confirmDelete')}</h3>
                          <p>{t('descriptions.deleteWarning')}</p>
                          <div className={styles.deleteConfirmButtons}>
                            <Button className='react-aria-Button' autoFocus onPress={close}>{Global('buttons.cancel')}</Button>
                            <Button
                              className={`danger `}
                              onPress={() => {
                                handleDeleteCustomQuestion();
                              }}>
                              {Global('buttons.confirm')}
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
        </ContentContainer>
        <SidebarPanel>
          <>
            <h2>{Global('headings.preview')}</h2>
            <p>{QuestionEdit('descriptions.previewText')}</p>
            <QuestionPreview
              buttonLabel={QuestionEdit('buttons.previewQuestion')}
              previewDisabled={question ? false : true}
            >
              <QuestionView
                isPreview={true}
                question={question}
                path={routePath('template.customQuestion', {
                  templateCustomizationId,
                  customQuestionId,
                })}
              />
            </QuestionPreview>

            <h3>{QuestionEdit('headings.bestPractice')}</h3>
            <p>{QuestionEdit('descriptions.bestPracticePara1')}</p>
            <p>{QuestionEdit('descriptions.bestPracticePara2')}</p>
            <p>{QuestionEdit('descriptions.bestPracticePara3')}</p>
          </>
        </SidebarPanel>
      </LayoutWithPanel>
    </>

  );
}

export default CustomQuestionEdit;
