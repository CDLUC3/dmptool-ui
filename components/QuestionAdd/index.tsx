'use client'

import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

import {
  Button,
  Checkbox,
  Form,
  Input,
  Label,
  Radio,
  Tab,
  TabList,
  TabPanel,
  Tabs,
  Text,
  TextField
} from "react-aria-components";

// GraphQL
import { useQuery } from '@apollo/client/react';
import { QuestionsDisplayOrderDocument } from '@/generated/graphql';

import {
  Question,
  QuestionOptions,
  AnyParsedQuestion,
} from '@/app/types';

// Components
import PageHeader from "@/components/PageHeader";
import {
  FormInput,
  FormTextArea,
  RadioGroupComponent,
  RangeComponent,
  QuestionOptionsComponent,
  TypeAheadSearch,
  ResearchOutputComponent
} from '@/components/Form';
import ErrorMessages from '@/components/ErrorMessages';
import QuestionPreview from '@/components/QuestionPreview';
import QuestionView from '@/components/QuestionView';
import { getParsedQuestionJSON } from '@/components/hooks/getParsedQuestionJSON';
import { TransitionButton } from '@/components/Form';

//Other
import { useResearchOutputTable } from '@/app/hooks/useResearchOutputTable';
import { useToast } from '@/context/ToastContext';
import { stripHtmlTags } from '@/utils/general';
import { questionTypeHandlers } from '@/utils/questionTypeHandlers';
import { routePath } from '@/utils/routes';
import {
  OPTIONS_QUESTION_TYPES,
  RANGE_QUESTION_TYPE,
  TYPEAHEAD_QUESTION_TYPE,
  TEXT_AREA_QUESTION_TYPE,
  RESEARCH_OUTPUT_QUESTION_TYPE,
  QUESTION_TYPES_EXCLUDED_FROM_COMMENT_FIELD
} from '@/lib/constants';
import {
  isOptionsType,
  getOverrides,
} from './hooks/useAddQuestion';
import logECS from '@/utils/clientLogger';
import styles from './questionAdd.module.scss';

const defaultQuestion = {
  guidanceText: '',
  requirementText: '',
  sampleText: '',
  useSampleTextAsDefault: false,
  required: false,
  showCommentField: false,
};

export interface QuestionCommonFields {
  questionText: string;
  json: string;
  requirementText?: string | null;
  guidanceText?: string | null;
  sampleText?: string | null;
  useSampleTextAsDefault?: boolean;
  required?: boolean;
  displayOrder?: number;
}


const QuestionAdd = ({
  questionType,
  questionName,
  questionJSON,
  sectionId,
  onSave,
  backUrl,
  successUrl,
  breadcrumbs
}:
  {
    questionType?: string | null,
    questionName?: string | null,
    questionJSON: string,
    sectionId?: string,
    onSave: (commonFields: QuestionCommonFields) => Promise<void>;
    backUrl: string;        // where "Change Type" and breadcrumbs point
    successUrl: string;     // where to redirect on save success
    breadcrumbs: React.ReactNode;

  }) => {

  const params = useParams();
  const router = useRouter();
  const toastState = useToast();
  const templateId = String(params.templateId);

  //For scrolling to error in page
  const errorRef = useRef<HTMLDivElement | null>(null);
  const step1Url = routePath('template.q.new', { templateId }, { section_id: sectionId, step: 1 })
  // Track whether there are unsaved changes
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  // Form state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Make sure to add questionJSON and questionType to the question object so it can be used in the QuestionView component
  const [question, setQuestion] = useState<Question>(() => ({
    ...defaultQuestion,
    // If questionType is non-null/undefined, use it, otherwise empty string
    questionType: questionType ?? '',
    // questionJSON is a string, so store it here
    json: questionJSON,
  }));
  const [rows, setRows] = useState<QuestionOptions[]>([{ id: 0, text: "", isSelected: false }]);
  const [formSubmitted, setFormSubmitted] = useState<boolean>(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [hasOptions, setHasOptions] = useState<boolean | null>(false);
  const [typeaheadSearchLabel, setTypeaheadSearchLabel] = useState<string>('');
  const [typeaheadHelpText, setTypeAheadHelpText] = useState<string>('');
  const [parsedQuestionJSON, setParsedQuestionJSON] = useState<AnyParsedQuestion>();
  const [dateRangeLabels, setDateRangeLabels] = useState<{ start: string; end: string }>({ start: '', end: '' });

  // Add state for live region announcements
  const [announcement, setAnnouncement] = useState('');

  // localization keys
  const Global = useTranslations('Global');
  const QuestionAdd = useTranslations('QuestionAdd');

  // Helper function to make announcements
  const announce = (message: string) => {
    setAnnouncement(message);
    // Clear after announcement is made
    setTimeout(() => setAnnouncement(''), 100);
  };


  // Research Output Table Hooks
  const {
    buildResearchOutputFormState,
    expandedFields,
    nonCustomizableFieldIds,
    standardFields,
    additionalFields,
    newOutputType,
    setNewOutputType,
    newLicenseType,
    licensesData,
    defaultResearchOutputTypesData,
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

  // Update question.json whenever Research Output fields change
  useEffect(() => {
    if (questionType === RESEARCH_OUTPUT_QUESTION_TYPE) {
      const updatedJSON = buildResearchOutputFormState();
      setQuestion(prev => ({
        ...prev,
        json: JSON.stringify(updatedJSON),
      }));
    }
  }, [questionType, standardFields, additionalFields, buildResearchOutputFormState]);

  // Query request for questions to calculate max displayOrder
  const { data: questionDisplayOrders } = useQuery(QuestionsDisplayOrderDocument, {
    variables: {
      sectionId: Number(sectionId)
    },
    fetchPolicy: 'network-only', // Ensure we get the latest display orders
    skip: !sectionId
  });

  // Calculate the display order of the new question based on the last displayOrder number
  const getDisplayOrder = useCallback(() => {
    if (!questionDisplayOrders?.questions?.length) {
      return 1;
    }

    const validDisplayOrders = questionDisplayOrders.questions
      .map(q => q?.displayOrder)
      .filter((order): order is number => typeof order === 'number');

    if (validDisplayOrders.length === 0) {
      return 1;
    }

    const maxDisplayOrder = Math.max(...validDisplayOrders);
    return maxDisplayOrder + 1;
  }, [questionDisplayOrders]);

  // Send user back to the selection of question types
  const redirectToQuestionTypes = () => {
    router.push(backUrl)
  }

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
      }

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
    // Update the label in the question JSON and sync to question state
    if (parsedQuestionJSON && (parsedQuestionJSON?.type === "affiliationSearch")) {
      const updatedParsed = structuredClone(parsedQuestionJSON); // To avoid mutating state directly

      if (updatedParsed?.attributes) {
        updatedParsed.attributes.label = value;
        setQuestion(prev => ({
          ...prev,
          json: JSON.stringify(updatedParsed),
        }));
        setHasUnsavedChanges(true);
      }
    }
  };

  // Handler for typeahead help text changes
  const handleTypeAheadHelpTextChange = (value: string) => {
    setTypeAheadHelpText(value);
    if (parsedQuestionJSON && (parsedQuestionJSON?.type === "affiliationSearch")) {
      const updatedParsed = structuredClone(parsedQuestionJSON); // To avoid mutating state directly

      if (updatedParsed?.attributes) {
        updatedParsed.attributes.help = value;
        setQuestion(prev => ({
          ...prev,
          json: JSON.stringify(updatedParsed),
        }));
        setHasUnsavedChanges(true);
      }
    }
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


  // Update common input fields when any of them change
  const handleInputChange = (field: keyof Question, value: string | boolean | undefined) => {
    setQuestion((prev) => ({
      ...prev,
      [field]: value === undefined ? '' : value, // Default to empty string if value is undefined
    }));
    setHasUnsavedChanges(true);
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

    const { parsed, error } = getParsedQuestionJSON(question, routePath('template.q.new', { templateId }), Global);

    if (questionType === TYPEAHEAD_QUESTION_TYPE) {
      return {
        label: typeaheadSearchLabel,
        help: typeaheadHelpText,
      }
    }

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
      ...parsedQuestionJSON,
      attributes: {
        ...('attributes' in parsed ? parsed.attributes : {}),
        ...getOverrides(questionType),
      },
    };
  };

  // Pass the merged userInput to questionTypeHandlers to generate json and do type and schema validation
  const buildUpdatedJSON = (question: Question, rowsOverride?: QuestionOptions[]) => {
    const userInput = getFormState(question, rowsOverride);

    const { parsed, error } = getParsedQuestionJSON(question, routePath('template.q.new', { templateId }), Global);

    if (!parsed) {
      if (error) {
        setErrors(prev => [...prev, error])
      }
      return;
    }

    const json = questionTypeHandlers[questionType as keyof typeof questionTypeHandlers](
      parsed,
      userInput
    );

    // Add showCommentField to the output if needed
    if (json && typeof question.showCommentField === 'boolean') {
      json.data.showCommentField = question.showCommentField;
    }

    return json;
  };

  // Function to add and save the new question
  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitted(true);
    if (isSubmitting) return;// Prevent double submission
    setIsSubmitting(true);

    const updatedJSON = buildUpdatedJSON(question);
    const { success, error } = updatedJSON ?? {};

    if (!success || error) {
      setErrors(prev => [...prev, error ?? QuestionAdd('messages.errors.questionAddingError')]);
      announce(QuestionAdd('researchOutput.announcements.errorOccurred'));
      setIsSubmitting(false);
      return;
    }

    const commonFields: QuestionCommonFields = {
      questionText: stripHtmlTags(question?.questionText ?? ''),
      json: JSON.stringify(updatedJSON ? updatedJSON.data : ''),
      requirementText: question?.requirementText,
      guidanceText: question?.guidanceText,
      sampleText: question?.sampleText,
      useSampleTextAsDefault: question?.useSampleTextAsDefault ?? false,
      required: question?.required,
      displayOrder: getDisplayOrder(),
    };

    try {
      await onSave(commonFields);
      setHasUnsavedChanges(false);
      toastState.add(QuestionAdd('messages.success.questionAdded'), { type: 'success' });
      router.push(successUrl);
    } catch (error) {
      setErrors(prev => [...prev, QuestionAdd('messages.errors.questionAddingError')]);
      logECS('error', 'Adding Question in QuestionAdd', { error });
    } finally {
      setIsSubmitting(false);
    }
  };

  // If questionType is missing, return user to the Question Types selection page
  // If sectionId is missing, return user back to the Edit Template page
  // This is to ensure that the user has selected a question type before proceeding
  // to the QuestionAdd page, and that they are in a valid section of the template
  useEffect(() => {
    if (!questionType) {
      toastState.add(Global('messaging.somethingWentWrong'), { type: 'error' });
      router.push(step1Url);
      return; // Early return to prevent further execution
    }

    if (!sectionId) {
      toastState.add(Global('messaging.somethingWentWrong'), { type: 'error' });
      router.push(routePath('template.show', { templateId }));
      return;
    }
  }, [])

  useEffect(() => {
    if (questionType) {
      // To determine if we have an options question type
      const isOptionQuestion = isOptionsType(questionType);

      setHasOptions(isOptionQuestion);
    }

  }, [questionType])


  // Set labels for dateRange and numberRange
  useEffect(() => {
    if ((parsedQuestionJSON?.type === 'dateRange' || parsedQuestionJSON?.type === 'numberRange')) {
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

  useEffect(() => {
    if (question) {
      const { parsed, error } = getParsedQuestionJSON(
        question,
        routePath('template.q.new', { templateId }),
        Global
      );

      if (parsed) {
        setParsedQuestionJSON(parsed);
      } else if (error) {
        setErrors(prev => (prev.includes(error) ? prev : [...prev, error]));
      }
    }
  }, [question]);

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
        title={QuestionAdd('title')}
        description=""
        showBackButton={false}
        breadcrumbs={breadcrumbs}
        actions={null}
        className=""
      />

      <div className="template-editor-container">
        <div className="main-content">
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
          <Tabs>
            <TabList aria-label={QuestionAdd('labels.questionEditing')}>
              <Tab id="edit">{Global('tabs.editQuestion')}</Tab>
              <Tab id="options">{Global('tabs.options')}</Tab>
              <Tab id="logic">{Global('tabs.logic')}</Tab>
            </TabList>

            <TabPanel id="edit">
              <Form onSubmit={handleAdd}>
                <TextField
                  name="type"
                  type="text"
                  className={`${styles.searchField} react-aria-TextField`}
                  isRequired
                  value={questionName ? questionName : ''}
                >
                  <Label className={`${styles.searchLabel} react-aria-Label`}>{QuestionAdd('labels.type')}</Label>
                  <Input className={`${styles.searchInput} react-aria-Input`} disabled />
                  <Button className={`${styles.searchButton} react-aria-Button`} type="button" onPress={redirectToQuestionTypes}>{QuestionAdd('buttons.changeType')}</Button>
                  <Text slot="description" className={`${styles.searchHelpText} help-text`}>
                    {QuestionAdd('helpText.textField')}
                  </Text>
                </TextField>

                <FormInput
                  name="question_text"
                  type="text"
                  isRequired={true}
                  label={QuestionAdd('labels.questionText')}
                  value={question?.questionText ? question.questionText : ''}
                  onChange={(e) => handleInputChange('questionText', e.currentTarget.value)}
                  helpMessage={QuestionAdd('helpText.questionText')}
                  isInvalid={!question?.questionText && formSubmitted}
                  errorMessage={QuestionAdd('messages.errors.questionTextRequired')}
                />

                {/**Options question types*/}
                {questionType && OPTIONS_QUESTION_TYPES.includes(questionType) && parsedQuestionJSON && (
                  <>
                    <p className={styles.optionsDescription}>
                      {QuestionAdd('helpText.questionOptions', { questionName: questionName ?? '' })}
                    </p>
                    <div className={styles.optionsWrapper}>
                      <QuestionOptionsComponent
                        rows={rows}
                        setRows={updateRows}
                        questionJSON={questionJSON}
                        formSubmitted={formSubmitted}
                        setFormSubmitted={setFormSubmitted}
                      />
                    </div>
                  </>
                )}

                {/**Date and Number range question types */}
                {questionType && RANGE_QUESTION_TYPE.includes(questionType) && (
                  <RangeComponent
                    startLabel={dateRangeLabels.start}
                    endLabel={dateRangeLabels.end}
                    handleRangeLabelChange={handleRangeLabelChange}
                  />
                )}

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
                  textAreaClasses={styles.questionFormField}
                  label={QuestionAdd('labels.requirementText')}
                  value={question?.requirementText ? question.requirementText : ''}
                  onChange={(newValue) => handleInputChange('requirementText', newValue)}
                  helpMessage={QuestionAdd('helpText.requirementText')}
                />

                <FormTextArea
                  name="question_guidance"
                  isRequired={false}
                  richText={true}
                  textAreaClasses={styles.questionFormField}
                  label={QuestionAdd('labels.guidanceText')}
                  value={question?.guidanceText ? question?.guidanceText : ''}
                  onChange={(newValue) => handleInputChange('guidanceText', newValue)}
                  helpMessage={QuestionAdd('helpText.guidanceText')}
                />

                {questionType === TEXT_AREA_QUESTION_TYPE && (
                  <FormTextArea
                    name="sample_text"
                    isRequired={false}
                    richText={true}
                    description={QuestionAdd('descriptions.sampleText')}
                    textAreaClasses={styles.questionFormField}
                    label={QuestionAdd('labels.sampleText')}
                    value={question?.sampleText ? question.sampleText : ''}
                    onChange={(newValue) => handleInputChange('sampleText', newValue)}
                    helpMessage={QuestionAdd('helpText.sampleText')}
                  />
                )}

                {questionType === TEXT_AREA_QUESTION_TYPE && (
                  <Checkbox
                    onChange={() => handleInputChange('useSampleTextAsDefault', !question?.useSampleTextAsDefault)}
                    isSelected={question?.useSampleTextAsDefault || false}
                  >
                    <div className="checkbox">
                      <svg viewBox="0 0 18 18" aria-hidden="true">
                        <polyline points="1 9 7 14 15 4" />
                      </svg>
                    </div>
                    {QuestionAdd('descriptions.sampleTextAsDefault')}
                  </Checkbox>
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

                {/** Research Output question types have "required" at individual fields, and not on the whole question */}
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
                  aria-disabled={isSubmitting}
                >
                  {Global('buttons.saveAndAdd')}
                </TransitionButton>
              </Form>

            </TabPanel>
            <TabPanel id="options">
              <h2>{Global('tabs.options')}</h2>
            </TabPanel>
            <TabPanel id="logic">
              <h2>{Global('tabs.logic')}</h2>
            </TabPanel>
          </Tabs>

        </div >

        <div className="sidebar">
          <h2>{Global('headings.preview')}</h2>
          <p>{QuestionAdd('descriptions.previewText')}</p>
          <QuestionPreview
            buttonLabel={QuestionAdd('buttons.previewQuestion')}
            previewDisabled={question ? false : true}
          >
            <QuestionView
              isPreview={true}
              question={question}
              templateId={Number(templateId)}
              path={routePath('template.q.new', { templateId })}
            />
          </QuestionPreview>

          <h3>{QuestionAdd('headings.bestPractice')}</h3>
          <p>{QuestionAdd('descriptions.bestPracticePara1')}</p>
          <p>{QuestionAdd('descriptions.bestPracticePara2')}</p>
          <p>{QuestionAdd('descriptions.bestPracticePara3')}</p>
        </div>
      </div >
    </>

  );
}

export default QuestionAdd;

