'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from "next-intl";
import { CalendarDate, DateValue } from "@internationalized/date";
import { CURRENT_SCHEMA_VERSION, QuestionTypeMap } from '@dmptool/types';
import { DocumentNode } from '@apollo/client';
import {
  Breadcrumb,
  Breadcrumbs,
  Button,
  Dialog,
  DialogTrigger,
  Form,
  Link,
  OverlayArrow,
  Popover,
  Tooltip,
  TooltipTrigger
} from "react-aria-components";

// GraphQL 
import { useQuery } from '@apollo/client/react';
import {
  MeDocument,
  PlanDocument,
  AnswerByVersionedQuestionIdDocument,
  UserRole,
} from '@/generated/graphql';
import {
  addAnswerAction,
  updateAnswerAction,
} from '@/app/actions';

// Constants
import {
  CHECKBOXES_QUESTION_TYPE,
  RADIOBUTTONS_QUESTION_TYPE,
  TYPEAHEAD_QUESTION_TYPE,
  TEXT_AREA_QUESTION_TYPE,
  RESEARCH_OUTPUT_QUESTION_TYPE,
  TEXT_FIELD_QUESTION_TYPE,
  SELECTBOX_QUESTION_TYPE,
  MULTISELECTBOX_QUESTION_TYPE,
  BOOLEAN_QUESTION_TYPE,
  EMAIL_QUESTION_TYPE,
  URL_QUESTION_TYPE,
  NUMBER_QUESTION_TYPE,
  CURRENCY_QUESTION_TYPE,
  DATE_QUESTION_TYPE,
  DATE_RANGE_QUESTION_TYPE,
  NUMBER_RANGE_QUESTION_TYPE
} from '@/lib/constants';

// Components
import {
  ContentContainer,
  LayoutWithPanel,
  SidebarPanel,
  DrawerPanel
} from "@/components/Container";
import PageHeader from "@/components/PageHeader";
import { Card, } from "@/components/Card/card";
import ErrorMessages from '@/components/ErrorMessages';
import { getParsedQuestionJSON } from '@/components/hooks/getParsedQuestionJSON';
import { DmpIcon } from "@/components/Icons";
import { useRenderQuestionField } from '@/components/hooks/useRenderQuestionField';
import SafeHtml from '@/components/SafeHtml';
import Loading from '@/components/Loading';
import { FormTextArea } from '@/components/Form';
import GuidancePanel from '@/components/GuidancePanel';
import NotificationHeader from '../Notification';

// Utils and other
import { useToast } from '@/context/ToastContext';
import logECS from '@/utils/clientLogger';
import { routePath } from '@/utils/routes';
import { stripHtmlTags } from '@/utils/general';
import { createEmptyResearchOutputRow } from '@/utils/researchOutputTransformations';
import {
  Question,
  MergedComment,
  ResearchOutputTable,
} from '@/app/types';

//hooks
import { useComments } from '@/app/hooks/useComments';
import CommentsDrawer from '@/components/Comments/CommentsDrawer';
import { useGuidanceData } from '@/app/hooks/useGuidanceData';
import { useGuidanceMutations } from "@/app/hooks/useGuidanceMutations";

import styles from './PlanOverviewQuestionPage.module.scss';

type RouteName = Parameters<typeof routePath>[0];

type SectionType = 'BASE' | 'CUSTOM';

// A minimal shape the component needs from the raw GQL question result.
// Both publishedQuestion and publishedCustomQuestion satisfy this after
// the slight normalization the custom page already does.
interface RawQuestion {
  id?: number | null;
  json?: string | null;
  questionText?: string | null;
  requirementText?: string | null;
  guidanceText?: string | null;
  sampleText?: string | null;
  customizationSampleText?: string | null;
  customizationOwnerAffiliation?: {
    name?: string | null,
    uri?: string | null,
    id?: number | null,
    displayName?: string | null
  } | null;
  useSampleTextAsDefault?: boolean | null;
  required?: boolean;
  ownerAffiliation?: { uri?: string | null } | null;
}


/** Everything that differs between the two page variants. */
export interface QuestionPageConfig {
  /** Which URL param holds the question ID ("qid" or "cqid"). */
  questionIdParamKey: string;
  /** The Apollo document to run (PublishedQuestionDocument | PublishedCustomQuestionDocument). */
  questionDocument: DocumentNode;
  /** The variable key expected by the document ("versionedQuestionId" | "versionedCustomQuestionId"). */
  questionVariableKey: string;
  /** Pull the question object out of the raw query result. */
  extractQuestion: (data: Record<string, RawQuestion | null | undefined>) => RawQuestion | null | undefined;
  /** Whether this is a BASE template question or a CUSTOM one. */
  sectionType: SectionType;
  /**
   * Build the params object for useGuidanceMutations.
   * Receives the already-parsed numeric IDs so the caller can
   * rename keys as needed (versionedSectionId vs customSectionId, etc.).
   */
  buildGuidanceMutationParams: (ids: {
    planId: number;
    versionedSectionId: number;
    versionedQuestionId: number;
  }) => {
    planId: number;
    versionedSectionId?: number;
    versionedQuestionId?: number;
    customSectionId?: number;
    customQuestionId?: number;
  };
  /**
   * Build the routeParams object used for logging and routePath() calls.
   * Shape differs between the two pages.
   */
  buildRouteParams: (ids: {
    projectId: string;
    dmpId: string;
    versionedSectionId: string;
    versionedQuestionId: string;
  }) => Record<string, string>;
  /** URL param key for the section ID ('sid' or 'csif') */
  sectionIdParamKey: string;
  /** Which field on a plan section object holds the section ID for membership checks. */
  sectionIdField: 'versionedSectionId' | 'customSectionId';
  /** Route + params to redirect to after a successful save. */
  buildBackRoute: (ids: {
    projectId: string;
    dmpId: string;
    versionedSectionId: string;
  }) => { route: RouteName; params: Record<string, string> };
  /** For building the variables for the answer query */
  buildAnswerQueryVariables: (ids: {
    projectId: number;
    planId: number;
    questionId: number;
  }) => { projectId: number; planId: number; versionedQuestionId?: number; versionedCustomQuestionId?: number };

  /**
   * Build the payload for addAnswerAction (the first-time create call).
   * BASE:   { planId, versionedSectionId, versionedQuestionId, json }
   * CUSTOM: { planId, versionedCustomSectionId, versionedCustomQuestionId, json }
   */
  buildAddAnswerParams: (ids: {
    planId: number;
    sectionId: number;
    questionId: number;
  }) => {
    planId: number;
    versionedSectionId?: number;
    versionedQuestionId?: number;
    versionedCustomSectionId?: number;
    versionedCustomQuestionId?: number;
  };
}

interface FormDataInterface {
  affiliationData: { affiliationName: string; affiliationId: string };
  dateValue: string | DateValue | CalendarDate | null;
  dateRange: { startDate: string | DateValue | CalendarDate | null; endDate: string | DateValue | CalendarDate | null };
  emailValue: string | null;
  inputCurrencyValue: number | null;
  numberRange: { startNumber: number | null; endNumber: number | null };
  otherField: boolean;
  otherAffiliationName: string;
  selectedCheckboxValues: string[];
  selectedRadioValue: string;
  selectedMultiSelectValues: Set<string>;
  selectedSelectValue: string | undefined;
  numberValue: number | null;
  urlValue: string | null;
  textValue: string | number | null;
  textAreaContent: string;
  yesNoValue: string;
  commentValue: string;
}

type AnyParsedQuestion = QuestionTypeMap[keyof QuestionTypeMap];
interface MutationErrorsInterface {
  acronyms: string | null;
  aliases: string | null;
  contactEmail: string | null;
  displayName: string | null;
  feedbackEmails: string | null;
  feedbackMessage: string | null;
  funderRefId: string | null;
  general: string | null;
  homepage: string | null;
  json: string | null;
  logoName: string | null;
  logoURI: string | null;
  name: string | null;
  planId: string | null;
  provenance: string | null;
  searchName: string | null;
  ssoEntityId: string | null;
  subHeaderLinks: string | null;
  types: string | null;
  uri: string | null;
  versionedQuestionId: string | null;
  versionedSectionId: string | null;
}

interface PlanData {
  funder: string;
  funderName: string;
  orgName: string;
  title: string;
  openFeedbackRounds: boolean;
  feedbackId?: number | null;
  feedbackStatus?: string;
  planCreatorOrgId: string;
  collaborators: number[];
  planOwners: number[] | null;
}

export const PlanOverviewQuestionPageShared: React.FC<{ config: QuestionPageConfig }> = ({ config }) => {
  const {
    questionIdParamKey,
    questionDocument,
    questionVariableKey,
    extractQuestion,
    sectionType,
    buildGuidanceMutationParams,
    buildAnswerQueryVariables,
    buildAddAnswerParams,
    buildBackRoute,
  } = config;


  const params = useParams();
  const router = useRouter();
  const dmpId = params.dmpid as string;
  const projectId = params.projectId as string;
  const versionedSectionId = params[config.sectionIdParamKey] as string;
  const versionedQuestionId = params[questionIdParamKey] as string;
  const locale = params.locale as string;

  const routeParams = { projectId, dmpId, versionedSectionId, versionedQuestionId };

  const toastState = useToast(); // Access the toast state from context
  //For scrolling to error in page
  const errorRef = useRef<HTMLDivElement | null>(null);

  // Ref for scrolling to bottom of comments
  const commentsEndRef = useRef<HTMLDivElement | null>(null);

  // VersionedQuestion, plan and versionedSection states
  const [question, setQuestion] = useState<Question>();
  const [plan, setPlan] = useState<PlanData>();
  const [questionType, setQuestionType] = useState<string>('');
  const [parsed, setParsed] = useState<AnyParsedQuestion>();
  const [answerId, setAnswerId] = useState<number | null>(null);
  // Track whether ResearchOutputAnswerComponent is in single-edit view
  const [isResearchOutputEditing, setIsResearchOutputEditing] = useState(false);
  // Track whether the question should be read-only based on plan status and user role
  const [isReadOnly, setIsReadOnly] = useState<boolean>(false);

  const [errors, setErrors] = useState<string[]>([]);

  // Drawer states
  const [isSideBarPanelOpen, setIsSideBarPanelOpen] = useState<boolean>(true);
  const [isSampleTextDrawerOpen, setSampleTextDrawerOpen] = useState<boolean>(false);
  const [isCommentsDrawerOpen, setCommentsDrawerOpen] = useState<boolean>(false);
  const openSampleTextButtonRef = useRef<HTMLButtonElement | null>(null);
  const openCommentsButtonRef = useRef<HTMLButtonElement | null>(null);



  // Question field states (excluding Research Output table)
  const [formData, setFormData] = useState<FormDataInterface>({
    affiliationData: { affiliationName: '', affiliationId: '' },
    dateValue: null,
    dateRange: { startDate: '', endDate: '' },
    emailValue: null,
    inputCurrencyValue: null,
    otherField: false,
    otherAffiliationName: '',
    numberValue: null,
    numberRange: { startNumber: 0, endNumber: 0 },
    selectedRadioValue: '',
    selectedMultiSelectValues: new Set<string>(),
    selectedSelectValue: undefined,
    textValue: null,
    textAreaContent: '',
    selectedCheckboxValues: [],
    urlValue: null,
    yesNoValue: 'no',
    commentValue: ''
  });

  // Separate state for researchOutputTable since it's such a large structure
  const [researchOutputRows, setResearchOutputRows] = useState<ResearchOutputTable[]>([]);
  // Ref to track latest rows synchronously (to avoid stale closure issues)
  const researchOutputRowsRef = useRef<ResearchOutputTable[]>([]);
  const answerCreatedRef = useRef(false); // Track if answer was created in this session for update vs add

  // Form state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  // Track whether there are unsaved changes
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [isAutoSaving, setIsAutoSaving] = useState<boolean>(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>();

  // Localization
  const Global = useTranslations('Global');
  const Guidance = useTranslations('Guidance')
  const PlanOverview = useTranslations('PlanOverview');
  const t = useTranslations('PlanOverviewQuestionPage');

  /*GraphQL queries */
  const {
    data: questionData,
    loading: questionLoading,
    error: questionError,
  } = useQuery(questionDocument, {
    variables: { [questionVariableKey]: Number(versionedQuestionId) },
    skip: !versionedQuestionId,
  });

  // Run me query to get user's name
  const { data: me } = useQuery(MeDocument);

  // Get Plan using planId
  const { data: planData, loading: planQueryLoading, error: planQueryError } = useQuery(
    PlanDocument,
    {
      variables: { planId: Number(dmpId) },
      notifyOnNetworkStatusChange: true
    }
  );

  // versionedTemplateId for guidance filtering
  const versionedTemplateId = planData?.plan?.versionedTemplate?.id;

  // Get section tag info from plan data and user affiliation
  const {
    sectionTagsMap,
    guidanceItems,
  } = useGuidanceData({
    planId: parseInt(dmpId),
    versionedSectionId: Number(versionedSectionId),
    versionedQuestionId: Number(versionedQuestionId),
    sectionType
  });

  // Use guidance mutations hook (mutations only, no data)
  const { addGuidanceOrganization, removeGuidanceOrganization, clearError, guidanceError } =
    useGuidanceMutations(
      buildGuidanceMutationParams({   // <-- caller shapes the keys
        planId: parseInt(dmpId),
        versionedSectionId: Number(versionedSectionId),
        versionedQuestionId: Number(versionedQuestionId),
      })
    );

  // Get answer data
  const { data: answerData, loading: answerLoading, error: answerError } = useQuery(
    AnswerByVersionedQuestionIdDocument,
    {
      variables: buildAnswerQueryVariables({
        projectId: Number(projectId),
        planId: Number(dmpId),
        questionId: Number(versionedQuestionId),
      }) as { projectId: number; planId: number; versionedQuestionId: number; versionedCustomQuestionId?: number },
      notifyOnNetworkStatusChange: true,
    }
  );

  // Comments state and handlers hook
  const {
    // State
    mergedComments,
    editingCommentId,
    editingCommentText,
    canAddComments,
    errors: commentErrors,

    // Setters
    setEditingCommentText,
    setCommentsFromData,
    updateCanAddComments,

    // Handlers
    handleAddComment,
    handleDeleteComment,
    handleEditComment,
    handleUpdateComment,
    handleCancelEdit
  } = useComments({
    dmpId,
    planFeedbackId: plan?.feedbackId,
    me,
    planOrgId: plan?.planCreatorOrgId,
    openFeedbackRounds: plan?.openFeedbackRounds,
    planOwners: plan?.planOwners,
    collaborators: plan?.collaborators
  });

  // Show Success Message
  const showSuccessToast = (type?: string) => {
    if (type === 'save') {
      const successMessage = t('messages.success.questionSaved');
      toastState.add(successMessage, { type: 'success', timeout: 3000 });

    } else if (type === 'delete') {
      const successMessage = t('messages.success.questionDeleted');
      toastState.add(successMessage, { type: 'success', timeout: 3000 });
    } else {
      const successMessage = t('messages.success.saved');
      toastState.add(successMessage, { type: 'success', timeout: 3000 });
    }
  }

  /*Handling Drawer Panels*/
  // Toggle the sample text drawer open and closed
  const toggleSampleTextDrawer = () => {
    const newDrawerState = !isSampleTextDrawerOpen;

    setSampleTextDrawerOpen(newDrawerState);
    setIsSideBarPanelOpen(!newDrawerState); // Opposite of drawer state
  }

  // Toggle the comments drawer open and closed
  const toggleCommentsDrawer = () => {
    const newDrawerState = !isSampleTextDrawerOpen;

    setCommentsDrawerOpen(newDrawerState);
    setIsSideBarPanelOpen(!newDrawerState); // Opposite of drawer state
  }

  // Just close the current drawer and no need to check mask/backdrop
  const closeCurrentDrawer = () => {
    setIsSideBarPanelOpen(true);
    setSampleTextDrawerOpen(false);
    setCommentsDrawerOpen(false);
  }

  function buildSetContent<T extends keyof FormDataInterface>(
    key: T,
    setFormData: React.Dispatch<React.SetStateAction<typeof formData>>
  ) {
    return (value: FormDataInterface[T]) => {
      setFormData((prev) => ({
        ...prev,
        [key]: value,
      }));
    };
  }

  // When the user clicks on the 'use answer' button from the Sample text drawer panel
  const handleUseAnswer = (text: string | null | undefined) => {
    if (text) {
      // Set the new value for the textArea
      setFormData(prev => ({
        ...prev,
        textAreaContent: text
      }));

      // Close sample text drawer
      setSampleTextDrawerOpen(false);

      // Return focus to sample text button
      if (openSampleTextButtonRef.current) {
        openSampleTextButtonRef.current.focus();
      }

      // message user
      toastState.add(t('messages.sampleTextAdded'), { type: 'success', timeout: 3000 });
    }
  }

  const updateCommentHandler = async (comment: MergedComment) => {
    handleUpdateComment(comment);
    // Keep drawer open so the user can see that they comment changed
    setCommentsDrawerOpen(true);
  }


  const addCommentHandler = async (e: React.FormEvent<HTMLFormElement>, newComment: string) => {
    e.preventDefault();
    handleAddComment(e, answerId!, newComment);
  }

  // Handling changes to different question types
  const handleAffiliationChange = async (id: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      affiliationData: {
        affiliationName: value,
        affiliationId: id
      }
    }));
    setHasUnsavedChanges(true);
  }

  const handleOtherAffiliationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData(prev => ({
      ...prev,
      otherAffiliationName: value
    }));
    setHasUnsavedChanges(true);
  };

  // Update the selected radio value when user selects different option
  const handleRadioChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      selectedRadioValue: value
    }));
    setHasUnsavedChanges(true);
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData(prev => ({
      ...prev,
      urlValue: value
    }));
    setHasUnsavedChanges(true);
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData(prev => ({
      ...prev,
      emailValue: value
    }));
    setHasUnsavedChanges(true);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData(prev => ({
      ...prev,
      textValue: value
    }));
    setHasUnsavedChanges(true);
  };

  const handleTextAreaChange = () => {
    setHasUnsavedChanges(true);
  };

  // Handler for checkbox group changes
  const handleCheckboxGroupChange = (values: string[]) => {
    setFormData(prev => ({
      ...prev,
      selectedCheckboxValues: values
    }));
    setHasUnsavedChanges(true);
  };

  const handleBooleanChange = (values: string) => {
    setFormData(prev => ({
      ...prev,
      yesNoValue: values
    }));
    setHasUnsavedChanges(true);
  };


  // Handler for Select changes
  const handleSelectChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      selectedSelectValue: value
    }));
    setHasUnsavedChanges(true);
  };

  // Handle comment field change
  const handleCommentValueChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      commentValue: value
    }));
    setHasUnsavedChanges(true);
  };

  // Handler for MultiSelect changes
  const handleMultiSelectChange = (values: Set<string>) => {
    setFormData(prev => ({
      ...prev,
      selectedMultiSelectValues: values
    }));
    setHasUnsavedChanges(true);
  };

  // Handler for date change
  const handleDateChange = (
    value: string | DateValue | CalendarDate | null
  ) => {
    setFormData(prev => ({
      ...prev,
      dateValue: value
    }));
    setHasUnsavedChanges(true);
  };

  // Handler for date range changes
  const handleDateRangeChange = (
    key: string,
    value: string | DateValue | CalendarDate | null
  ) => {
    setFormData(prev => ({
      ...prev,
      dateRange: {
        ...prev.dateRange,
        [key]: value
      }
    }));
    setHasUnsavedChanges(true);
  };

  // Handler for currency changes
  const handleCurrencyChange = (value: number | null) => {
    setFormData(prev => ({
      ...prev,
      inputCurrencyValue: value
    }));
    setHasUnsavedChanges(true);
  };


  // Handler for number changes
  const handleNumberChange = (value: number) => {
    setFormData(prev => ({
      ...prev,
      numberValue: value
    }));
    setHasUnsavedChanges(true);
  };

  // Handler for number range changes
  const handleNumberRangeChange = (
    key: string,
    value: string | number | null
  ) => {
    setFormData(prev => ({
      ...prev,
      numberRange: {
        ...prev.numberRange,
        [key]: value === '' ? null : Number(value) // Convert empty string to null  
      }
    }));
    setHasUnsavedChanges(true);
  };

  const handleBackToSection = () => {
    const { route, params: backParams } = buildBackRoute({
      projectId, dmpId, versionedSectionId,
    });
    router.push(routePath(route, backParams));
  }

  // Pass this save function to research output table so it can trigger a save
  const saveResearchOutputs = async (rows: ResearchOutputTable[], type?: string) => {
    // Clear hasUnsavedChanges immediately to cancel any pending auto-save effect
    setHasUnsavedChanges(false);

    // Cancel any pending auto-save since we're doing a manual save now
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
      autoSaveTimeoutRef.current = undefined;
    }

    // Update parent state with the latest rows data
    setResearchOutputRows(rows);
    // Also update ref for synchronous access
    researchOutputRowsRef.current = rows;

    // Show saving indicator
    setIsAutoSaving(true);

    try {
      // Pass rows directly to addAnswer so it uses fresh data
      const { success } = await addAnswer(false, rows);
      if (success) {
        setLastSavedAt(new Date());
        showSuccessToast(type);
      }
    } finally {
      // Always clear saving indicator
      setIsAutoSaving(false);
    }
  };

  // Keep ref in sync with state for research output rows
  useEffect(() => {
    researchOutputRowsRef.current = researchOutputRows;
  }, [researchOutputRows]);

  // Prefill the current question with existing answer
  /*eslint-disable @typescript-eslint/no-explicit-any*/
  const prefillAnswer = (answer: any, type: string) => {
    switch (type) {
      case TYPEAHEAD_QUESTION_TYPE:
        if (answer) {
          setFormData(prev => ({
            ...prev,
            affiliationData: {
              affiliationId: answer.affiliationId,
              affiliationName: answer.affiliationName
            },
            otherField: answer.isOther,
            otherAffiliationName: ''
          }));
        }
        break;
      case BOOLEAN_QUESTION_TYPE:
        setFormData(prev => ({
          ...prev,
          yesNoValue: answer === true ? 'yes' : 'no'
        }));
        break;
      case CHECKBOXES_QUESTION_TYPE:
        setFormData(prev => ({
          ...prev,
          selectedCheckboxValues: answer
        }));
        break;
      case CURRENCY_QUESTION_TYPE:
        setFormData(prev => ({
          ...prev,
          inputCurrencyValue: answer
        }));
        break;
      case DATE_QUESTION_TYPE:
        setFormData(prev => ({
          ...prev,
          dateValue: answer
        }));
        break;
      case DATE_RANGE_QUESTION_TYPE:
        if (answer?.start || answer?.end) {
          setFormData(prev => ({
            ...prev,
            dateRange: {
              startDate: answer?.start,
              endDate: answer?.end
            }
          }));
        }
        break;
      case EMAIL_QUESTION_TYPE:
        setFormData(prev => ({
          ...prev,
          emailValue: answer
        }));
        break;
      case MULTISELECTBOX_QUESTION_TYPE:
        setFormData(prev => ({
          ...prev,
          selectedMultiSelectValues: new Set(answer)
        }));
        break;
      case NUMBER_QUESTION_TYPE:
        setFormData(prev => ({
          ...prev,
          numberValue: answer
        }));
        break;
      case NUMBER_RANGE_QUESTION_TYPE:
        if (answer?.start || answer?.end) {
          setFormData(prev => ({
            ...prev,
            numberRange: {
              startNumber: answer?.start,
              endNumber: answer?.end
            }
          }));
        }
        break;
      case RADIOBUTTONS_QUESTION_TYPE:
        setFormData(prev => ({
          ...prev,
          selectedRadioValue: answer
        }));
        break;
      case RESEARCH_OUTPUT_QUESTION_TYPE:
        if (answer && Array.isArray(answer)) {
          setResearchOutputRows(answer);
        } else {
          // Initialize with empty row if no answer exists AND no rows exist yet
          if (parsed?.type === RESEARCH_OUTPUT_QUESTION_TYPE) {
            setResearchOutputRows(prev => {
              if (prev.length > 0) return prev;
              const emptyRow = createEmptyResearchOutputRow(parsed.columns);
              return [emptyRow];
            });
          }
        }
        break;
      case SELECTBOX_QUESTION_TYPE:
        setFormData(prev => ({
          ...prev,
          selectedSelectValue: answer
        }));
        break;
      case TEXT_FIELD_QUESTION_TYPE:
        setFormData(prev => ({
          ...prev,
          textValue: answer
        }));
        break;
      case TEXT_AREA_QUESTION_TYPE:
        setFormData(prev => ({
          ...prev,
          textAreaContent: answer
        }));
        break;
      case URL_QUESTION_TYPE:
        setFormData(prev => ({
          ...prev,
          urlValue: answer
        }));
        break;
      default:
        break;
    }
  };

  // Get the answer for the question
  const getAnswerJson = (overrideRows?: ResearchOutputTable[]): Record<string, any> => {
    switch (questionType) {
      case TEXT_AREA_QUESTION_TYPE:
        return {
          type: TEXT_AREA_QUESTION_TYPE,
          answer: formData.textAreaContent,
          meta: {
            schemaVersion: CURRENT_SCHEMA_VERSION
          }
        };

      case TEXT_FIELD_QUESTION_TYPE:
        return {
          type: TEXT_FIELD_QUESTION_TYPE,
          answer: formData.textValue,
          meta: {
            schemaVersion: CURRENT_SCHEMA_VERSION
          }
        };

      case RADIOBUTTONS_QUESTION_TYPE:
        return {
          type: RADIOBUTTONS_QUESTION_TYPE,
          answer: formData.selectedRadioValue,
          meta: {
            schemaVersion: CURRENT_SCHEMA_VERSION
          },
          comment: formData.commentValue
        };

      case CHECKBOXES_QUESTION_TYPE:
        return {
          type: CHECKBOXES_QUESTION_TYPE,
          answer: formData.selectedCheckboxValues,
          meta: {
            schemaVersion: CURRENT_SCHEMA_VERSION
          },
          comment: formData.commentValue
        };

      case SELECTBOX_QUESTION_TYPE:
        return {
          type: SELECTBOX_QUESTION_TYPE,
          answer: formData.selectedSelectValue,
          meta: {
            schemaVersion: CURRENT_SCHEMA_VERSION
          },
          comment: formData.commentValue
        };

      case MULTISELECTBOX_QUESTION_TYPE:
        return {
          type: MULTISELECTBOX_QUESTION_TYPE,
          answer: Array.from(formData.selectedMultiSelectValues),
          meta: {
            schemaVersion: CURRENT_SCHEMA_VERSION
          },
          comment: formData.commentValue
        };

      case BOOLEAN_QUESTION_TYPE:
        return {
          type: BOOLEAN_QUESTION_TYPE,
          answer: formData.yesNoValue === 'yes',
          meta: {
            schemaVersion: CURRENT_SCHEMA_VERSION
          }
        };

      case EMAIL_QUESTION_TYPE:
        return {
          type: EMAIL_QUESTION_TYPE,
          answer: formData.emailValue,
          meta: {
            schemaVersion: CURRENT_SCHEMA_VERSION
          }
        };

      case URL_QUESTION_TYPE:
        return {
          type: URL_QUESTION_TYPE,
          answer: formData.urlValue,
          meta: {
            schemaVersion: CURRENT_SCHEMA_VERSION
          }
        };

      case NUMBER_QUESTION_TYPE:
        return {
          type: NUMBER_QUESTION_TYPE,
          answer: formData.numberValue,
          meta: {
            schemaVersion: CURRENT_SCHEMA_VERSION
          },
          comment: formData.commentValue
        };

      case CURRENCY_QUESTION_TYPE:
        return {
          type: CURRENCY_QUESTION_TYPE,
          answer: formData.inputCurrencyValue,
          meta: {
            schemaVersion: CURRENT_SCHEMA_VERSION
          },
          comment: formData.commentValue
        };

      case DATE_QUESTION_TYPE:
        return {
          type: DATE_QUESTION_TYPE,
          answer: formData.dateValue?.toString(),
          meta: {
            schemaVersion: CURRENT_SCHEMA_VERSION
          },
          comment: formData.commentValue
        };

      case RESEARCH_OUTPUT_QUESTION_TYPE:
        // Extract column headings from parsed question columns
        const columnHeadings = parsed?.type === RESEARCH_OUTPUT_QUESTION_TYPE
          ? [
            ...parsed.columns.map(col => col.heading),
            'Anticipated Release Date',
            'Anticipated file size'
          ]
          : [];

        // Use the most current data available: overrideRows > ref > state
        const rowsToUse = overrideRows !== undefined ? overrideRows : (researchOutputRowsRef.current.length > 0 ? researchOutputRowsRef.current : researchOutputRows);

        return {
          type: RESEARCH_OUTPUT_QUESTION_TYPE,
          columnHeadings,
          answer: rowsToUse,
          meta: {
            schemaVersion: CURRENT_SCHEMA_VERSION
          }
        };

      case DATE_RANGE_QUESTION_TYPE:

        return {
          type: DATE_RANGE_QUESTION_TYPE,
          answer: {
            start: formData.dateRange.startDate?.toString() ?? null,
            end: formData.dateRange.endDate?.toString() ?? null
          },
          meta: {
            schemaVersion: CURRENT_SCHEMA_VERSION
          },
          comment: formData.commentValue
        };

      case NUMBER_RANGE_QUESTION_TYPE:
        return {
          type: NUMBER_RANGE_QUESTION_TYPE,
          answer: {
            start: formData.numberRange.startNumber,
            end: formData.numberRange.endNumber
          },
          meta: {
            schemaVersion: CURRENT_SCHEMA_VERSION
          },
          comment: formData.commentValue
        };

      case TYPEAHEAD_QUESTION_TYPE:
        return {
          type: TYPEAHEAD_QUESTION_TYPE,
          answer: {
            affiliationId: formData.affiliationData.affiliationId,
            affiliationName: formData.otherField ? formData.otherAffiliationName : formData.affiliationData.affiliationName,
          },
          meta: {
            schemaVersion: CURRENT_SCHEMA_VERSION
          },
          comment: formData.commentValue
        };

      default:
        return {
          type: questionType,
          answer: formData.textAreaContent,
          meta: {
            schemaVersion: CURRENT_SCHEMA_VERSION
          },
          comment: formData.commentValue
        };
    }
  };

  // GraphQL mutation returns errors
  const hasFieldLevelErrors = (mutationErrors: MutationErrorsInterface): boolean => {
    return Object.values(mutationErrors).some(
      value => value !== null && value !== undefined
    );
  };

  // Extract the errors from the graphql mutation result
  const getExtractedErrorValues = (mutationErrors: MutationErrorsInterface): string[] => {
    return Object.values(mutationErrors).filter(
      (value) => value !== null && value !== undefined
    );
  };

  // Call Server Action updateAnswerAction or addAnswerAction to save answer
  const addAnswer = async (isAutoSave = false, overrideRows?: ResearchOutputTable[]) => {
    if (isAutoSave) {
      setIsAutoSaving(true);
    }

    const jsonPayload = getAnswerJson(overrideRows);

    // Check if answer already exists. If so, we want to call an update mutation rather than add
    // Use ref to track if answer was created in this session, since answerData query won't update immediately
    const isUpdate = Boolean(answerData?.answerByVersionedQuestionId) || answerCreatedRef.current;

    // Get the answer ID from either the query or the state (after first create)
    const currentAnswerId = answerId || answerData?.answerByVersionedQuestionId?.id; // Very important because we have to make sure to apply the latest answer ID, otherwise addAnswerAction is called more than once for same id

    if (questionData && planData?.plan) {
      try {
        type AddAnswerParams = Parameters<typeof addAnswerAction>[0];

        const addParams: AddAnswerParams = {
          ...buildAddAnswerParams({
            planId: Number(dmpId),
            sectionId: Number(versionedSectionId),
            questionId: Number(versionedQuestionId),
          }),
          json: JSON.stringify(jsonPayload),
        };

        const response = isUpdate
          ? await updateAnswerAction({
            answerId: Number(currentAnswerId),
            json: JSON.stringify(jsonPayload),
          })
          : await addAnswerAction(addParams);

        if (response.redirect) {
          router.push(response.redirect);
        }

        // Track that answer was created so subsequent saves will use update
        if (!isUpdate && response.success) {
          // The answer ID is directly in response.data.id
          const newAnswerId = response.data?.id;
          if (newAnswerId) {
            answerCreatedRef.current = true;
            setAnswerId(newAnswerId);
          }
        }

        return {
          success: response.success,
          errors: response.errors,
          data: response.data
        }
      } catch (error) {
        logECS('error', 'addAnswer', {
          error,
          url: {
            path: routePath('projects.dmp.versionedQuestion.detail', { projectId, dmpId, versionedSectionId, versionedQuestionId })
          }
        });
      } finally {
        if (isAutoSave) {
          setIsAutoSaving(false);
          setHasUnsavedChanges(false);
        }
      }
    }
    return {
      success: false,
      errors: [Global('messaging.somethingWentWrong')],
      data: null
    };
  }

  // Handle submit of question detail form
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setErrors([]); // Clear previous errors

    // Prevent double submission
    if (isSubmitting) return;
    setIsSubmitting(true);

    // Clear any pending auto-save
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    const result = await addAnswer();

    const { route, params: backParams } = config.buildBackRoute({
      projectId, dmpId, versionedSectionId,
    });


    if (!result.success) {
      const errors = result.errors;
      if (errors) {
        setErrors(errors)
      }
    } else {
      // On success
      setIsSubmitting(false);
      if (result.data?.errors && hasFieldLevelErrors(result.data.errors as unknown as MutationErrorsInterface)) {
        const mutationErrors = result.data.errors as unknown as MutationErrorsInterface;
        const extractedErrors = getExtractedErrorValues(mutationErrors);
        // Handle errors as an object with general or field-level errors
        setErrors(extractedErrors);

      } else {
        setHasUnsavedChanges(false);
        // Show user a success message and redirect back to the Section page
        showSuccessToast('save');
        router.push(routePath(route, backParams));
      }
    }
  };

  // Helper function to format the last saved messaging
  const getLastSavedText = () => {
    if (isAutoSaving) {
      return `${Global('buttons.saving')}...`;
    }

    if (!lastSavedAt) {
      return hasUnsavedChanges ? t('messages.unsavedChanges') : '';
    }

    const diffInMinutes = Math.floor(Math.abs(currentTime.getTime() - lastSavedAt.getTime()) / (1000 * 60));

    if (diffInMinutes === 0) {
      return t('messages.savedJustNow');
    } else if (diffInMinutes === 1) {
      return t('messages.lastSavedOneMinuteAgo');
    } else {
      return t('messages.lastSaves', { minutes: diffInMinutes });
    }
  };

  // Get parsed JSON from question, and set parsed, question and questionType in state
  useEffect(() => {
    if (questionData) {
      const q = extractQuestion(questionData as Record<string, RawQuestion | null | undefined>);
      if (!q) {
        return;
      }

      // Normalise to the shape getParsedQuestionJSON expects.
      // The BASE page used the object directly; the CUSTOM page re-mapped keys
      // explicitly. Both produce the same shape, so we do it once here.
      const cleanedQuestion: Question = {
        id: q.id,
        json: q.json,
        questionText: q.questionText,
        requirementText: q.requirementText,
        guidanceText: q.guidanceText,
        sampleText: q.sampleText,
        customizationSampleText: q.customizationSampleText,
        customizationOwnerAffiliation: q.customizationOwnerAffiliation ?? null,
        useSampleTextAsDefault: q.useSampleTextAsDefault,
        required: q.required ?? undefined,
        ownerAffiliation: q.ownerAffiliation as Question['ownerAffiliation'] ?? null,
      };

      try {
        const { parsed, error } = getParsedQuestionJSON(cleanedQuestion, routePath('projects.dmp.versionedQuestion.detail', routeParams), Global);
        if (!parsed?.type) {
          if (error) {
            logECS('error', 'Parsing error', {
              error: 'Invalid question type in parsed JSON',
              url: { path: routePath('projects.dmp.versionedQuestion.detail', routeParams) }
            });

            setErrors([error])
          }
          return;
        }

        const questionType = parsed.type;

        // Set data in state
        setQuestionType(questionType);
        setParsed(parsed);
        setQuestion(cleanedQuestion);
      } catch (error) {
        logECS('error', 'Parsing error', {
          error,
          url: { path: routePath('projects.dmp.versionedQuestion.detail', { projectId, dmpId, versionedSectionId, versionedQuestionId }) }
        });
        setErrors(['Error parsing question data']);
      }
    }
  }, [questionData]);


  // Set plan data in state
  useEffect(() => {
    if (planData?.plan) {
      // Validate section belongs to plan - 404 if not
      const planSections = planData?.plan?.versionedSections || [];
      const sectionBelongsToPlan = planSections && planSections.some(
        section => section[config.sectionIdField] === Number(versionedSectionId));

      // Make sure to redirect to 404 if section does not belong to plan
      if (!sectionBelongsToPlan) {
        router.push('/not-found')
      }

      const planOwners = [
        // Include the original plan creator if it exists
        ...(planData?.plan?.createdById ? [planData.plan.createdById] : []),
        // Include collaborators with role="OWN"
        ...(planData?.plan?.project?.collaborators
          ?.filter(c => c?.accessLevel === "OWN")
          ?.map(c => c?.user?.id)
          ?.filter((id): id is number => id != null) ?? [])
      ];

      // Remove duplicates from planOwners in case the creator is also listed as a collaborator with OWN role
      const uniquePlanOwners = [...new Set(planOwners)];

      const planInfo = {
        funder: planData?.plan?.project?.fundings?.[0]?.affiliation?.displayName ?? '',
        funderName: planData?.plan?.project?.fundings?.[0]?.affiliation?.name ?? '',
        orgName: planData?.plan?.versionedTemplate?.owner?.name ?? '',
        title: planData?.plan?.project?.title ?? '',
        openFeedbackRounds: planData?.plan?.feedback?.some(f => f.completed == null) ?? false, // If any of the feedback rounds have not yet been completed
        feedbackId: planData?.plan?.feedback?.find(item => item.completed === null)?.id, //Get first feedback id where it has not yet been completed
        feedbackStatus: planData?.plan?.feedbackStatus?.status ?? '', //Get feedback status from plan data
        planCreatorOrgId: planData?.plan?.planCreator?.affiliation?.uri ?? '', //affiliation id for plan
        collaborators: planData?.plan?.project?.collaborators
          ?.map(c => c?.user?.id)
          .filter((id): id is number => id != null) ?? [], //filter out any null or undefined for projectCollaborators
        planOwners: uniquePlanOwners ?? null, //plan owner
      }

      setPlan(planInfo);
      setIsReadOnly(planData?.plan?.readOnly ?? false);
    };
  }, [planData]);


  useEffect(() => {
    //Wait for answerData and questionType, then prefill the question with existing answer
    const json = answerData?.answerByVersionedQuestionId?.json;
    if (json && questionType) {
      const parsed = JSON.parse(json);

      // Prefill the main answer
      if (parsed?.answer !== undefined) {
        prefillAnswer(parsed.answer, questionType);
      }

      // Also prefill comment field if it exists
      if (parsed?.comment !== undefined) {
        setFormData(prev => ({
          ...prev,
          commentValue: parsed.comment
        }))
      }
    }

    // Combine both answerComments and feedbackComments into one, and save in state after ordering
    const answerComments = answerData?.answerByVersionedQuestionId?.comments;
    const feedbackComments = answerData?.answerByVersionedQuestionId?.feedbackComments;

    // Set comments from both answer and feedback comments into mergedComments state
    setCommentsFromData(answerComments, feedbackComments);

    setAnswerId(answerData?.answerByVersionedQuestionId?.id ?? null);

  }, [answerData, questionType]);

  // useEffect(() => {
  //   const adminStatus =
  //     !!(me?.me?.affiliation?.uri &&
  //       me.me.affiliation.uri === planData?.plan?.planCreator?.affiliation?.uri &&
  //       (me.me.role === UserRole.Admin || me.me.role === UserRole.Superadmin));

  //   setIsReadOnly(planData?.plan?.feedbackStatus?.status === 'REQUESTED' && adminStatus);
  // }, [me?.me?.affiliation?.uri, me?.me?.role, planData, plan?.planCreatorOrgId]);

  // Auto-save logic
  useEffect(() => {
    if (!hasUnsavedChanges) return;
    if (isReadOnly) return;
    if (!versionedQuestionId || !versionedSectionId || !question) return;

    // Set a timeout to auto-save after 3 seconds of inactivity
    autoSaveTimeoutRef.current = setTimeout(async () => {
      const { success } = await addAnswer(true);
      if (success) {
        setLastSavedAt(new Date());
        setHasUnsavedChanges(false);
      }
    }, 3000);

    return () => clearTimeout(autoSaveTimeoutRef.current);
  }, [formData, researchOutputRows, versionedQuestionId, versionedSectionId, question, hasUnsavedChanges]);

  // Detect changes to research output rows to set hasUnsavedChanges
  useEffect(() => {
    if (researchOutputRows.length > 0 && questionType === RESEARCH_OUTPUT_QUESTION_TYPE) {
      setHasUnsavedChanges(true);
    }
  }, [researchOutputRows, questionType]);

  // Auto-save on window blur and before unload
  useEffect(() => {
    const handleWindowBlur = () => {
      if (isReadOnly) return;
      if (hasUnsavedChanges && !isAutoSaving) {
        if (autoSaveTimeoutRef.current) {
          clearTimeout(autoSaveTimeoutRef.current);
        }
        addAnswer(true);
      }
    };

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = ''; // Required for Chrome/Firefox to show the confirm dialog
      }
    };

    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [hasUnsavedChanges, isAutoSaving]);


  // Set up an interval to update the current time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60 * 1000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Set whether current user can add comments based on their role and plan data
    updateCanAddComments();
  }, [me, planData, plan])

  // Set errors from commentErrors state
  useEffect(() => {
    setErrors((prevErrors) => [...prevErrors, ...commentErrors]);
  }, [commentErrors])

  // Render the question using the useRenderQuestionField helper
  const questionField = useRenderQuestionField({
    questionType,
    parsed,
    readOnly: isReadOnly,
    textFieldProps: {
      textValue: typeof formData.textValue === 'string' ? formData.textValue : '',
      handleTextChange,
    },
    textAreaProps: {
      content:
        // Check if answerId does not exist (meaning answer has not yet been created) and 
        // question allows sample text as default and sample text exists, then use sample text. 
        // Otherwise use formData which could be existing answer or user input
        !answerData?.answerByVersionedQuestionId?.id &&
          !formData.textAreaContent &&
          question?.useSampleTextAsDefault &&
          !!question?.sampleText
          ? question.sampleText
          : formData.textAreaContent,
      setContent: buildSetContent('textAreaContent', setFormData),
      handleTextAreaChange
    },
    radioProps: {
      selectedRadioValue: formData.selectedRadioValue,
      handleRadioChange
    },
    checkBoxProps: {
      selectedCheckboxValues: formData.selectedCheckboxValues,
      handleCheckboxGroupChange,
    },
    selectBoxProps: {
      selectedSelectValue: formData.selectedSelectValue,
      setSelectedSelectValue: buildSetContent('selectedSelectValue', setFormData),
      handleSelectChange
    },
    multiSelectBoxProps: {
      selectedMultiSelectValues: formData.selectedMultiSelectValues,
      handleMultiSelectChange,
    },
    dateProps: {
      dateValue: formData.dateValue,
      handleDateChange,
    },
    dateRangeProps: {
      dateRange: formData.dateRange,
      handleDateRangeChange,
    },
    numberProps: {
      numberValue: formData.numberValue,
      handleNumberChange
    },
    numberRangeProps: {
      numberRange: formData.numberRange,
      handleNumberRangeChange,
    },
    currencyProps: {
      inputCurrencyValue: formData.inputCurrencyValue,
      handleCurrencyChange
    },
    urlProps: {
      urlValue: formData.urlValue,
      handleUrlChange,
    },
    emailProps: {
      emailValue: formData.emailValue,
      handleEmailChange,
    },
    booleanProps: {
      yesNoValue: formData.yesNoValue,
      handleBooleanChange,
    },
    typeaheadSearchProps: {
      affiliationData: formData.affiliationData,
      otherAffiliationName: formData.otherAffiliationName,
      otherField: formData.otherField,
      setOtherField: buildSetContent('otherField', setFormData),
      handleAffiliationChange,
      handleOtherAffiliationChange,
    },
    researchOutputTableAnswerProps:
      parsed?.type === RESEARCH_OUTPUT_QUESTION_TYPE
        ? {
          columns: parsed.columns,
          rows: researchOutputRows,
          setRows: setResearchOutputRows,
          onSave: saveResearchOutputs,
          onEditingStateChange: setIsResearchOutputEditing,
        }
        : undefined,
  });

  if (questionLoading || planQueryLoading || answerLoading) {
    return <Loading message={Global('messaging.loading')} />;
  }
  if (questionError || planQueryError || answerError) {
    return <div className="error">{Global('messaging.somethingWentWrong')}</div>;
  }

  return (
    <>
      <PageHeader
        title={plan?.title ?? ''}
        description=""
        showBackButton={true}
        breadcrumbs={
          <Breadcrumbs aria-label={PlanOverview('navigation.navigation')}>
            <Breadcrumb><Link href={routePath('app.home')}>{Global('breadcrumbs.home')}</Link></Breadcrumb>
            <Breadcrumb><Link href={routePath('projects.index')}>{Global('breadcrumbs.projects')}</Link></Breadcrumb>
            <Breadcrumb><Link href={routePath('projects.show', { projectId })}>{Global('breadcrumbs.projectOverview')}</Link></Breadcrumb>
            <Breadcrumb><Link href={routePath('projects.dmp.show', { projectId, dmpId })}>{Global('breadcrumbs.planOverview')}</Link></Breadcrumb>
            <Breadcrumb><Link href={routePath('projects.dmp.versionedSection', { projectId, dmpId, versionedSectionId })}>{Global('breadcrumbs.sectionOverview')}</Link></Breadcrumb>
            <Breadcrumb>{Global('breadcrumbs.questionDetails')}</Breadcrumb>
          </Breadcrumbs>
        }
        actions={null}
        className="page-project-list"
      />

      <ErrorMessages errors={errors} ref={errorRef} />

      <LayoutWithPanel>
        {plan?.feedbackStatus === "REQUESTED" && (
          <NotificationHeader
            title={t("feedbackNotification.title")}
          >
            <p>{t("feedbackNotification.description")}</p>
          </NotificationHeader>
        )}
        <ContentContainer>
          <div className="container">
            {/**Requirements by funder */}
            {question?.requirementText && (
              <section aria-label={PlanOverview('page.requirementsBy', { funder: plan?.funder ?? '' })}>
                <h3 className={"h4"}>{PlanOverview('page.requirementsBy', { funder: plan?.funder ?? '' })}</h3>
                <SafeHtml html={question?.requirementText} />
              </section>
            )}

            {/**Requirements by organization */}
            <section aria-label={"Requirements"}>
              {/**TODO: need to get this data from backend once org requirements are available */}
              <h3 className={"h4"}>Requirements by University of California</h3>
              <p>
                The university requires data and metadata to be cleared by the ethics
                committee before being submitted to funder.
              </p>
            </section>

            <p className={styles.guidanceLinkWrapper}>
              <DmpIcon icon="down_arrow" />
              <Link href="#guidance" className={`${styles.guidanceLink} react-aria-Link`}>{PlanOverview('page.jumpToGuidance')}</Link>
            </p>
            <Form onSubmit={isReadOnly ? (e) => e.preventDefault() : handleSubmit} data-testid="question-form">
              <Card data-testid='question-card'>
                <span>{PlanOverview('headings.question')}</span>
                <h2 id="question-title" className="h3">
                  {stripHtmlTags(question?.questionText)}
                </h2>
                {question?.required && (
                  <div className={styles.requiredWrapper}>
                    <div><strong>{PlanOverview('page.requiredByFunder')}</strong></div>
                    <DialogTrigger>
                      <Button className="popover-btn" aria-label="Required by funder"><div className="icon info"><DmpIcon icon="info" /></div></Button>
                      <Popover>
                        <OverlayArrow>
                          <svg width={12} height={12} viewBox="0 0 12 12">
                            <path d="M0 0 L6 6 L12 0" />
                          </svg>
                        </OverlayArrow>
                        <Dialog>
                          <div className="flex-col">
                            {PlanOverview('page.requiredByFunderInfo')}
                          </div>
                        </Dialog>
                      </Popover>
                    </DialogTrigger>
                  </div>
                )}
                <div>
                  <div className={styles.buttonsRow}>
                    {/**Only include sample text button for textArea question types and if sampleText is not empty and NOT read-only */}
                    {(questionType === TEXT_AREA_QUESTION_TYPE && !isReadOnly && (question?.sampleText || question?.customizationSampleText)) && (
                      <Button
                        ref={openSampleTextButtonRef}
                        className="tertiary small"
                        data-secondary
                        onPress={toggleSampleTextDrawer}
                      >
                        {PlanOverview('page.viewSampleAnswer')}
                      </Button>
                    )}

                    {/**Only show active comment button if an answer exists, otherwise show a disabled button with message */}
                    {answerId ? (
                      <Button
                        ref={openCommentsButtonRef}
                        className={styles.buttonSmall}
                        onPress={toggleCommentsDrawer}
                      >
                        {t('buttons.commentWithNumber', { number: mergedComments.length })}
                      </Button>
                    ) : (
                      <TooltipTrigger delay={0}>
                        <Button
                          ref={openCommentsButtonRef}
                          className={styles.buttonSmallDisabled}
                          aria-disabled={true}
                        >
                          {t('buttons.commentWithNumber', { number: mergedComments.length })}
                        </Button>
                        <Tooltip
                          placement="bottom"
                          className={`${styles.tooltip} py-2 px-2`}
                        >
                          {PlanOverview('page.commentTooltip')}
                        </Tooltip>
                      </TooltipTrigger>
                    )}

                  </div>
                  {parsed && questionField}
                  {/** Add comment field if showCommentField is true in parsed question JSON */}
                  {parsed && 'showCommentField' in parsed && parsed.showCommentField && (
                    <FormTextArea
                      name="comment"
                      label={Global('labels.additionalComments')}
                      placeholder={Global('placeholders.enterComment')}
                      value={formData.commentValue}
                      onChange={handleCommentValueChange}
                      disabled={isReadOnly}
                    />
                  )}
                </div>
                <div className="lastSaved mt-5"
                  aria-live="polite"
                  role="status">
                  {getLastSavedText()}
                </div>
                {!isReadOnly && (
                  <div className={styles.modalAction}>
                    {!(questionType === RESEARCH_OUTPUT_QUESTION_TYPE && isResearchOutputEditing) && (
                      <>
                        <div>
                          <Button
                            type="submit"
                            data-secondary
                            className="primary"
                            aria-label={PlanOverview('labels.saveAnswer')}
                            aria-disabled={isSubmitting}
                          >
                            {isSubmitting ? Global('buttons.saving') : Global('buttons.save')}
                          </Button>
                        </div>
                        <div>
                          <Button
                            className="secondary"
                            aria-label={PlanOverview('labels.returnToSection')}
                            onPress={() => handleBackToSection()}
                          >
                            {PlanOverview('buttons.backToSection')}
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </Card>
            </Form>
          </div>
        </ContentContainer >

        <SidebarPanel isOpen={isSideBarPanelOpen}>
          <div className="status-panel-content side-panel">
            <h2 className="h4">{Guidance('title')}</h2>
            <GuidancePanel
              userAffiliationId={me?.me?.affiliation?.uri}
              ownerAffiliationId={question?.ownerAffiliation?.uri}
              versionedTemplateId={versionedTemplateId!}
              guidanceItems={guidanceItems}
              sectionTags={sectionTagsMap}
              guidanceError={guidanceError}
              onClearError={clearError}
              onAddOrganization={addGuidanceOrganization}
              onRemoveOrganization={removeGuidanceOrganization}
            />
          </div>
        </SidebarPanel>

        {/** Sample text drawer. Only include for question types = Text Area */}
        {
          questionType === TEXT_AREA_QUESTION_TYPE && (
            <DrawerPanel
              isOpen={isSampleTextDrawerOpen}
              onClose={closeCurrentDrawer}
              returnFocusRef={openSampleTextButtonRef}
              className={styles.drawerPanelWrapper}
            >
              <h3>{question?.questionText}</h3>
              {question?.sampleText && (
                <div>
                  <h4 className={`${styles.deEmphasize} h5`}>{PlanOverview('page.organizationSampleText', { org: plan?.orgName ?? '' })}</h4>
                  <div className={styles.sampleText}>
                    <SafeHtml html={question?.sampleText} />
                  </div>
                  <div className="">
                    <Button className="small" onPress={() => handleUseAnswer(question?.sampleText)}>{PlanOverview('buttons.useAnswer')}</Button>
                  </div>
                </div>
              )}
              {question?.customizationSampleText && (
                <>
                  <h4 className={`${styles.deEmphasize} h5`}>{PlanOverview('page.organizationSampleText', { org: question?.customizationOwnerAffiliation?.name ?? '' })}</h4>
                  <div className={styles.sampleText}>
                    <SafeHtml html={question?.customizationSampleText} />
                  </div>
                  <div className="">
                    <Button className="small" onPress={() => handleUseAnswer(question?.customizationSampleText)}>{PlanOverview('buttons.useAnswer')}</Button>
                  </div>
                </>
              )}
            </DrawerPanel>
          )
        }


        {/**Comments drawer */}
        <CommentsDrawer
          isCommentsDrawerOpen={isCommentsDrawerOpen}
          closeCurrentDrawer={closeCurrentDrawer}
          openCommentsButtonRef={openCommentsButtonRef}
          mergedComments={mergedComments}
          editingCommentId={editingCommentId}
          editingCommentText={editingCommentText}
          setEditingCommentText={setEditingCommentText}
          handleUpdateComment={updateCommentHandler}
          handleAddComment={addCommentHandler}
          handleCancelEdit={handleCancelEdit}
          handleEditComment={handleEditComment}
          handleDeleteComment={handleDeleteComment}
          me={me}
          planOwners={plan?.planOwners}
          locale={locale}
          commentsEndRef={commentsEndRef}
          canAddComments={canAddComments}
        />


      </LayoutWithPanel >
    </>
  );
}

export default PlanOverviewQuestionPageShared;