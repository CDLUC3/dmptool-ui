import React from 'react';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useParams, useRouter } from 'next/navigation';
import { axe, toHaveNoViolations } from 'jest-axe';
import { useQuery, useMutation } from '@apollo/client/react';
import {
  AnswerByVersionedQuestionIdDocument,
  PublishedQuestionDocument,
  PlanDocument,
  MeDocument,
  GuidanceGroupsDocument,
  GuidanceSourcesForPlanDocument,
  AddPlanGuidanceDocument,
  RemovePlanGuidanceDocument,
  UserRole
} from '@/generated/graphql';
import {
  addAnswerAction,
  updateAnswerAction
} from '@/app/actions';
import mockAnswerData from '../__mocks__/mockAnswerData.json';
import mockPlanData from '../__mocks__/mockPlanData.json';
import mockPublishedQuestion from '../__mocks__/mockPublishedQuestion.json';
import mockGuidanceGroupsData from '../__mocks__/mocksGuidanceGroupData.json';
import mockMeData from '../__mocks__/mockMeQuery.json';
// Mocked question data
import mockCheckboxQuestion from '../__mocks__/mockCheckboxQuestion.json';
import mockQuestionDataForBoolean from '@/__mocks__/common/mockPublishedQuestionDataForBoolean.json';
import mockQuestionDataForCurrency from '@/__mocks__/common/mockPublishedQuestionDataForCurrency.json';
import mockQuestionDataForDate from '@/__mocks__/common/mockPublishedQuestionDataForDate.json';
import mockQuestionDataForDateRange from '@/__mocks__/common/mockPublishedQuestionDataForDateRange.json';
import mockQuestionDataForEmail from '@/__mocks__/common/mockPublishedQuestionDataForEmail.json';
import mockQuestionDataForMultiSelect from '@/__mocks__/common/mockPublishedQuestionDataForMultiSelect.json';
import mockQuestionDataForNumber from '@/__mocks__/common/mockPublishedQuestionDataForNumber.json';
import mockQuestionDataForNumberRange from '@/__mocks__/common/mockPublishedQuestionDataForNumberRange.json';
import mockQuestionDataForRadioButton from '@/__mocks__/common/mockPublishedQuestionDataForRadioButton.json';
import mockQuestionDataForSelectBox from '@/__mocks__/common/mockPublishedQuestionDataForSelectBox.json';
import mockQuestionDataForTextArea from '@/__mocks__/common/mockPublishedQuestionDataForTextArea.json';
import mockQuestionDataForTextField from '@/__mocks__/common/mockPublishedQuestionDataForTextField.json';
import mockQuestionDataForTypeAheadSearch from '@/__mocks__/common/mockPublishedQuestionDataForAffiliationSearch.json';
import mockQuestionDataForURL from '@/__mocks__/common/mockPublishedQuestionDataForURL.json';
import mockOtherQuestion from '../__mocks__/mockOtherQuestionData.json';
import mockQuestionDataForResearchOutput from '../__mocks__/mockROPublishedQuestion.json';

// Mocked answer data
import mockAnswerDataForTextField from '@/__mocks__/common/mockAnswerDataForTextField.json';
import mockAnswerDataForDate from '@/__mocks__/common/mockAnswerDataForDate.json';
import mockAnswerDataForDateRange from '@/__mocks__/common/mockAnswerDataForDateRange.json';
import mockAnswerDataForTypeAheadSearch from '@/__mocks__/common/mockAnswerDataForTypeAheadSearch.json';
import mockAnswerDataForBoolean from '@/__mocks__/common/mockAnswerDataForBoolean.json';
import mockAnswerDataForURL from '@/__mocks__/common/mockAnswerDataForURL.json';
import mockAnswerDataForEmail from '@/__mocks__/common/mockAnswerDataForEmail.json';
import mockAnswerDataForCurrency from '@/__mocks__/common/mockAnswerDataForCurrency.json';
import mockAnswerDataForNumberRange from '@/__mocks__/common/mockAnswerDataForNumberRange.json';
import mockAnswerDataForNumber from '@/__mocks__/common/mockAnswerDataForNumber.json';
import mockAnswerDataForMultiSelect from '@/__mocks__/common/mockAnswerDataForMultiSelect.json';
import mockAnswerDataForSelectBox from '@/__mocks__/common/mockAnswerDataForSelectBox.json';
import mockAnswerDataForRadioButton from '@/__mocks__/common/mockAnswerDataForRadioButton.json';
import mockAnswerDataForTextArea from '@/__mocks__/common/mockAnswerDataForTextArea.json';
import mockCheckboxAnswer from '../__mocks__/mockCheckboxAnswer.json';
import mockOtherAnswerData from '../__mocks__/mockOtherAnswerData.json'
import mockAnswerDataForResearchOutput from '../__mocks__/mockROAnswer.json';
import mockGuidanceSourcesForPlanMock from '../__mocks__/guidanceSourcesForPlanMock';

import { mockScrollIntoView } from "@/__mocks__/common";
import { PlanOverviewQuestionPageShared, QuestionPageConfig } from '@/components/PlanOverviewQuestionPageShared';
import { AffiliationSearchQuestionType } from "@dmptool/types";

// Mock for useComments hook
import { mockUseComments, defaultMockReturn } from '@/app/hooks/__mocks__/useComments';
import { TypeAheadInputProps } from '@/components/Form/TypeAheadWithOther/TypeAheadWithOther';
import mocksAffiliations from '@/__mocks__/common/mockAffiliations.json';

jest.mock('@/components/Form/TypeAheadWithOther', () => ({
  __esModule: true,
  useAffiliationSearch: jest.fn(() => ({
    suggestions: mocksAffiliations,
    handleSearch: jest.fn(),
  })),
  TypeAheadWithOther: ({ label, placeholder, fieldName, updateFormData, value }: TypeAheadInputProps) => {
    const [inputValue, setInputValue] = React.useState(value || '');

    return (
      <div>
        <label>
          {label}
          <input
            aria-label={label}
            placeholder={placeholder}
            name={fieldName}
            role="textbox"
            value={inputValue}
            data-id="https://ror.org/0168r3w48" // Mock the expected ID
            onChange={(e) => {
              const newValue = e.target.value;
              setInputValue(newValue);
              const dataId = (e.target as HTMLElement).dataset.id || '';
              updateFormData?.(dataId, newValue);
            }}
          />
        </label>
        <ul role="listbox">
          <li>Search Term</li>
        </ul>
      </div>
    );
  },
}));

jest.mock('@/app/hooks/useComments', () => {
  const { mockUseComments } = jest.requireActual('@/app/hooks/__mocks__/useComments');
  return {
    useComments: mockUseComments,
  };
});

// Mock GuidancePanel component
jest.mock('@/components/GuidancePanel', () => ({
  __esModule: true,
  /* eslint-disable @typescript-eslint/no-explicit-any */
  default: ({ guidanceItems, sectionTags }: any) => (
    <div data-testid="mock-guidance-panel">
      <div data-testid="guidance-items-count">{guidanceItems.length}</div>
      <div data-testid="section-tags-count">{Object.keys(sectionTags).length}</div>
    </div>
  ),
}));

// Mock the ResearchOutputAnswerComponent
jest.mock('@/components/Form/ResearchOutputAnswerComponent', () => ({
  __esModule: true,
  /* eslint-disable @typescript-eslint/no-explicit-any */
  default: ({ columns, rows, setRows, onSave, columnHeadings }: any) => (
    <div data-testid="research-output-table">
      <div data-testid="column-count">{columns.length}</div>
      <div data-testid="row-count">{rows.length}</div>
      <div data-testid="heading-count">{columnHeadings?.length || 0}</div>
      <button
        onClick={() => {
          // Simulate adding a row
          setRows([...rows, { columns: [] }]);
        }}
      >
        Add Output
      </button>
      <button onClick={() => onSave?.('save')}>Save Output</button>
    </div>
  ),
}));

beforeEach(() => {
  const affiliationQuery = `
  query Affiliations($name: String!) {
    affiliations(name: $name) {
      totalCount
      nextCursor
      items {
        id
        displayName
        uri
      }
    }
  }
`;

  const json: AffiliationSearchQuestionType = {
    type: 'affiliationSearch',
    attributes: {
      label: 'Institution',
      help: 'Search for your institution',
    },
    graphQL: {
      displayFields: [{
        label: "Institution",
        propertyName: "displayName",
      }],
      query: affiliationQuery,
      responseField: 'affiliations.items',
      variables: [{
        label: "Search for your institution",
        minLength: 3,
        name: "name",
        type: "string",
      }],
      answerField: 'uri'
    },
    meta: {
      schemaVersion: '1.0'
    },
  };
  mockQuestionDataForTypeAheadSearch.publishedQuestion.json = JSON.stringify(json);

  // Mock the useComments hook
  mockUseComments.mockReturnValue(defaultMockReturn);
});

expect.extend(toHaveNoViolations);

// Mock Apollo Client hooks
jest.mock('@apollo/client/react', () => ({
  useQuery: jest.fn(),
  useMutation: jest.fn(),
}));


// Mock actions
jest.mock('@/app/actions/index', () => ({
  addAnswerAction: jest.fn(),
  updateAnswerAction: jest.fn(),
}));

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useParams: jest.fn()
}));

jest.mock('next-intl', () => ({
  useTranslations: jest.fn(() => jest.fn((key) => key)), // Mock `useTranslations`,
}));

// Mock the PageHeader component
jest.mock('@/components/PageHeader', () => ({
  __esModule: true,
  default: () => <div data-testid="mock-page-header" />,
}));

const mockUseRouter = useRouter as jest.Mock;
const mockUseParams = useParams as jest.Mock;

// Cast with jest.mocked utility
const mockUseQuery = jest.mocked(useQuery);
const mockUseMutation = jest.mocked(useMutation);
const mockRefetch = jest.fn();

let mockAddPlanGuidanceFn: jest.Mock;
let mockRemovePlanGuidanceFn: jest.Mock;

const setupMocks = () => {
  // Create stable references OUTSIDE mockImplementation
  const stableAnswerByVersionedQuestionIdReturn = {
    data: mockAnswerData,
    loading: false,
    refetch: mockRefetch
  };

  const stablePublishedQuestionReturn = {
    data: mockPublishedQuestion,
    loading: false,
    error: undefined,
    refetch: mockRefetch
  };

  const stablePlanReturn = {
    data: mockPlanData,
    loading: false,
    refetch: mockRefetch
  };

  const stableMeReturn = {
    data: mockMeData,
    loading: false,
    error: undefined,
    refetch: mockRefetch
  };

  const stableGuidanceReturn = {
    data: mockGuidanceGroupsData,
    loading: false,
    error: undefined,
    refetch: mockRefetch
  };

  const stableGuidanceSourcesForPlanReturn = {
    data: mockGuidanceSourcesForPlanMock,
    loading: false,
    error: undefined
  };

  mockUseQuery.mockImplementation((document) => {
    if (document === AnswerByVersionedQuestionIdDocument) {
      return stableAnswerByVersionedQuestionIdReturn as any;
    }

    if (document === PublishedQuestionDocument) {
      return stablePublishedQuestionReturn as any;
    }

    if (document === PlanDocument) {
      return stablePlanReturn as any;
    }

    if (document === MeDocument) {
      return stableMeReturn as any;
    }

    if (document === GuidanceGroupsDocument) {
      return stableGuidanceReturn as any;
    }

    if (document === GuidanceSourcesForPlanDocument) {
      return stableGuidanceSourcesForPlanReturn as any;
    }

    return {
      data: null,
      loading: false,
      error: undefined
    };
  });

  mockAddPlanGuidanceFn = jest.fn().mockResolvedValue({
    data: { key: 'value' }
  });

  mockRemovePlanGuidanceFn = jest.fn().mockResolvedValue({
    data: { key: 'value' }
  });

  mockUseMutation.mockImplementation((document) => {
    if (document === AddPlanGuidanceDocument) {
      return [mockAddPlanGuidanceFn, { loading: false, error: undefined }] as any;
    }

    if (document === RemovePlanGuidanceDocument) {
      return [mockRemovePlanGuidanceFn, { loading: false, error: undefined }] as any;
    }

    return [jest.fn(), { loading: false, error: undefined }] as any;
  });
};

const config: QuestionPageConfig = {
  questionIdParamKey: 'qid',
  sectionIdParamKey: 'sid',
  sectionIdField: 'versionedSectionId',
  questionDocument: PublishedQuestionDocument,
  questionVariableKey: 'versionedQuestionId',
  extractQuestion: (data) => (data as any)?.publishedQuestion,
  sectionType: 'BASE',
  buildGuidanceMutationParams: ({ planId, versionedSectionId, versionedQuestionId }) => ({
    planId, versionedSectionId, versionedQuestionId,
  }),
  buildRouteParams: ({ projectId, dmpId, versionedSectionId, versionedQuestionId }) => ({
    projectId, dmpId, versionedSectionId, qid: versionedQuestionId,
  }),
  buildBackRoute: ({ projectId, dmpId, versionedSectionId }) => ({
    route: 'projects.dmp.versionedSection',
    params: { projectId, dmpId, versionedSectionId },
  }),
  buildAnswerQueryVariables: ({ projectId, planId, questionId }) => ({
    projectId,
    planId,
    versionedQuestionId: questionId,
  }),
  buildAddAnswerParams: ({ planId, sectionId, questionId }) => ({
    planId,
    versionedSectionId: sectionId,
    versionedQuestionId: questionId,
  }),
};


describe('PlanOverviewQuestionPage render of questions', () => {
  beforeEach(() => {
    setupMocks();
    HTMLElement.prototype.scrollIntoView = mockScrollIntoView;

    // Mock window.tinymce
    window.tinymce = {
      init: jest.fn(),
      remove: jest.fn(),
    };

    // Mock the return value of useParams
    mockUseParams.mockReturnValue({ projectId: 1, dmpid: 1, sid: 22, qid: 344 });
    mockUseRouter.mockReturnValue({
      push: jest.fn(),
    });

    mockUseComments.mockReturnValue(defaultMockReturn);
  })

  it('should load correct question content for textArea question', async () => {

    const stablePublishQuestion = {
      data: mockQuestionDataForTextArea,
      loading: false,
      error: undefined,
      refetch: mockRefetch
    };

    const stableAnswerByVersionedQuestionId = {
      data: mockAnswerDataForTextArea,
      loading: false,
      error: undefined,
      refetch: jest.fn()
    };

    const stableGuidanceReturn = {
      data: mockGuidanceGroupsData,
      loading: false,
      error: undefined,
      refetch: mockRefetch
    };

    mockUseQuery.mockImplementation((document) => {
      if (document === PublishedQuestionDocument) {
        return stablePublishQuestion as any;
      }

      if (document === AnswerByVersionedQuestionIdDocument) {
        return stableAnswerByVersionedQuestionId as any;
      }

      if (document === GuidanceGroupsDocument) {
        return stableGuidanceReturn as any;
      }
      return {
        data: null,
        loading: false,
        error: undefined
      } as any;
    });

    await act(async () => {
      render(
        <PlanOverviewQuestionPageShared config={config} />
      );

    });


    //Check for Requirements content
    expect(screen.getByRole('heading', { level: 3, name: 'page.requirementsBy' })).toBeInTheDocument();
    const boldedRequirements = screen.getByText('Requirements - Lorem Ipsum');
    expect(boldedRequirements).toBeInTheDocument();
    expect(boldedRequirements.tagName).toBe('STRONG');
    expect(screen.getByText((content) => content.includes('is simply dummy requirements text'))).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: 'Requirements by University of California' })).toBeInTheDocument();
    const orgRequirements = screen.getByText(/cleared by the ethics committee/i);
    expect(orgRequirements.tagName).toBe('P');
    // check that the 'Jump to guidance' link is present
    expect(screen.getByRole('link', { name: /page.jumpToGuidance/i })).toBeInTheDocument();

    // Check that question card is in the page with correct question details
    expect(screen.getByTestId('question-card')).toBeInTheDocument();
    // Should strip out HTML tags for the Question Text
    expect(screen.getByRole('heading', { level: 2, name: 'Text area question' })).toBeInTheDocument();
    const requirementsByFunder = screen.getByText('page.requirementsBy');
    expect(requirementsByFunder).toBeInTheDocument();
    expect(screen.getByText((content) => content.includes('is simply dummy requirements'))).toBeInTheDocument();
    expect(requirementsByFunder.tagName).toBe('H3');
    // check for info icon button
    expect(screen.getByRole('button', { name: 'Required by funder' })).toBeInTheDocument();
    // check for drawer panel trigger buttons
    expect(screen.getByRole('button', { name: 'page.viewSampleAnswer' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'buttons.commentWithNumber' })).toBeInTheDocument();
    // Check that the textArea question field is in page
    expect(screen.getByLabelText('question-text-editor')).toBeInTheDocument();

    // Check that mock guidance loaded
    const guidancePanel = screen.getByTestId('mock-guidance-panel');
    expect(guidancePanel).toBeInTheDocument();
  })

  it('should display disabled comment button when an answer does not exist for the question', async () => {

    mockUseQuery.mockImplementation((document) => {
      if (document === PublishedQuestionDocument) {
        return {
          data: mockQuestionDataForTextArea,
          loading: false,
          error: undefined,
          refetch: jest.fn()
        } as any;
      }

      if (document === AnswerByVersionedQuestionIdDocument) {
        return {
          data: null,
          loading: false,
          error: undefined,
          refetch: jest.fn()
        } as any;
      }
      return {
        data: null,
        loading: false,
        error: undefined
      } as any;
    });

    await act(async () => {
      render(
        <PlanOverviewQuestionPageShared config={config} />
      );

    });

    // check for comment button
    const commentButton = screen.getByRole('button', { name: 'buttons.commentWithNumber' });
    expect(commentButton).toBeInTheDocument();
    expect(commentButton).toHaveClass('buttonSmallDisabled');
  })

  it('should load sampleText in textArea if useSampleTextAsDefault is true and sampleText exists in question', async () => {
    mockUseQuery.mockImplementation((document) => {
      if (document === PublishedQuestionDocument) {
        return {
          data: mockQuestionDataForTextArea,
          loading: false,
          error: undefined,
          refetch: jest.fn()
        } as any;
      }

      if (document === AnswerByVersionedQuestionIdDocument) {
        return {
          data: mockAnswerDataForTextArea,
          loading: false,
          error: undefined,
          refetch: jest.fn()
        } as any;
      }
      return {
        data: null,
        loading: false,
        error: undefined
      } as any;
    });

    await act(async () => {
      render(
        <PlanOverviewQuestionPageShared config={config} />
      );

    });

    // Check that the textArea question field is in page
    const textAreaQuestion = screen.getByLabelText('question-text-editor');
    expect(textAreaQuestion).toBeInTheDocument();
    expect(screen.getByText((content) => content.includes('Sample text'))).toBeInTheDocument();
  })

  it('should NOT load sampleText in textArea even if useSampleTextAsDefault is true if there is an answerId', async () => {
    // Create answer data with an answerId but empty content to verify sample text is not used
    const mockAnswerDataWithEmptyContent = {
      answerByVersionedQuestionId: {
        id: 4,
        planId: 1,
        versionedQuestionId: 344,
        json: JSON.stringify({
          type: 'textArea',
          answer: '', // Empty answer to test that sample text is NOT used
          meta: { schemaVersion: '1.0' }
        }),
        comments: [],
        feedbackComments: []
      }
    };

    mockUseQuery.mockImplementation((document) => {
      if (document === PublishedQuestionDocument) {
        return {
          data: mockQuestionDataForTextArea,
          loading: false,
          error: undefined,
          refetch: jest.fn()
        } as any;
      }

      if (document === AnswerByVersionedQuestionIdDocument) {
        return {
          data: mockAnswerDataWithEmptyContent,
          loading: false,
          error: undefined,
          refetch: jest.fn()
        } as any;
      }
      return {
        data: null,
        loading: false,
        error: undefined
      } as any;
    });

    await act(async () => {
      render(
        <PlanOverviewQuestionPageShared config={config} />
      );

    });

    // Check that the textArea question field is in page
    const textAreaQuestion = screen.getByLabelText('question-text-editor');
    expect(textAreaQuestion).toBeInTheDocument();

    // Verify that sample text does NOT appear in the document even though:
    // 1. useSampleTextAsDefault is true
    // 2. The answer content is empty
    // 3. An answerId exists (which should prevent sample text from loading)
    expect(screen.queryByText((content) => content.includes('This is my sample text'))).not.toBeInTheDocument();
  })

  it('should load correct question content for checkbox question', async () => {
    mockUseQuery.mockImplementation((document) => {
      if (document === PublishedQuestionDocument) {
        return {
          data: mockCheckboxQuestion,
          loading: false,
          error: undefined,
          refetch: jest.fn()
        } as any;
      }

      if (document === AnswerByVersionedQuestionIdDocument) {
        return {
          data: mockCheckboxAnswer,
          loading: false,
          error: undefined,
          refetch: jest.fn()
        } as any;
      }
      return {
        data: null,
        loading: false,
        error: undefined
      } as any;
    });
    await act(async () => {
      render(
        <PlanOverviewQuestionPageShared config={config} />
      );

    });

    // Check that question card is in the page with correct question details
    expect(screen.getByTestId('question-card')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Checkbox question' })).toBeInTheDocument();
    // View sample text button should not display when the question is not a textArea question type
    expect(screen.queryByRole('button', { name: 'page.viewSampleAnswer' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'buttons.commentWithNumber' })).toBeInTheDocument();

    const checkboxGroup = screen.getByTestId('checkbox-group');
    const checkboxes = within(checkboxGroup).getAllByRole('checkbox');

    const getCheckboxByValue = (value: string) =>
      checkboxes.find((checkbox) => (checkbox as HTMLInputElement).value === value);

    expect((getCheckboxByValue('Alex') as HTMLInputElement).checked).toBe(true);
    expect((getCheckboxByValue('Barbara') as HTMLInputElement).checked).toBe(true);
    expect((getCheckboxByValue('Charlie') as HTMLInputElement).checked).toBe(true);
  })

  it('should load correct question content for radioButton question', async () => {

    mockUseQuery.mockImplementation((document) => {
      if (document === PublishedQuestionDocument) {
        return {
          data: mockQuestionDataForRadioButton,
          loading: false,
          error: undefined,
          refetch: jest.fn()
        } as any;
      }

      if (document === AnswerByVersionedQuestionIdDocument) {
        return {
          data: mockAnswerDataForRadioButton,
          loading: false,
          error: undefined,
          refetch: jest.fn()
        } as any;
      }
      return {
        data: null,
        loading: false,
        error: undefined
      } as any;
    });

    await act(async () => {
      render(
        <PlanOverviewQuestionPageShared config={config} />
      );

    });

    // Check that question card is in the page with correct question details
    expect(screen.getByTestId('question-card')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Radio button question' })).toBeInTheDocument();
    // View sample text button should not display when the question is not a textArea question type
    expect(screen.queryByRole('button', { name: 'page.viewSampleAnswer' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'buttons.commentWithNumber' })).toBeInTheDocument();

    //Radio group
    const radioGroup = screen.getByRole('radiogroup');
    expect(radioGroup).toBeInTheDocument();
    const yesRadio = within(radioGroup).getByRole('radio', { name: /yes/i });
    expect(yesRadio).toBeInTheDocument();
    const noRadio = within(radioGroup).getByRole('radio', { name: /no/i });
    expect(noRadio).toBeInTheDocument();
    const maybeRadio = within(radioGroup).getByRole('radio', { name: /maybe/i });
    expect(maybeRadio).toBeInTheDocument();
    // Check that the correct radio button is selected
    const yesLabel = screen.getByText('Yes').closest('label');
    expect(yesLabel).toBeInTheDocument();
    expect(yesLabel).toHaveAttribute('data-selected', 'true');
  })

  it('should load correct question content for text field question', async () => {
    mockUseQuery.mockImplementation((document) => {
      if (document === PublishedQuestionDocument) {
        return {
          data: mockQuestionDataForTextField,
          loading: false,
          error: undefined,
          refetch: jest.fn()
        } as any;
      }

      if (document === AnswerByVersionedQuestionIdDocument) {
        return {
          data: mockAnswerDataForTextField,
          loading: false,
          error: undefined,
          refetch: jest.fn()
        } as any;
      }
      return {
        data: null,
        loading: false,
        error: undefined
      } as any;
    });

    await act(async () => {
      render(
        <PlanOverviewQuestionPageShared config={config} />
      );

    });

    expect(screen.getByRole('heading', { level: 2, name: "Testing" })).toBeInTheDocument();
    // View sample text button should not display when the question is not a textArea question type
    expect(screen.queryByRole('button', { name: 'page.viewSampleAnswer' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'buttons.commentWithNumber' })).toBeInTheDocument();
    const textFieldWrapper = screen.getByTestId('field-wrapper');
    expect(textFieldWrapper).toBeInTheDocument();
    expect(within(textFieldWrapper).getByLabelText('text')).toBeInTheDocument();
    const input = within(textFieldWrapper).getByRole('textbox');
    expect(input).toBeInTheDocument();
  })

  it('should load correct question content for typeaheadSearch question', async () => {
    mockUseQuery.mockImplementation((document) => {
      if (document === PublishedQuestionDocument) {
        return {
          data: mockQuestionDataForTypeAheadSearch,
          loading: false,
          error: undefined,
          refetch: jest.fn()
        } as any;
      }

      if (document === AnswerByVersionedQuestionIdDocument) {
        return {
          data: mockAnswerDataForTypeAheadSearch,
          loading: false,
          error: undefined,
          refetch: jest.fn()
        } as any;
      }
      return {
        data: null,
        loading: false,
        error: undefined
      } as any;
    });

    await act(async () => {
      render(
        <PlanOverviewQuestionPageShared config={config} />
      );

    });
    expect(screen.getByRole('heading', { level: 2, name: 'Affiliation search question' }))
    // View sample text button should not display when the question is not a textArea question type
    expect(screen.queryByRole('button', { name: 'page.viewSampleAnswer' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'buttons.commentWithNumber' })).toBeInTheDocument();
    expect(screen.getByLabelText('Institution')).toBeInTheDocument();
    const input = screen.getByLabelText('Institution');
    expect(input).toHaveAttribute('data-id', 'https://ror.org/0168r3w48');

  })

  it('should load correct question content for date range question', async () => {
    mockUseQuery.mockImplementation((document) => {
      if (document === PublishedQuestionDocument) {
        return {
          data: mockQuestionDataForDateRange,
          loading: false,
          error: undefined,
          refetch: jest.fn()
        } as any;
      }

      if (document === AnswerByVersionedQuestionIdDocument) {
        return {
          data: mockAnswerDataForDateRange,
          loading: false,
          error: undefined,
          refetch: jest.fn()
        } as any;
      }
      return {
        data: null,
        loading: false,
        error: undefined
      } as any;
    });

    await act(async () => {
      render(
        <PlanOverviewQuestionPageShared config={config} />
      );
    });

    expect(screen.getByRole('heading', { level: 2, name: 'Date range question' })).toBeInTheDocument();
    // View sample text button should not display when the question is not a textArea question type
    expect(screen.queryByRole('button', { name: 'page.viewSampleAnswer' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'buttons.commentWithNumber' })).toBeInTheDocument();
    // Date range container
    const dateRangeContainer = screen.getByTestId('date-range-container');
    expect(dateRangeContainer).toBeInTheDocument();
    const datePicker = screen.queryAllByTestId('date-picker');
    const startDate = within(datePicker[0]);
    const endDate = within(datePicker[1]);
    expect(datePicker).toHaveLength(2);

    // Start Date
    expect(within(datePicker[0]).getByText('Beginning')).toBeInTheDocument();
    const startMonthSegment = startDate.getByRole('spinbutton', { name: /month/i })
    const startDaySegment = startDate.getByRole('spinbutton', { name: /day/i })
    const startYearSegment = startDate.getByRole('spinbutton', { name: /year/i })
    expect(startMonthSegment).toHaveTextContent('5');
    expect(startDaySegment).toHaveTextContent('5');
    expect(startYearSegment).toHaveTextContent('2025');

    // End Date
    expect(within(datePicker[1]).getByText('Ending')).toBeInTheDocument();
    const EndMonthSegment = endDate.getByRole('spinbutton', { name: /month/i })
    const EndDaySegment = endDate.getByRole('spinbutton', { name: /day/i })
    const EndYearSegment = endDate.getByRole('spinbutton', { name: /year/i })
    expect(EndMonthSegment).toHaveTextContent('7');
    expect(EndDaySegment).toHaveTextContent('5');
    expect(EndYearSegment).toHaveTextContent('2025');
  })

  it('should load correct question content for date question', async () => {
    mockUseQuery.mockImplementation((document) => {
      if (document === PublishedQuestionDocument) {
        return {
          data: mockQuestionDataForDate,
          loading: false,
          error: undefined,
          refetch: jest.fn()
        } as any;
      }

      if (document === AnswerByVersionedQuestionIdDocument) {
        return {
          data: mockAnswerDataForDate,
          loading: false,
          error: undefined,
          refetch: jest.fn()
        } as any;
      }
      return {
        data: null,
        loading: false,
        error: undefined
      } as any;
    });

    await act(async () => {
      render(
        <PlanOverviewQuestionPageShared config={config} />
      );
    });

    expect(screen.getByRole('heading', { level: 2, name: 'Date field question' })).toBeInTheDocument();
    // View sample text button should not display when the question is not a textArea question type
    expect(screen.queryByRole('button', { name: 'page.viewSampleAnswer' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'buttons.commentWithNumber' })).toBeInTheDocument();
    // Date picker container
    const datePicker = screen.getByTestId('date-picker');
    const date = within(datePicker);

    // Date
    expect(within(datePicker).getByText('Date')).toBeInTheDocument();
    const monthSegment = date.getByRole('spinbutton', { name: /month/i })
    const daySegment = date.getByRole('spinbutton', { name: /day/i })
    const yearSegment = date.getByRole('spinbutton', { name: /year/i })
    expect(monthSegment).toHaveTextContent('7');
    expect(daySegment).toHaveTextContent('1');
    expect(yearSegment).toHaveTextContent('2025');
  })

  it('should load correct question content for boolean question', async () => {
    mockUseQuery.mockImplementation((document) => {
      if (document === PublishedQuestionDocument) {
        return {
          data: mockQuestionDataForBoolean,
          loading: false,
          error: undefined,
          refetch: jest.fn()
        } as any;
      }

      if (document === AnswerByVersionedQuestionIdDocument) {
        return {
          data: mockAnswerDataForBoolean,
          loading: false,
          error: undefined,
          refetch: jest.fn()
        } as any;
      }
      return {
        data: null,
        loading: false,
        error: undefined
      } as any;
    });

    await act(async () => {
      render(
        <PlanOverviewQuestionPageShared config={config} />
      );
    });

    expect(screen.getByRole('heading', { level: 2, name: 'Yes/No question' })).toBeInTheDocument();
    // View sample text button should not display when the question is not a textArea question type
    expect(screen.queryByRole('button', { name: 'page.viewSampleAnswer' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'buttons.commentWithNumber' })).toBeInTheDocument();

    //Radio group
    const radioGroup = screen.getByRole('radiogroup');
    expect(radioGroup).toBeInTheDocument();
    const yesCheckbox = within(radioGroup).getByRole('radio', { name: /yes/i });
    expect(yesCheckbox).toBeInTheDocument();
    const noCheckbox = within(radioGroup).getByRole('radio', { name: /no/i });
    expect(noCheckbox).toBeInTheDocument();
  })

  it('should load correct question content for url question', async () => {
    mockUseQuery.mockImplementation((document) => {
      if (document === PublishedQuestionDocument) {
        return {
          data: mockQuestionDataForURL,
          loading: false,
          error: undefined,
          refetch: jest.fn()
        } as any;
      }

      if (document === AnswerByVersionedQuestionIdDocument) {
        return {
          data: mockAnswerDataForURL,
          loading: false,
          error: undefined,
          refetch: jest.fn()
        } as any;
      }
      return {
        data: null,
        loading: false,
        error: undefined
      } as any;
    });

    await act(async () => {
      render(
        <PlanOverviewQuestionPageShared config={config} />
      );
    });

    expect(screen.getByRole('heading', { level: 2, name: 'Url question' })).toBeInTheDocument();
    // View sample text button should not display when the question is not a textArea question type
    expect(screen.queryByRole('button', { name: 'page.viewSampleAnswer' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'buttons.commentWithNumber' })).toBeInTheDocument();

    const urlInput = screen.getByPlaceholderText('url');
    expect(urlInput).toBeInTheDocument();
    expect(urlInput).toHaveValue('https://cdlib.org');
  })

  it('should load correct question content for email question', async () => {
    mockUseQuery.mockImplementation((document) => {
      if (document === PublishedQuestionDocument) {
        return {
          data: mockQuestionDataForEmail,
          loading: false,
          error: undefined,
          refetch: jest.fn()
        } as any;
      }

      if (document === AnswerByVersionedQuestionIdDocument) {
        return {
          data: mockAnswerDataForEmail,
          loading: false,
          error: undefined,
          refetch: jest.fn()
        } as any;
      }
      return {
        data: null,
        loading: false,
        error: undefined
      } as any;
    });

    await act(async () => {
      render(
        <PlanOverviewQuestionPageShared config={config} />
      );
    });

    expect(screen.getByRole('heading', { level: 2, name: 'Email field question' })).toBeInTheDocument();
    // View sample text button should not display when the question is not a textArea question type
    expect(screen.queryByRole('button', { name: 'page.viewSampleAnswer' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'buttons.commentWithNumber' })).toBeInTheDocument();

    const emailInput = screen.getByPlaceholderText('email');
    expect(emailInput).toBeInTheDocument();
    expect(emailInput).toHaveValue('js@example.com');
  })

  it('should load correct question content for currency question', async () => {
    mockUseQuery.mockImplementation((document) => {
      if (document === PublishedQuestionDocument) {
        return {
          data: mockQuestionDataForCurrency,
          loading: false,
          error: undefined,
          refetch: jest.fn()
        } as any;
      }

      if (document === AnswerByVersionedQuestionIdDocument) {
        return {
          data: mockAnswerDataForCurrency,
          loading: false,
          error: undefined,
          refetch: jest.fn()
        } as any;
      }
      return {
        data: null,
        loading: false,
        error: undefined
      } as any;
    });

    await act(async () => {
      render(
        <PlanOverviewQuestionPageShared config={config} />
      );
    });

    expect(screen.getByRole('heading', { level: 2, name: 'Currency Field question' })).toBeInTheDocument();
    // View sample text button should not display when the question is not a textArea question type
    expect(screen.queryByRole('button', { name: 'page.viewSampleAnswer' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'buttons.commentWithNumber' })).toBeInTheDocument();

    // Should see increment and decrement buttons
    const decreaseButton = screen.getAllByLabelText('Decrease');
    const increaseButton = screen.getAllByLabelText('Increase');
    expect(decreaseButton.length).toBe(1);
    expect(increaseButton.length).toBe(1);
    const input = screen.getByRole('textbox');
    expect(input).toBeInTheDocument();
    expect(input).toHaveValue('$1.00');
  })

  it('should load correct question content for numberRange question', async () => {
    mockUseQuery.mockImplementation((document) => {
      if (document === PublishedQuestionDocument) {
        return {
          data: mockQuestionDataForNumberRange,
          loading: false,
          error: undefined,
          refetch: jest.fn()
        } as any;
      }

      if (document === AnswerByVersionedQuestionIdDocument) {
        return {
          data: mockAnswerDataForNumberRange,
          loading: false,
          error: undefined,
          refetch: jest.fn()
        } as any;
      }
      return {
        data: null,
        loading: false,
        error: undefined
      } as any;
    });

    await act(async () => {
      render(
        <PlanOverviewQuestionPageShared config={config} />
      );
    });

    expect(screen.getByRole('heading', { level: 2, name: 'Number Range question' })).toBeInTheDocument();
    // View sample text button should not display when the question is not a textArea question type
    expect(screen.queryByRole('button', { name: 'page.viewSampleAnswer' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'buttons.commentWithNumber' })).toBeInTheDocument();

    expect(screen.getByText('Starting')).toBeInTheDocument();
    expect(screen.getByText('Ending')).toBeInTheDocument();
    // Should see increment and decrement buttons
    const decreaseButton = screen.getAllByLabelText('Decrease');
    const increaseButton = screen.getAllByLabelText('Increase');
    expect(decreaseButton.length).toBe(2);
    expect(increaseButton.length).toBe(2);
    // Should see input fields with correct values
    const startInput = screen.getByPlaceholderText('start');
    const endInput = screen.getByPlaceholderText('end');
    expect(startInput).toHaveValue('1');
    expect(endInput).toHaveValue('10');
  })

  it('should load correct question content for number question', async () => {
    mockUseQuery.mockImplementation((document) => {
      if (document === PublishedQuestionDocument) {
        return {
          data: mockQuestionDataForNumber,
          loading: false,
          error: undefined,
          refetch: jest.fn()
        } as any;
      }

      if (document === AnswerByVersionedQuestionIdDocument) {
        return {
          data: mockAnswerDataForNumber,
          loading: false,
          error: undefined,
          refetch: jest.fn()
        } as any;
      }
      return {
        data: null,
        loading: false,
        error: undefined
      } as any;
    });

    await act(async () => {
      render(
        <PlanOverviewQuestionPageShared config={config} />
      );
    });

    expect(screen.getByRole('heading', { level: 2, name: 'Number Field question' })).toBeInTheDocument();
    // View sample text button should not display when the question is not a textArea question type
    expect(screen.queryByRole('button', { name: 'page.viewSampleAnswer' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'buttons.commentWithNumber' })).toBeInTheDocument();

    expect(screen.getByText('number')).toBeInTheDocument();
    // Should see increment and decrement buttons
    const decreaseButton = screen.getAllByLabelText('Decrease');
    const increaseButton = screen.getAllByLabelText('Increase');
    expect(decreaseButton.length).toBe(1);
    expect(increaseButton.length).toBe(1);
    // Should see input fields with correct values
    const input = screen.getByPlaceholderText('number');
    expect(input).toHaveValue('2');
  })

  it('should load correct question content for multiSelect question', async () => {
    mockUseQuery.mockImplementation((document) => {
      if (document === PublishedQuestionDocument) {
        return {
          data: mockQuestionDataForMultiSelect,
          loading: false,
          error: undefined,
          refetch: jest.fn()
        } as any;
      }

      if (document === AnswerByVersionedQuestionIdDocument) {
        return {
          data: mockAnswerDataForMultiSelect,
          loading: false,
          error: undefined,
          refetch: jest.fn()
        } as any;
      }
      return {
        data: null,
        loading: false,
        error: undefined
      } as any;
    });

    await act(async () => {
      render(
        <PlanOverviewQuestionPageShared config={config} />
      );
    });

    expect(screen.getByRole('heading', { level: 2, name: 'Multi select question' })).toBeInTheDocument();
    // View sample text button should not display when the question is not a textArea question type
    expect(screen.queryByRole('button', { name: 'page.viewSampleAnswer' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'buttons.commentWithNumber' })).toBeInTheDocument();

    expect(screen.getByText('Select Items (Multiple)')).toBeInTheDocument();
    expect(screen.getByText('Apple')).toBeInTheDocument();
    expect(screen.getByText('Banana')).toBeInTheDocument();
    expect(screen.getByText('Pear')).toBeInTheDocument();
    expect(screen.getByText('Orange')).toBeInTheDocument();

    // Get all options
    const options = screen.getAllByRole('option');

    // Check selected state by aria-selected
    expect(options[0]).toHaveAttribute('aria-selected', 'false');
    expect(options[1]).toHaveAttribute('aria-selected', 'true');
    expect(options[2]).toHaveAttribute('aria-selected', 'true');
    expect(options[3]).toHaveAttribute('aria-selected', 'true');
  })

  it('should load correct question content for selectBox question', async () => {
    mockUseQuery.mockImplementation((document) => {
      if (document === PublishedQuestionDocument) {
        return {
          data: mockQuestionDataForSelectBox,
          loading: false,
          error: undefined,
          refetch: jest.fn()
        } as any;
      }

      if (document === AnswerByVersionedQuestionIdDocument) {
        return {
          data: mockAnswerDataForSelectBox,
          loading: false,
          error: undefined,
          refetch: jest.fn()
        } as any;
      }
      return {
        data: null,
        loading: false,
        error: undefined
      } as any;
    });

    await act(async () => {
      render(
        <PlanOverviewQuestionPageShared config={config} />
      );
    });

    expect(screen.getByRole('heading', { level: 2, name: 'Select box question' })).toBeInTheDocument();
    // View sample text button should not display when the question is not a textArea question type
    expect(screen.queryByRole('button', { name: 'page.viewSampleAnswer' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'buttons.commentWithNumber' })).toBeInTheDocument();

    const selectButton = screen.getByTestId('select-button');
    expect(within(selectButton).getByText('Oregon')).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'California' })).not.toBeInTheDocument();
    act(() => {
      fireEvent.click(selectButton);
    })
    expect(screen.getByRole('option', { name: 'California' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Washington' })).toBeInTheDocument();
  })

  it('should redirect to section overview page when user clicks \'Back to section\' button', async () => {
    mockUseQuery.mockImplementation((document) => {
      if (document === PublishedQuestionDocument) {
        return {
          data: mockQuestionDataForTextArea,
          loading: false,
          error: undefined,
          refetch: jest.fn()
        } as any;
      }

      if (document === AnswerByVersionedQuestionIdDocument) {
        return {
          data: mockAnswerDataForTextArea,
          loading: false,
          error: undefined,
          refetch: jest.fn()
        } as any;
      }
      return {
        data: null,
        loading: false,
        error: undefined
      } as any;
    });

    await act(async () => {
      render(
        <PlanOverviewQuestionPageShared config={config} />
      );
    });

    const backToSectionBtn = screen.getByRole('button', { name: 'labels.returnToSection' });

    fireEvent.click(backToSectionBtn);

    expect(mockUseRouter().push).toHaveBeenCalledWith('/en-US/projects/1/dmp/1/s/22');
  })

});


describe('accessibility', () => {
  beforeEach(() => {
    setupMocks();
    HTMLElement.prototype.scrollIntoView = mockScrollIntoView;

    // Mock window.tinymce
    window.tinymce = {
      init: jest.fn(),
      remove: jest.fn(),
    };

    // Mock the return value of useParams
    mockUseParams.mockReturnValue({ projectId: 1, dmpid: 1, sid: 22, qid: 344 });
    mockUseRouter.mockReturnValue({
      push: jest.fn(),
    });
  })

  it('should pass accessibility tests', async () => {
    const { container } = render(<PlanOverviewQuestionPageShared config={config} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

});

describe('Call to updateAnswerAction', () => {
  beforeEach(() => {
    setupMocks();
    HTMLElement.prototype.scrollIntoView = mockScrollIntoView;

    // Mock window.tinymce
    window.tinymce = {
      init: jest.fn(),
      remove: jest.fn(),
    };

    // Mock the return value of useParams
    mockUseParams.mockReturnValue({ projectId: 1, dmpid: 1, sid: 22, qid: 344 });
    mockUseRouter.mockReturnValue({
      push: jest.fn(),
    });

    mockUseComments.mockReturnValue(defaultMockReturn);
  })

  it('should call updateAnswerAction when data changes for typeaheadSearch field', async () => {
    mockUseQuery.mockImplementation((document) => {
      if (document === PublishedQuestionDocument) {
        return {
          data: mockQuestionDataForTypeAheadSearch,
          loading: false,
          error: undefined,
          refetch: jest.fn()
        } as any;
      }

      if (document === AnswerByVersionedQuestionIdDocument) {
        return {
          data: mockAnswerDataForTypeAheadSearch,
          loading: false,
          error: undefined,
          refetch: jest.fn()
        } as any;
      }

      if (document === PlanDocument) {
        return {
          data: mockPlanData,
          loading: false,
          refetch: mockRefetch
        } as any;
      }

      return {
        data: null,
        loading: false,
        error: undefined
      } as any;
    });


    await act(async () => {
      render(
        <PlanOverviewQuestionPageShared config={config} />
      );
    });

    const searchLabelInput = screen.getByLabelText('Institution');
    fireEvent.change(searchLabelInput, { target: { value: 'UCOP' } });


    // Click "Save" button
    const saveBtn = screen.getByRole('button', { name: 'labels.saveAnswer' });

    fireEvent.click(saveBtn);
    await waitFor(() => {
      expect(updateAnswerAction).toHaveBeenCalledWith({
        answerId: 20,
        json: "{\"type\":\"affiliationSearch\",\"answer\":{\"affiliationId\":\"https://ror.org/0168r3w48\",\"affiliationName\":\"UCOP\"},\"meta\":{\"schemaVersion\":\"1.0\"},\"comment\":\"\"}",
      });
    });
  })

  it('should call updateAnswerAction with correct data for checkbox', async () => {
    mockUseQuery.mockImplementation((document) => {
      if (document === PublishedQuestionDocument) {
        return {
          data: mockCheckboxQuestion,
          loading: false,
          error: undefined,
          refetch: jest.fn()
        } as any;
      }

      if (document === AnswerByVersionedQuestionIdDocument) {
        return {
          data: mockCheckboxAnswer,
          loading: false,
          error: undefined,
          refetch: jest.fn()
        } as any;
      }

      if (document === PlanDocument) {
        return {
          data: mockPlanData,
          loading: false,
          refetch: mockRefetch
        } as any;
      }

      return {
        data: null,
        loading: false,
        error: undefined
      } as any;
    });

    (addAnswerAction as jest.Mock).mockResolvedValue({
      success: true,
      data: {
        errors: {
          general: null,
        },
        id: 27,
        json: "{\"type\":\"checkBoxes\",\"answer\":[\"Barbara\",\"Charlie\",\"Alex\"],\"meta\":{\"schemaVersion\":\"1.0\"},\"comment\":\"\"}",
        modified: "1751929006000",
        versionedQuestion: {
          versionedSectionId: 20
        }
      },
    });

    await act(async () => {
      render(
        <PlanOverviewQuestionPageShared config={config} />
      );
    });

    const checkboxGroup = screen.getByTestId('checkbox-group');
    expect(checkboxGroup).toBeInTheDocument();
    const checkboxes = within(checkboxGroup).getAllByRole('checkbox');
    const alexCheckbox = checkboxes.find(
      (checkbox) => (checkbox as HTMLInputElement).value === 'Alex'
    );

    await userEvent.click(alexCheckbox!);

    // Click "Save" button
    const saveBtn = screen.getByRole('button', { name: 'labels.saveAnswer' });

    fireEvent.click(saveBtn);
    await waitFor(() => {
      expect(updateAnswerAction).toHaveBeenCalledWith({
        answerId: 27,
        json: "{\"type\":\"checkBoxes\",\"answer\":[\"Barbara\",\"Charlie\"],\"meta\":{\"schemaVersion\":\"1.0\"},\"comment\":\"\"}"
      });
    });
  });

  it('should call updateAnswerAction with correct data for radioButton', async () => {
    mockUseQuery.mockImplementation((document) => {
      if (document === PublishedQuestionDocument) {
        return {
          data: mockQuestionDataForRadioButton,
          loading: false,
          error: undefined,
          refetch: jest.fn()
        } as any;
      }

      if (document === AnswerByVersionedQuestionIdDocument) {
        return {
          data: mockAnswerDataForRadioButton,
          loading: false,
          error: undefined,
          refetch: jest.fn()
        } as any;
      }
      if (document === PlanDocument) {
        return {
          data: mockPlanData,
          loading: false,
          refetch: mockRefetch
        } as any;
      }
      return {
        data: null,
        loading: false,
        error: undefined
      } as any;
    });

    await act(async () => {
      render(
        <PlanOverviewQuestionPageShared config={config} />
      );
    });

    const radioGroup = screen.getByRole('radiogroup');
    expect(radioGroup).toBeInTheDocument();
    const noRadio = within(radioGroup).getByRole('radio', { name: /no/i });

    await userEvent.click(noRadio!);

    // Click "Save" button
    const saveBtn = screen.getByRole('button', { name: 'labels.saveAnswer' });

    fireEvent.click(saveBtn);
    await waitFor(() => {
      expect(updateAnswerAction).toHaveBeenCalledWith({
        answerId: 5,
        json: "{\"type\":\"radioButtons\",\"answer\":\"No\",\"meta\":{\"schemaVersion\":\"1.0\"},\"comment\":\"\"}"
      });
    });
  });

  it('should call updateAnswerAction with correct data for text field', async () => {
    mockUseQuery.mockImplementation((document) => {
      if (document === PublishedQuestionDocument) {
        return {
          data: mockQuestionDataForTextField,
          loading: false,
          error: undefined,
          refetch: jest.fn()
        } as any;
      }

      if (document === AnswerByVersionedQuestionIdDocument) {
        return {
          data: mockAnswerDataForTextField,
          loading: false,
          error: undefined,
          refetch: jest.fn()
        } as any;
      }


      if (document === PlanDocument) {
        return {
          data: mockPlanData,
          loading: false,
          refetch: mockRefetch
        } as any;
      }

      return {
        data: null,
        loading: false,
        error: undefined
      } as any;
    });

    await act(async () => {
      render(
        <PlanOverviewQuestionPageShared config={config} />
      );
    });

    const textFieldWrapper = screen.getByTestId('field-wrapper');
    expect(textFieldWrapper).toBeInTheDocument();
    expect(within(textFieldWrapper).getByLabelText('text')).toBeInTheDocument();
    const input = within(textFieldWrapper).getByRole('textbox');

    // trigger change in textbox value
    await userEvent.clear(input);
    await userEvent.type(input, 'New input value');

    // Click "Save" button
    const saveBtn = screen.getByRole('button', { name: 'labels.saveAnswer' });

    fireEvent.click(saveBtn);
    await waitFor(() => {
      expect(updateAnswerAction).toHaveBeenCalledWith({
        answerId: 21,
        json: "{\"type\":\"text\",\"answer\":\"New input value\",\"meta\":{\"schemaVersion\":\"1.0\"}}"
      });
    });
  })

  it('should call updateAnswerAction with correct data for date range question', async () => {
    mockUseQuery.mockImplementation((document) => {
      if (document === PublishedQuestionDocument) {
        return {
          data: mockQuestionDataForDateRange,
          loading: false,
          error: undefined,
          refetch: jest.fn()
        } as any;
      }

      if (document === AnswerByVersionedQuestionIdDocument) {
        return {
          data: mockAnswerDataForDateRange,
          loading: false,
          error: undefined,
          refetch: jest.fn()
        } as any;
      }

      if (document === PlanDocument) {
        return {
          data: mockPlanData,
          loading: false,
          refetch: mockRefetch
        } as any;
      }

      return {
        data: null,
        loading: false,
        error: undefined
      } as any;
    });
    await act(async () => {
      render(
        <PlanOverviewQuestionPageShared config={config} />
      );
    });

    const buttons = screen.getAllByLabelText('Calendar');

    // Open the date picker
    await userEvent.click(buttons[0]);

    // Find the day button for the date you want to select (e.g., 15th)
    const dayButton = await screen.findByRole('button', { name: /15/ });
    await userEvent.click(dayButton);

    // Click "Save" button
    const saveBtn = screen.getByRole('button', { name: 'labels.saveAnswer' });

    fireEvent.click(saveBtn);
    await waitFor(() => {
      expect(updateAnswerAction).toHaveBeenCalledWith({
        answerId: 16,
        json: "{\"type\":\"dateRange\",\"answer\":{\"start\":\"2025-05-15\",\"end\":\"2025-07-05\"},\"meta\":{\"schemaVersion\":\"1.0\"},\"comment\":\"\"}"
      });
    });
  })

  it('should call updateAnswerAction with correct data for date question', async () => {
    mockUseQuery.mockImplementation((document) => {
      if (document === PublishedQuestionDocument) {
        return {
          data: mockQuestionDataForDate,
          loading: false,
          error: undefined,
          refetch: jest.fn()
        } as any;
      }

      if (document === AnswerByVersionedQuestionIdDocument) {
        return {
          data: mockAnswerDataForDate,
          loading: false,
          error: undefined,
          refetch: jest.fn()
        } as any;
      }


      if (document === PlanDocument) {
        return {
          data: mockPlanData,
          loading: false,
          refetch: mockRefetch
        } as any;
      }

      return {
        data: null,
        loading: false,
        error: undefined
      } as any;
    });

    await act(async () => {
      render(
        <PlanOverviewQuestionPageShared config={config} />
      );
    });

    const dateBtn = screen.getByLabelText('Calendar');

    // Open the date picker
    await userEvent.click(dateBtn);

    // Find the day button for the date you want to select (e.g., 15th)
    const dayButton = await screen.findByRole('button', { name: /15/ });
    await userEvent.click(dayButton);

    // Click "Save" button
    const saveBtn = screen.getByRole('button', { name: 'labels.saveAnswer' });

    fireEvent.click(saveBtn);
    await waitFor(() => {
      expect(updateAnswerAction).toHaveBeenCalledWith({
        answerId: 15,
        json: "{\"type\":\"date\",\"answer\":\"2025-07-15\",\"meta\":{\"schemaVersion\":\"1.0\"},\"comment\":\"\"}"
      });
    });
  })

  it('should call updateAnswerAction with correct data for boolean', async () => {
    mockUseQuery.mockImplementation((document) => {
      if (document === PublishedQuestionDocument) {
        return {
          data: mockQuestionDataForBoolean,
          loading: false,
          error: undefined,
          refetch: jest.fn()
        } as any;
      }

      if (document === AnswerByVersionedQuestionIdDocument) {
        return {
          data: mockAnswerDataForBoolean,
          loading: false,
          error: undefined,
          refetch: jest.fn()
        } as any;
      }

      if (document === PlanDocument) {
        return {
          data: mockPlanData,
          loading: false,
          refetch: mockRefetch
        } as any;
      }

      return {
        data: null,
        loading: false,
        error: undefined
      } as any;
    });

    await act(async () => {
      render(
        <PlanOverviewQuestionPageShared config={config} />
      );
    });

    //Radio group
    const radioGroup = screen.getByRole('radiogroup');
    expect(radioGroup).toBeInTheDocument();
    const yesCheckbox = within(radioGroup).getByRole('radio', { name: /yes/i });
    expect(yesCheckbox).toBeInTheDocument();
    const noCheckbox = within(radioGroup).getByRole('radio', { name: /no/i });
    expect(noCheckbox).toBeInTheDocument();

    await userEvent.click(noCheckbox!);

    // Click "Save" button
    const saveBtn = screen.getByRole('button', { name: 'labels.saveAnswer' });

    fireEvent.click(saveBtn);
    await waitFor(() => {
      expect(updateAnswerAction).toHaveBeenCalledWith({
        answerId: 14,
        json: "{\"type\":\"boolean\",\"answer\":false,\"meta\":{\"schemaVersion\":\"1.0\"}}"
      });
    });
  })

  it('should call updateAnswerAction with correct data for url question', async () => {
    mockUseQuery.mockImplementation((document) => {
      if (document === PublishedQuestionDocument) {
        return {
          data: mockQuestionDataForURL,
          loading: false,
          error: undefined,
          refetch: jest.fn()
        } as any;
      }

      if (document === AnswerByVersionedQuestionIdDocument) {
        return {
          data: mockAnswerDataForURL,
          loading: false,
          error: undefined,
          refetch: jest.fn()
        } as any;
      }

      if (document === PlanDocument) {
        return {
          data: mockPlanData,
          loading: false,
          refetch: mockRefetch
        } as any;
      }

      return {
        data: null,
        loading: false,
        error: undefined
      } as any;
    });

    await act(async () => {
      render(
        <PlanOverviewQuestionPageShared config={config} />
      );
    });

    const urlInput = screen.getByPlaceholderText('url');
    // trigger change in textbox value
    await userEvent.clear(urlInput);
    await userEvent.type(urlInput, 'https://ucop.edu');

    // Click "Save" button
    const saveBtn = screen.getByRole('button', { name: 'labels.saveAnswer' });

    fireEvent.click(saveBtn);
    await waitFor(() => {
      expect(updateAnswerAction).toHaveBeenCalledWith({
        answerId: 13,
        json: "{\"type\":\"url\",\"answer\":\"https://ucop.edu\",\"meta\":{\"schemaVersion\":\"1.0\"}}"
      });
    });
  })

  it('should call updateAnswerAction with correct data for email question', async () => {
    mockUseQuery.mockImplementation((document) => {
      if (document === PublishedQuestionDocument) {
        return {
          data: mockQuestionDataForEmail,
          loading: false,
          error: undefined,
          refetch: jest.fn()
        } as any;
      }

      if (document === AnswerByVersionedQuestionIdDocument) {
        return {
          data: mockAnswerDataForEmail,
          loading: false,
          error: undefined,
          refetch: jest.fn()
        } as any;
      }

      if (document === PlanDocument) {
        return {
          data: mockPlanData,
          loading: false,
          refetch: mockRefetch
        } as any;
      }

      return {
        data: null,
        loading: false,
        error: undefined
      } as any;
    });
    await act(async () => {
      render(
        <PlanOverviewQuestionPageShared config={config} />
      );
    });
    const emailInput = screen.getByPlaceholderText('email');
    // trigger change in textbox value
    await userEvent.clear(emailInput);
    await userEvent.type(emailInput, 'test@example.com');

    // Click "Save" button
    const saveBtn = screen.getByRole('button', { name: 'labels.saveAnswer' });

    fireEvent.click(saveBtn);
    await waitFor(() => {
      expect(updateAnswerAction).toHaveBeenCalledWith({
        answerId: 12,
        json: "{\"type\":\"email\",\"answer\":\"test@example.com\",\"meta\":{\"schemaVersion\":\"1.0\"}}"
      });
    });
  })

  it('should call updateAnswerAction with correct data for textArea question', async () => {
    mockUseQuery.mockImplementation((document) => {
      if (document === PublishedQuestionDocument) {
        return {
          data: mockQuestionDataForTextArea,
          loading: false,
          error: undefined,
          refetch: jest.fn()
        } as any;
      }

      if (document === AnswerByVersionedQuestionIdDocument) {
        return {
          data: mockAnswerDataForTextArea,
          loading: false,
          error: undefined,
          refetch: jest.fn()
        } as any;
      }

      if (document === PlanDocument) {
        return {
          data: mockPlanData,
          loading: false,
          refetch: mockRefetch
        } as any;
      }

      return {
        data: null,
        loading: false,
        error: undefined
      } as any;
    });

    // Store the change handler reference
    let changeHandler: (() => void) | null = null;

    // Create a mock editor instance
    const mockEditor = {
      setContent: jest.fn(),
      getContent: jest.fn().mockReturnValue('This is the text area content'),
      on: jest.fn((events: string, handler: () => void) => {
        if (events === 'Change KeyUp Input Blur') {
          changeHandler = handler;
        }
      }),
    };

    // Intercept the init call and simulate init_instance_callback
    window.tinymce.init = jest.fn((config) => {
      // Call setup to register event handlers
      if (config.setup) {
        config.setup(mockEditor);
      }

      // Call the init callback
      config.init_instance_callback(mockEditor);
    });

    await act(async () => {
      render(<PlanOverviewQuestionPageShared config={config} />);
    });

    // Wait for initialization
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
    });

    // Trigger the change handler if it exists
    await act(async () => {
      changeHandler?.(); // Optional chaining - safe way to call
    });

    // Click "Save" button
    const saveBtn = screen.getByRole('button', { name: 'labels.saveAnswer' });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(updateAnswerAction).toHaveBeenCalledWith({
        answerId: 4,
        json: "{\"type\":\"textArea\",\"answer\":\"This is the text area content\",\"meta\":{\"schemaVersion\":\"1.0\"}}"
      });
    });
  });

  it('should call updateAnswerAction with correct data for currency question', async () => {
    mockUseQuery.mockImplementation((document) => {
      if (document === PublishedQuestionDocument) {
        return {
          data: mockQuestionDataForCurrency,
          loading: false,
          error: undefined,
          refetch: jest.fn()
        } as any;
      }

      if (document === AnswerByVersionedQuestionIdDocument) {
        return {
          data: mockAnswerDataForCurrency,
          loading: false,
          error: undefined,
          refetch: jest.fn()
        } as any;
      }

      if (document === PlanDocument) {
        return {
          data: mockPlanData,
          loading: false,
          refetch: mockRefetch
        } as any;
      }

      return {
        data: null,
        loading: false,
        error: undefined
      } as any;
    });

    await act(async () => {
      render(
        <PlanOverviewQuestionPageShared config={config} />
      );
    });

    const numberGroup = screen.getByRole('group');
    const currencyInput = within(numberGroup).getByRole('textbox');

    await userEvent.clear(currencyInput);
    await userEvent.type(currencyInput, '15.00');
    await userEvent.tab(); // 👈 React Aria Component NumberField requires this to be able to register an input change

    // Click "Save" button
    const saveBtn = screen.getByRole('button', { name: 'labels.saveAnswer' });

    fireEvent.click(saveBtn);
    await waitFor(() => {
      expect(updateAnswerAction).toHaveBeenCalledWith({
        answerId: 11,
        json: "{\"type\":\"currency\",\"answer\":15,\"meta\":{\"schemaVersion\":\"1.0\"},\"comment\":\"\"}"
      });
    });
  })

  it('should call updateAnswerAction with correct data for numberRange question', async () => {
    mockUseQuery.mockImplementation((document) => {
      if (document === PublishedQuestionDocument) {
        return {
          data: mockQuestionDataForNumberRange,
          loading: false,
          error: undefined,
          refetch: jest.fn()
        } as any;
      }

      if (document === AnswerByVersionedQuestionIdDocument) {
        return {
          data: mockAnswerDataForNumberRange,
          loading: false,
          error: undefined,
          refetch: jest.fn()
        } as any;
      }

      if (document === PlanDocument) {
        return {
          data: mockPlanData,
          loading: false,
          refetch: mockRefetch
        } as any;
      }

      return {
        data: null,
        loading: false,
        error: undefined
      } as any;
    });

    await act(async () => {
      render(
        <PlanOverviewQuestionPageShared config={config} />
      );
    });

    const startInput = screen.getByPlaceholderText('start');

    await userEvent.clear(startInput);
    await userEvent.type(startInput, '2');
    await userEvent.tab(); // 👈 React Aria Component NumberField requires this to be able to register an input change

    // Click "Save" button
    const saveBtn = screen.getByRole('button', { name: 'labels.saveAnswer' });

    fireEvent.click(saveBtn);
    await waitFor(() => {
      expect(updateAnswerAction).toHaveBeenCalledWith({
        answerId: 10,
        json: "{\"type\":\"numberRange\",\"answer\":{\"start\":2,\"end\":10},\"meta\":{\"schemaVersion\":\"1.0\"},\"comment\":\"\"}"
      });
    });
  })

  it('should call updateAnswerAction with correct data for number question', async () => {
    mockUseQuery.mockImplementation((document) => {
      if (document === PublishedQuestionDocument) {
        return {
          data: mockQuestionDataForNumber,
          loading: false,
          error: undefined,
          refetch: jest.fn()
        } as any;
      }

      if (document === AnswerByVersionedQuestionIdDocument) {
        return {
          data: mockAnswerDataForNumber,
          loading: false,
          error: undefined,
          refetch: jest.fn()
        } as any;
      }

      if (document === PlanDocument) {
        return {
          data: mockPlanData,
          loading: false,
          refetch: mockRefetch
        } as any;
      }

      return {
        data: null,
        loading: false,
        error: undefined
      } as any;
    });

    await act(async () => {
      render(
        <PlanOverviewQuestionPageShared config={config} />
      );
    });
    const startInput = screen.getByPlaceholderText('number');

    await userEvent.clear(startInput);
    await userEvent.type(startInput, '3');
    await userEvent.tab(); // 👈 React Aria Component NumberField requires this to be able to register an input change

    // Click "Save" button
    const saveBtn = screen.getByRole('button', { name: 'labels.saveAnswer' });

    fireEvent.click(saveBtn);
    await waitFor(() => {
      expect(updateAnswerAction).toHaveBeenCalledWith({
        answerId: 9,
        json: "{\"type\":\"number\",\"answer\":3,\"meta\":{\"schemaVersion\":\"1.0\"},\"comment\":\"\"}"
      });
    });
  })

  it('should call updateAnswerAction with correct data for multiSelect question', async () => {
    mockUseQuery.mockImplementation((document) => {
      if (document === PublishedQuestionDocument) {
        return {
          data: mockQuestionDataForMultiSelect,
          loading: false,
          error: undefined,
          refetch: jest.fn()
        } as any;
      }

      if (document === AnswerByVersionedQuestionIdDocument) {
        return {
          data: mockAnswerDataForMultiSelect,
          loading: false,
          error: undefined,
          refetch: jest.fn()
        } as any;
      }

      if (document === PlanDocument) {
        return {
          data: mockPlanData,
          loading: false,
          refetch: mockRefetch
        } as any;
      }

      return {
        data: null,
        loading: false,
        error: undefined
      } as any;
    });
    await act(async () => {
      render(
        <PlanOverviewQuestionPageShared config={config} />
      );
    });

    // Get all options
    const options = screen.getAllByRole('option');

    fireEvent.click(options[0]);

    // Click "Save" button
    const saveBtn = screen.getByRole('button', { name: 'labels.saveAnswer' });

    fireEvent.click(saveBtn);
    await waitFor(() => {
      expect(updateAnswerAction).toHaveBeenCalledWith({
        answerId: 18,
        json: "{\"type\":\"multiselectBox\",\"answer\":[\"Banana\",\"Pear\",\"Orange\",\"Apple\"],\"meta\":{\"schemaVersion\":\"1.0\"},\"comment\":\"\"}"
      });
    });
  })

  it('should call updateAnswerAction with correct data for selectBox question', async () => {
    mockUseQuery.mockImplementation((document) => {
      if (document === PublishedQuestionDocument) {
        return {
          data: mockQuestionDataForSelectBox,
          loading: false,
          error: undefined,
          refetch: jest.fn()
        } as any;
      }

      if (document === AnswerByVersionedQuestionIdDocument) {
        return {
          data: mockAnswerDataForSelectBox,
          loading: false,
          error: undefined,
          refetch: jest.fn()
        } as any;
      }

      if (document === PlanDocument) {
        return {
          data: mockPlanData,
          loading: false,
          refetch: mockRefetch
        } as any;
      }

      return {
        data: null,
        loading: false,
        error: undefined
      } as any;
    });
    await act(async () => {
      render(
        <PlanOverviewQuestionPageShared config={config} />
      );
    });

    const selectButton = screen.getByTestId('select-button');
    act(() => {
      fireEvent.click(selectButton);
    })
    const caOption = screen.getByRole('option', { name: 'California' });

    fireEvent.click(caOption);

    // Click "Save" button
    const saveBtn = screen.getByRole('button', { name: 'labels.saveAnswer' });

    fireEvent.click(saveBtn);
    await waitFor(() => {
      expect(updateAnswerAction).toHaveBeenCalledWith({
        answerId: 30,
        json: "{\"type\":\"selectBox\",\"answer\":\"California\",\"meta\":{\"schemaVersion\":\"1.0\"},\"comment\":\"\"}"
      });
    });
  })

  it('should redirect if the response to calling updateAnswerAction returns a redirect', async () => {
    mockUseQuery.mockImplementation((document) => {
      if (document === PublishedQuestionDocument) {
        return {
          data: mockQuestionDataForTextArea,
          loading: false,
          error: undefined,
          refetch: jest.fn()
        } as any;
      }

      if (document === AnswerByVersionedQuestionIdDocument) {
        return {
          data: mockAnswerDataForTextArea,
          loading: false,
          error: undefined,
          refetch: jest.fn()
        } as any;
      }

      if (document === PlanDocument) {
        return {
          data: mockPlanData,
          loading: false,
          refetch: mockRefetch
        } as any;
      }

      return {
        data: null,
        loading: false,
        error: undefined
      } as any;
    });

    (updateAnswerAction as jest.Mock).mockResolvedValue({
      success: true,
      data: {
        errors: {
          general: null,
        },
        id: 27,
        json: "{\"type\":\"textArea\",\"answer\":\"This is a test\",\"meta\":{\"schemaVersion\":\"1.0\"},\"comment\":\"\"}",
        modified: "1751929006000",
        versionedQuestion: {
          versionedSectionId: 20
        }
      },
      redirect: '/project/1/dmp/1/s/22'
    });

    // Create a mock editor instance
    const mockEditor = {
      setContent: jest.fn(),
      getContent: jest.fn().mockReturnValue('This is the text area content'),
      on: jest.fn(),
    };

    // Intercept the init call and simulate init_instance_callback
    window.tinymce.init = jest.fn((config) => {
      config.init_instance_callback(mockEditor);

      // Manually trigger the `Change` event
      setTimeout(() => {
        const changeHandler = mockEditor.on.mock.calls.find(
          ([eventName]) => eventName === 'Change'
        )?.[1];
        if (changeHandler) changeHandler(); // simulate content change
      }, 0);
    });

    await act(async () => {
      render(<PlanOverviewQuestionPageShared config={config} />);
    });

    // Wait for the simulated TinyMCE 'Change' event to propagate
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
    });

    // Click "Save" button
    const saveBtn = screen.getByRole('button', { name: 'labels.saveAnswer' });

    await act(async () => {
      fireEvent.click(saveBtn);
    })

    expect(mockUseRouter().push).toHaveBeenNthCalledWith(2, '/en-US/projects/1/dmp/1/s/22');
  })

  it('should display errors if updateAnswerAction returns errors in the response', async () => {
    mockUseQuery.mockImplementation((document) => {
      if (document === PublishedQuestionDocument) {
        return {
          data: mockQuestionDataForTextArea,
          loading: false,
          error: undefined,
          refetch: jest.fn()
        } as any;
      }

      if (document === AnswerByVersionedQuestionIdDocument) {
        return {
          data: mockAnswerDataForTextArea,
          loading: false,
          error: undefined,
          refetch: jest.fn()
        } as any;
      }

      if (document === PlanDocument) {
        return {
          data: mockPlanData,
          loading: false,
          refetch: mockRefetch
        } as any;
      }

      return {
        data: null,
        loading: false,
        error: undefined
      } as any;
    });

    (updateAnswerAction as jest.Mock).mockResolvedValue({
      success: true,
      data: {
        errors: {
          general: 'The answer is not in the proper format.',
          versionedQuestionId: 'versionedQuestionId already exists'
        },
        id: 27,
        json: "{\"type\":\"textArea\",\"answer\":\"This is a test\",\"meta\":{\"schemaVersion\":\"1.0\"},\"comment\":\"\"}",
        modified: "1751929006000",
        versionedQuestion: {
          versionedSectionId: 20
        }
      },
    });

    // Create a mock editor instance
    const mockEditor = {
      setContent: jest.fn(),
      getContent: jest.fn().mockReturnValue('This is the text area content'),
      on: jest.fn(),
    };

    // Intercept the init call and simulate init_instance_callback
    window.tinymce.init = jest.fn((config) => {
      config.init_instance_callback(mockEditor);

      // Manually trigger the `Change` event
      setTimeout(() => {
        const changeHandler = mockEditor.on.mock.calls.find(
          ([eventName]) => eventName === 'Change'
        )?.[1];
        if (changeHandler) changeHandler(); // simulate content change
      }, 0);
    });

    await act(async () => {
      render(<PlanOverviewQuestionPageShared config={config} />);
    });

    // Wait for the simulated TinyMCE 'Change' event to propagate
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
    });

    // Click "Save" button
    const saveBtn = screen.getByRole('button', { name: 'labels.saveAnswer' });

    await act(async () => {
      fireEvent.click(saveBtn);
    })

    expect(
      screen.getByText((content, element) => {
        return element?.tagName.toLowerCase() === 'p' &&
          content === 'The answer is not in the proper format.';
      })
    ).toBeInTheDocument();
  })

  it('should load page with error when answer type is not in the list ', async () => {
    mockUseQuery.mockImplementation((document) => {
      if (document === PublishedQuestionDocument) {
        return {
          data: mockOtherQuestion,
          loading: false,
          error: undefined,
          refetch: jest.fn()
        } as any;
      }

      if (document === AnswerByVersionedQuestionIdDocument) {
        return {
          data: mockOtherAnswerData,
          loading: false,
          error: undefined,
          redirect: '/projects/1/dmp/1/s/22'
        } as any;
      }

      if (document === PlanDocument) {
        return {
          data: mockPlanData,
          loading: false,
          refetch: mockRefetch
        } as any;
      }

      return {
        data: null,
        loading: false,
        error: undefined
      } as any;
    });

    (updateAnswerAction as jest.Mock).mockResolvedValue({
      success: true,
      data: {
        errors: {
          general: 'The answer is not in the proper format.',
          versionedQuestionId: 'versionedQuestionId already exists'
        },
        id: 27,
        json: "{\"type\":\"textArea123\",\"answer\":\"This is a test\",\"meta\":{\"schemaVersion\":\"1.0\"},\"comment\":\"\"}",
        modified: "1751929006000",
        versionedQuestion: {
          versionedSectionId: 20
        }
      },
    });

    await act(async () => {
      render(<PlanOverviewQuestionPageShared config={config} />);
    });

    expect(screen.getByText('messaging.errors.questionUnexpectedFormat')).toBeInTheDocument();
  })
})

describe('Call to addAnswerAction', () => {
  beforeEach(() => {
    setupMocks();
    HTMLElement.prototype.scrollIntoView = mockScrollIntoView;

    // Mock window.tinymce
    window.tinymce = {
      init: jest.fn(),
      remove: jest.fn(),
    };

    // Mock the return value of useParams
    mockUseParams.mockReturnValue({ projectId: 1, dmpid: 1, sid: 22, qid: 344 });
    mockUseRouter.mockReturnValue({
      push: jest.fn(),
    });
  })

  it('should call addAnswerAction with correct data for checkbox when there is no corresponding answer in our db', async () => {
    mockUseQuery.mockImplementation((document) => {
      if (document === PublishedQuestionDocument) {
        return {
          data: mockCheckboxQuestion,
          loading: false,
          error: undefined,
          refetch: jest.fn()
        } as any;
      }

      if (document === AnswerByVersionedQuestionIdDocument) {
        return {
          data: null,
          loading: false,
          error: undefined,
          refetch: jest.fn()
        } as any;
      }

      if (document === PlanDocument) {
        return {
          data: mockPlanData,
          loading: false,
          refetch: mockRefetch
        } as any;
      }

      return {
        data: null,
        loading: false,
        error: undefined
      } as any;
    });

    (addAnswerAction as jest.Mock).mockResolvedValue({
      success: true,
      data: {
        errors: {
          general: null,
        },
        id: 27,
        json: "{\"type\":\"checkBoxes\",\"answer\":[\"Barbara\",\"Charlie\",\"Alex\"],\"meta\":{\"schemaVersion\":\"1.0\"},\"comment\":\"\"}",
        modified: "1751929006000",
        versionedQuestion: {
          versionedSectionId: 20
        }
      },
    });

    await act(async () => {
      render(
        <PlanOverviewQuestionPageShared config={config} />
      );
    });

    const checkboxGroup = screen.getByTestId('checkbox-group');
    expect(checkboxGroup).toBeInTheDocument();
    const checkboxes = within(checkboxGroup).getAllByRole('checkbox');
    const alexCheckbox = checkboxes.find(
      (checkbox) => (checkbox as HTMLInputElement).value === 'Alex'
    );

    await userEvent.click(alexCheckbox!);

    // Click "Save" button
    const saveBtn = screen.getByRole('button', { name: 'labels.saveAnswer' });

    fireEvent.click(saveBtn);
    await waitFor(() => {
      expect(addAnswerAction).toHaveBeenCalledWith({
        planId: 1,
        versionedSectionId: 22,
        versionedQuestionId: 344,
        json: "{\"type\":\"checkBoxes\",\"answer\":[\"Alex\"],\"meta\":{\"schemaVersion\":\"1.0\"},\"comment\":\"\"}"
      });
    });
  });
});

describe('DrawerPanel', () => {
  beforeEach(() => {
    setupMocks();
    HTMLElement.prototype.scrollIntoView = mockScrollIntoView;

    window.scrollTo = jest.fn(); // Called by the wrapping PageHeader

    // Mock window.tinymce
    window.tinymce = {
      init: jest.fn(),
      remove: jest.fn(),
    };

    // Mock the return value of useParams
    mockUseParams.mockReturnValue({ projectId: 1, dmpid: 1, sid: 22, qid: 344 });
    mockUseRouter.mockReturnValue({
      push: jest.fn(),
    });

    mockUseComments.mockReturnValue(defaultMockReturn);

  })

  it('should open Sample text DrawerPanel when user clicks on the \'View sample answer\' button', async () => {
    mockUseQuery.mockImplementation((document) => {
      if (document === PublishedQuestionDocument) {
        return {
          data: mockQuestionDataForTextArea,
          loading: false,
          error: undefined,
          refetch: jest.fn()
        } as any;
      }

      if (document === AnswerByVersionedQuestionIdDocument) {
        return {
          data: mockAnswerDataForTextArea,
          loading: false,
          error: undefined,
          refetch: jest.fn()
        } as any;
      }
      return {
        data: null,
        loading: false,
        error: undefined
      } as any;
    });

    await act(async () => {
      render(
        <PlanOverviewQuestionPageShared config={config} />
      );
    });

    // sidebar panel
    const allDrawerPanels = screen.queryAllByTestId('drawer-panel');
    const visibleDrawerPanel = allDrawerPanels.find(
      panel => panel.getAttribute('aria-hidden') !== 'true'
    );
    const sidebarPanel = screen.queryByTestId('sidebar-panel');

    // check for drawer panel trigger buttons
    const viewSampleTextBtn = screen.getByRole('button', { name: 'page.viewSampleAnswer' });
    expect(viewSampleTextBtn).toBeInTheDocument();
    expect(sidebarPanel).toBeInTheDocument();
    expect(visibleDrawerPanel).toBeUndefined();

    // Check that the textArea question field is in page
    const textAreaQuestion = screen.getByLabelText('question-text-editor');
    expect(textAreaQuestion).toBeInTheDocument();
    expect(screen.getByText((content) => content.includes('is simply dummy text'))).toBeInTheDocument();

    // click on the viewSampleTextBtn
    await act(async () => {
      fireEvent.click(viewSampleTextBtn);
    });

    const allDrawerPanels2 = screen.getAllByTestId('drawer-panel');
    const visibleDrawerPanel2 = allDrawerPanels2.find(
      panel => panel.getAttribute('aria-hidden') !== 'false'
    )!; // Non-null assertion operator
    const sidebarPanel2 = screen.queryByTestId('sidebar-panel');

    expect(sidebarPanel2).toHaveClass('state-closed');
    // Check that the sidebar-panel is visible
    expect(visibleDrawerPanel2).toBeInTheDocument();

    // While the drawer is open, click the 'Close' button to clower the panel
    // Check that the close action exists within the visible drawer panel
    const closeAction = screen.queryAllByTestId('close-action');

    // Click the close button
    await userEvent.click(closeAction[0]);

    // Get new info on sidebar and drawer panel - drawer should be closed and sidebar panel should be displayed
    const allDrawerPanels3 = screen.getAllByTestId('drawer-panel');
    const visibleDrawerPanel3 = allDrawerPanels3.find(
      panel => panel.getAttribute('aria-hidden') !== 'true'
    )!; // Non-null assertion operator
    const sidebarPanel3 = screen.queryByTestId('sidebar-panel');
    expect(sidebarPanel3).toBeInTheDocument();
    expect(visibleDrawerPanel3).toBeUndefined();
  })

  it('should transfer sample text into the textArea field when user clicks on the \'use answer\' button', async () => {
    mockUseQuery.mockImplementation((document) => {
      if (document === PublishedQuestionDocument) {
        return {
          data: mockQuestionDataForTextArea,
          loading: false,
          error: undefined,
          refetch: jest.fn()
        } as any;
      }

      if (document === AnswerByVersionedQuestionIdDocument) {
        return {
          data: mockAnswerDataForTextArea,
          loading: false,
          error: undefined,
          refetch: jest.fn()
        } as any;
      }
      return {
        data: null,
        loading: false,
        error: undefined
      } as any;
    });
    await act(async () => {
      render(
        <PlanOverviewQuestionPageShared config={config} />
      );
    });

    const viewSampleTextBtn = screen.getByRole('button', { name: 'page.viewSampleAnswer' });

    // click on the viewSampleTextBtn
    await act(async () => {
      fireEvent.click(viewSampleTextBtn);
    });

    const useAnswerBtn = screen.getByRole('button', { name: 'buttons.useAnswer' });
    // Click the useAnswer button
    await userEvent.click(useAnswerBtn);

    // Get new info on sidebar and drawer panel - drawer should be closed and sidebar panel should be displayed
    const allDrawerPanels2 = screen.getAllByTestId('drawer-panel');
    const visibleDrawerPanel2 = allDrawerPanels2.find(
      panel => panel.getAttribute('aria-hidden') !== 'true'
    )!; // Non-null assertion operator
    const sidebarPanel2 = screen.queryByTestId('sidebar-panel');
    expect(sidebarPanel2).toBeInTheDocument();
    expect(visibleDrawerPanel2).toBeUndefined();

    // The sample text should be visible in the textarea question
    expect(screen.getByText((content) => content.includes('Sample text'))).toBeInTheDocument();
  })


  it('should open Comments DrawerPanel when user clicks on the \'Comments\' button', async () => {

    mockUseQuery.mockImplementation((document) => {
      if (document === PublishedQuestionDocument) {
        return {
          data: mockQuestionDataForTextArea,
          loading: false,
          error: undefined,
          refetch: jest.fn()
        } as any;
      }

      if (document === AnswerByVersionedQuestionIdDocument) {
        return {
          data: mockAnswerDataForTextArea,
          loading: false,
          error: undefined,
          refetch: jest.fn()
        } as any;
      }
      return {
        data: null,
        loading: false,
        error: undefined
      } as any;
    });
    await act(async () => {
      render(
        <PlanOverviewQuestionPageShared config={config} />
      );

    });

    // sidebar panel
    const allDrawerPanels = screen.queryAllByTestId('drawer-panel');
    const visibleDrawerPanel = allDrawerPanels.find(
      panel => panel.getAttribute('aria-hidden') !== 'true'
    );
    const sidebarPanel = screen.queryByTestId('sidebar-panel');

    // check for drawer panel trigger buttons
    const viewCommentsBtn = screen.getByRole('button', { name: 'buttons.commentWithNumber' });
    expect(viewCommentsBtn).toBeInTheDocument();
    expect(sidebarPanel).toBeInTheDocument();
    expect(visibleDrawerPanel).toBeUndefined();

    // Check that the textArea question field is in page
    const textAreaQuestion = screen.getByLabelText('question-text-editor');
    expect(textAreaQuestion).toBeInTheDocument();
    expect(screen.getByText((content) => content.includes('is simply dummy text'))).toBeInTheDocument();

    // Click on Comments button to reveal comments drawer panel
    await act(async () => {
      fireEvent.click(viewCommentsBtn);
    });

    const allDrawerPanels2 = screen.getAllByTestId('drawer-panel');
    const visibleDrawerPanel2 = allDrawerPanels2.find(
      panel => panel.getAttribute('aria-hidden') !== 'false'
    )!; // Non-null assertion operator
    const sidebarPanel2 = screen.queryByTestId('sidebar-panel');

    // Check that the sidebar-panel is visible
    expect(sidebarPanel2).toHaveClass('state-closed');
    expect(visibleDrawerPanel2).toBeInTheDocument();

    // While the drawer is open, click the 'Close' button to clower the panel
    // Check that the close action exists within the visible drawer panel
    const closeAction = screen.queryAllByTestId('close-action');

    // Click the close button in the comments drawer
    await userEvent.click(closeAction[1]);

    // Get new info on sidebar and drawer panel - drawer should be closed and sidebar panel should be displayed
    const allDrawerPanels3 = screen.getAllByTestId('drawer-panel');
    const visibleDrawerPanel3 = allDrawerPanels3.find(
      panel => panel.getAttribute('aria-hidden') !== 'true'
    )!; // Non-null assertion operator
    const sidebarPanel3 = screen.queryByTestId('sidebar-panel');
    expect(sidebarPanel3).toBeInTheDocument();
    expect(visibleDrawerPanel3).toBeUndefined();
  })

  it('should close drawer panel when user clicks on the Comment button to submit a new comment', async () => {

    mockUseQuery.mockImplementation((document) => {
      if (document === PublishedQuestionDocument) {
        return {
          data: mockQuestionDataForTextArea,
          loading: false,
          error: undefined,
          refetch: jest.fn()
        } as any;
      }

      if (document === AnswerByVersionedQuestionIdDocument) {
        return {
          data: mockAnswerDataForTextArea,
          loading: false,
          error: undefined,
          refetch: jest.fn()
        } as any;
      }
      return {
        data: null,
        loading: false,
        error: undefined
      } as any;
    });
    await act(async () => {
      render(
        <PlanOverviewQuestionPageShared config={config} />
      );
    });


    const viewCommentsBtn = screen.getByRole('button', { name: 'buttons.commentWithNumber' });
    // Click on Comments button to reveal comments drawer panel
    await userEvent.click(viewCommentsBtn);

    // While the drawer is open, click the 'Close' button to clower the panel
    // Check that the close action exists within the visible drawer panel
    const commentBtn = screen.getByRole('button', { name: 'buttons.comment' })

    // Click the close button in the comments drawer
    await userEvent.click(commentBtn);

    // Get new info on sidebar and drawer panel - drawer should be closed and sidebar panel should be displayed

    const sidebarPanel2 = screen.queryByTestId('sidebar-panel');
    expect(sidebarPanel2).toBeInTheDocument();
  })

  it('should show both sampleText and customizationSampleText sections in the drawer when both are present', async () => {
    const mockQuestionWithCustomization = {
      publishedQuestion: {
        ...mockQuestionDataForTextArea.publishedQuestion,
        customizationSampleText: '<p>Customization sample text from CDL</p>',
        customizationOwnerAffiliation: {
          id: 99,
          name: 'California Digital Library',
          displayName: 'California Digital Library (cdlib.org)',
          uri: 'https://ror.org/03yrm5c28',
        },
      },
    };

    mockUseQuery.mockImplementation((document) => {
      if (document === PublishedQuestionDocument) {
        return {
          data: mockQuestionWithCustomization,
          loading: false,
          error: undefined,
          refetch: jest.fn()
        } as any;
      }

      if (document === AnswerByVersionedQuestionIdDocument) {
        return {
          data: mockAnswerDataForTextArea,
          loading: false,
          error: undefined,
          refetch: jest.fn()
        } as any;
      }
      return {
        data: null,
        loading: false,
        error: undefined
      } as any;
    });

    await act(async () => {
      render(
        <PlanOverviewQuestionPageShared config={config} />
      );
    });

    const viewSampleTextBtn = screen.getByRole('button', { name: 'page.viewSampleAnswer' });

    // Open the drawer
    await act(async () => {
      fireEvent.click(viewSampleTextBtn);
    });

    // Both funder and org sample text headings should be visible
    expect(screen.getAllByText('page.organizationSampleText')).toHaveLength(2); // should be two organization sample text headings - one for sampleText and one for customizationSampleText
    // Both sample text contents should be present
    expect(screen.getByText((content) => content.includes('Sample text'))).toBeInTheDocument();
    expect(screen.getByText((content) => content.includes('Customization sample text from CDL'))).toBeInTheDocument();

    // There should be two 'use answer' buttons (one per text block)
    const useAnswerBtns = screen.getAllByRole('button', { name: 'buttons.useAnswer' });
    expect(useAnswerBtns).toHaveLength(2);
  })

  it('should transfer customizationSampleText into the textArea field when user clicks on the second \'use answer\' button', async () => {
    const mockQuestionWithCustomization = {
      publishedQuestion: {
        ...mockQuestionDataForTextArea.publishedQuestion,
        customizationSampleText: '<p>Customization sample text from CDL</p>',
        customizationOwnerAffiliation: {
          id: 99,
          name: 'California Digital Library',
          displayName: 'California Digital Library (cdlib.org)',
          uri: 'https://ror.org/03yrm5c28',
        },
      },
    };

    mockUseQuery.mockImplementation((document) => {
      if (document === PublishedQuestionDocument) {
        return {
          data: mockQuestionWithCustomization,
          loading: false,
          error: undefined,
          refetch: jest.fn()
        } as any;
      }

      if (document === AnswerByVersionedQuestionIdDocument) {
        return {
          data: mockAnswerDataForTextArea,
          loading: false,
          error: undefined,
          refetch: jest.fn()
        } as any;
      }
      return {
        data: null,
        loading: false,
        error: undefined
      } as any;
    });

    await act(async () => {
      render(
        <PlanOverviewQuestionPageShared config={config} />
      );
    });

    const viewSampleTextBtn = screen.getByRole('button', { name: 'page.viewSampleAnswer' });

    // Open the drawer
    await act(async () => {
      fireEvent.click(viewSampleTextBtn);
    });

    // Click the second 'use answer' button (for customizationSampleText)
    const useAnswerBtns = screen.getAllByRole('button', { name: 'buttons.useAnswer' });
    expect(useAnswerBtns).toHaveLength(2);
    await userEvent.click(useAnswerBtns[1]);

    // Drawer should be closed after clicking 'use answer'
    const allDrawerPanels = screen.getAllByTestId('drawer-panel');
    const visibleDrawerPanel = allDrawerPanels.find(
      panel => panel.getAttribute('aria-hidden') !== 'true'
    );
    expect(visibleDrawerPanel).toBeUndefined();

    // The customization sample text should now be in the textarea
    expect(screen.getByText((content) => content.includes('Customization sample text from CDL'))).toBeInTheDocument();
  })

  it('should show only customizationSampleText section in the drawer when only customizationSampleText is present', async () => {
    const mockQuestionWithCustomizationOnly = {
      publishedQuestion: {
        ...mockQuestionDataForTextArea.publishedQuestion,
        sampleText: null,
        customizationSampleText: '<p>Customization only sample text</p>',
        customizationOwnerAffiliation: {
          id: 99,
          name: 'California Digital Library',
          displayName: 'California Digital Library (cdlib.org)',
          uri: 'https://ror.org/03yrm5c28',
        },
      },
    };

    mockUseQuery.mockImplementation((document) => {
      if (document === PublishedQuestionDocument) {
        return {
          data: mockQuestionWithCustomizationOnly,
          loading: false,
          error: undefined,
          refetch: jest.fn()
        } as any;
      }

      if (document === AnswerByVersionedQuestionIdDocument) {
        return {
          data: mockAnswerDataForTextArea,
          loading: false,
          error: undefined,
          refetch: jest.fn()
        } as any;
      }
      return {
        data: null,
        loading: false,
        error: undefined
      } as any;
    });

    await act(async () => {
      render(
        <PlanOverviewQuestionPageShared config={config} />
      );
    });

    const viewSampleTextBtn = screen.getByRole('button', { name: 'page.viewSampleAnswer' });

    // Open the drawer
    await act(async () => {
      fireEvent.click(viewSampleTextBtn);
    });

    // Only org sample text heading should be visible
    expect(screen.queryByText('page.funderSampleText')).not.toBeInTheDocument();
    expect(screen.getByText('page.organizationSampleText')).toBeInTheDocument();

    // Only customization text should be present
    expect(screen.getByText((content) => content.includes('Customization only sample text'))).toBeInTheDocument();

    // Only one 'use answer' button
    const useAnswerBtns = screen.getAllByRole('button', { name: 'buttons.useAnswer' });
    expect(useAnswerBtns).toHaveLength(1);
  })
});

describe('Prevent unload when user has unsaved changes', () => {
  let addEventListenerSpy: jest.SpyInstance;
  let removeEventListenerSpy: jest.SpyInstance;
  beforeEach(() => {
    setupMocks();
    HTMLElement.prototype.scrollIntoView = mockScrollIntoView;

    // Mock window.tinymce
    window.tinymce = {
      init: jest.fn(),
      remove: jest.fn(),
    };

    // Mock the return value of useParams
    mockUseParams.mockReturnValue({ projectId: 1, dmpid: 1, sid: 22, qid: 344 });
    mockUseRouter.mockReturnValue({
      push: jest.fn(),
    });
    // Mock addEventListener
    addEventListenerSpy = jest.spyOn(window, 'addEventListener');
    removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
  })

  afterEach(() => {
    // Cleanup
    removeEventListenerSpy.mockRestore();
    addEventListenerSpy.mockRestore();
  })

  it('should prevent unload when there are unsaved changes and user tries to navigate away from page', async () => {
    mockUseQuery.mockImplementation((document) => {
      if (document === PublishedQuestionDocument) {
        return {
          data: mockCheckboxQuestion,
          loading: false,
          error: undefined,
          refetch: jest.fn()
        } as any;
      }

      if (document === AnswerByVersionedQuestionIdDocument) {
        return {
          data: null,
          loading: false,
          error: undefined,
          refetch: jest.fn()
        } as any;
      }

      if (document === PlanDocument) {
        return {
          data: mockPlanData,
          loading: false,
          refetch: mockRefetch
        } as any;
      }

      return {
        data: null,
        loading: false,
        error: undefined
      } as any;
    });
    (addAnswerAction as jest.Mock).mockResolvedValue({
      success: true,
      data: {
        errors: {
          general: null,
        },
        id: 27,
        json: "{\"type\":\"checkBoxes\",\"answer\":[\"Barbara\",\"Charlie\",\"Alex\"],\"comment\":\"\"}",
        modified: "1751929006000",
        versionedQuestion: {
          versionedSectionId: 20
        }
      },
    });

    render(
      <PlanOverviewQuestionPageShared config={config} />
    );

    // Make checkbox change
    const checkboxGroup = screen.getByTestId('checkbox-group');
    expect(checkboxGroup).toBeInTheDocument();
    const checkboxes = within(checkboxGroup).getAllByRole('checkbox');
    const alexCheckbox = checkboxes.find(
      (checkbox) => (checkbox as HTMLInputElement).value === 'Alex'
    );

    await userEvent.click(alexCheckbox!);

    // Wait for state update
    await waitFor(() => {
      // Get the last registered 'beforeunload' handler
      const handler = addEventListenerSpy.mock.calls
        .filter(([event]) => event === 'beforeunload')
        .map(([, fn]) => fn)
        .pop();

      // Simulate event of navigating way from page
      const event = new Event('beforeunload');
      Object.defineProperty(event, 'returnValue', {
        writable: true,
        value: undefined,
      });

      if (handler) {
        handler(event as unknown as BeforeUnloadEvent);
        expect(event.returnValue).toBe('');
      }
    });
  });
});

describe('Auto save', () => {
  beforeEach(() => {
    setupMocks();
    HTMLElement.prototype.scrollIntoView = mockScrollIntoView;

    // Mock window.tinymce
    window.tinymce = {
      init: jest.fn(),
      remove: jest.fn(),
    };

    // Mock the return value of useParams
    mockUseParams.mockReturnValue({ projectId: 1, dmpid: 1, sid: 22, qid: 344 });
    mockUseRouter.mockReturnValue({
      push: jest.fn(),
    });
  })

  it('should show saved message after auto-saving changes', async () => {
    HTMLElement.prototype.scrollIntoView = mockScrollIntoView;

    // Mock window.tinymce
    window.tinymce = {
      init: jest.fn(),
      remove: jest.fn(),
    };

    mockUseParams.mockReturnValue({ projectId: 1, dmpid: 1, sid: 22, qid: 344 });
    mockUseRouter.mockReturnValue({
      push: jest.fn(),
    });

    mockUseQuery.mockImplementation((document) => {
      if (document === PublishedQuestionDocument) {
        return {
          data: mockCheckboxQuestion,
          loading: false,
          error: undefined,
          refetch: jest.fn()
        } as any;
      }

      if (document === AnswerByVersionedQuestionIdDocument) {
        return {
          data: mockCheckboxAnswer,
          loading: false,
          error: undefined,
          refetch: jest.fn()
        } as any;
      }

      if (document === PlanDocument) {
        return {
          data: mockPlanData,
          loading: false,
          refetch: mockRefetch
        } as any;
      }

      return {
        data: null,
        loading: false,
        error: undefined
      } as any;
    });


    const setTimeoutSpy = jest.spyOn(global, 'setTimeout');
    await act(async () => {
      render(
        <PlanOverviewQuestionPageShared config={config} />
      );
    });

    const checkboxGroup = screen.getByTestId('checkbox-group');
    expect(checkboxGroup).toBeInTheDocument();
    const checkboxes = within(checkboxGroup).getAllByRole('checkbox');
    const alexCheckbox = checkboxes.find(
      (checkbox) => (checkbox as HTMLInputElement).value === 'Alex'
    );

    fireEvent.click(alexCheckbox!);

    const lastSavedText = screen.getByText('messages.unsavedChanges');
    expect(lastSavedText).toBeInTheDocument();
    // Verify timeout scheduled
    expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 3000);

    setTimeoutSpy.mockRestore();
  });

  describe('PlanOverviewQuestionPage - Research Output Table', () => {
    beforeEach(() => {
      setupMocks();
      jest.clearAllMocks();
      HTMLElement.prototype.scrollIntoView = mockScrollIntoView;

      window.tinymce = {
        init: jest.fn(),
        remove: jest.fn(),
      };

      mockUseParams.mockReturnValue({ projectId: 1, dmpid: 1, sid: 22, qid: 344 });
      mockUseRouter.mockReturnValue({
        push: jest.fn(),
      });

      mockUseComments.mockReturnValue(defaultMockReturn);
    });

    it('should load correct question content for research output table question', async () => {
      mockUseQuery.mockImplementation((document) => {
        if (document === PublishedQuestionDocument) {
          return {
            data: mockQuestionDataForResearchOutput,
            loading: false,
            error: undefined,
            refetch: jest.fn()
          } as any;
        }

        if (document === AnswerByVersionedQuestionIdDocument) {
          return {
            data: null,
            loading: false,
            error: undefined,
            refetch: jest.fn()
          } as any;
        }
        if (document === PlanDocument) {
          return {
            data: mockPlanData,
            loading: false,
            refetch: mockRefetch
          } as any;
        }

        return {
          data: null,
          loading: false,
          error: undefined
        } as any;
      });

      await act(async () => {
        render(<PlanOverviewQuestionPageShared config={config} />);
      });

      expect(screen.getByRole('heading', { level: 2, name: 'Research Output Table question' })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'page.viewSampleAnswer' })).not.toBeInTheDocument();

      const researchOutputTable = screen.getByTestId('research-output-table');
      expect(researchOutputTable).toBeInTheDocument();

      // Check that columns are rendered
      expect(screen.getByTestId('column-count')).toHaveTextContent('2');
    });


    it('should call updateAnswerAction with correct data for research output table', async () => {
      mockUseQuery.mockImplementation((document) => {
        if (document === PublishedQuestionDocument) {
          return {
            data: mockQuestionDataForResearchOutput,
            loading: false,
            error: undefined,
            refetch: jest.fn()
          } as any;
        }

        if (document === AnswerByVersionedQuestionIdDocument) {
          return {
            data: mockAnswerDataForResearchOutput,
            loading: false,
            error: undefined,
            refetch: jest.fn()
          } as any;
        }
        if (document === PlanDocument) {
          return {
            data: mockPlanData,
            loading: false,
            refetch: mockRefetch
          } as any;
        }

        return {
          data: null,
          loading: false,
          error: undefined
        } as any;
      });


      (updateAnswerAction as jest.Mock).mockResolvedValue({
        success: true,
        data: {
          errors: { general: null },
          id: 25,
          json: '{"type":"researchOutputTable","columnHeadings":["Title","Description","Anticipated Release Date","Anticipated file size"],"answer":[{"columns":[{"type":"text","answer":"My Dataset","meta":{"schemaVersion":"1.0"}},{"type":"textArea","answer":"Updated description","meta":{"schemaVersion":"1.0"}}]}],\"comment\":\"\"}',
          modified: "1735000000000",
          versionedQuestion: {
            versionedSectionId: 22
          }
        },
      });

      await act(async () => {
        render(<PlanOverviewQuestionPageShared config={config} />);
      });

      // Simulate adding a row
      const addButton = screen.getByText('Add Output');
      await act(async () => {
        fireEvent.click(addButton);
      });

      // Click the main save button
      const saveBtn = screen.getByRole('button', { name: 'labels.saveAnswer' });
      await act(async () => {
        fireEvent.click(saveBtn);
      });

      await waitFor(() => {
        expect(updateAnswerAction).toHaveBeenCalled();
        const callArgs = (updateAnswerAction as jest.Mock).mock.calls[0][0];
        expect(callArgs.answerId).toBe(25);
        const parsedJson = JSON.parse(callArgs.json);
        expect(parsedJson.type).toBe('researchOutputTable');
        expect(parsedJson.columnHeadings).toBeDefined();
        expect(Array.isArray(parsedJson.answer)).toBe(true);
      });
    });

    it('should call addAnswerAction when creating new research output table answer', async () => {
      mockUseQuery.mockImplementation((document) => {
        if (document === PublishedQuestionDocument) {
          return {
            data: mockQuestionDataForResearchOutput,
            loading: false,
            error: undefined,
            refetch: jest.fn()
          } as any;
        }

        if (document === AnswerByVersionedQuestionIdDocument) {
          return {
            data: null,
            loading: false,
            error: undefined,
            refetch: jest.fn()
          } as any;
        }
        if (document === PlanDocument) {
          return {
            data: mockPlanData,
            loading: false,
            refetch: mockRefetch
          } as any;
        }

        return {
          data: null,
          loading: false,
          error: undefined
        } as any;
      });

      (addAnswerAction as jest.Mock).mockResolvedValue({
        success: true,
        data: {
          errors: { general: null },
          id: 26,
          json: '{"type":"researchOutputTable","columnHeadings":["Title","Description","Anticipated Release Date","Anticipated file size"],"answer":[],\"comment\":\"\"}',
          modified: "1735000000000",
          versionedQuestion: {
            versionedSectionId: 22
          }
        },
      });

      await act(async () => {
        render(<PlanOverviewQuestionPageShared config={config} />);
      });

      const saveBtn = screen.getByRole('button', { name: 'labels.saveAnswer' });
      await act(async () => {
        fireEvent.click(saveBtn);
      });

      await waitFor(() => {
        expect(addAnswerAction).toHaveBeenCalledWith({
          planId: 1,
          versionedSectionId: 22,
          versionedQuestionId: 344,
          json: expect.stringContaining('"type":"researchOutputTable"')
        });
      });
    });

    it('should trigger onSave callback when research output table internal save is called', async () => {
      mockUseQuery.mockImplementation((document) => {
        if (document === PublishedQuestionDocument) {
          return {
            data: mockQuestionDataForResearchOutput,
            loading: false,
            error: undefined,
            refetch: jest.fn()
          } as any;
        }

        if (document === AnswerByVersionedQuestionIdDocument) {
          return {
            data: mockAnswerDataForResearchOutput,
            loading: false,
            error: undefined,
            refetch: jest.fn()
          } as any;
        }
        if (document === PlanDocument) {
          return {
            data: mockPlanData,
            loading: false,
            refetch: mockRefetch
          } as any;
        }

        return {
          data: null,
          loading: false,
          error: undefined
        } as any;
      });


      (updateAnswerAction as jest.Mock).mockResolvedValue({
        success: true,
        data: {
          errors: { general: null },
        },
      });

      await act(async () => {
        render(<PlanOverviewQuestionPageShared config={config} />);
      });

      // Click the internal save button in the research output component
      const internalSaveBtn = screen.getByText('Save Output');
      await act(async () => {
        fireEvent.click(internalSaveBtn);
      });

      await waitFor(() => {
        expect(updateAnswerAction).toHaveBeenCalled();
      });
    });
  });
});

describe('PlanOverviewQuestionPageShared isAdmin/isReadOnly and feedback notification', () => {
  beforeEach(() => {
    setupMocks();
    HTMLElement.prototype.scrollIntoView = mockScrollIntoView;
    window.tinymce = { init: jest.fn(), remove: jest.fn() };
    mockUseParams.mockReturnValue({ projectId: 1, dmpid: 1, sid: 22, qid: 344 });
    mockUseRouter.mockReturnValue({ push: jest.fn() });
    mockUseComments.mockReturnValue(defaultMockReturn);
  });

  it('shows NotificationHeader when feedbackStatus is REQUESTED', async () => {
    const ORG_URI = 'https://ror.org/03yrm5c26';

    // Ensure the plan's template owner URI matches the admin user's affiliation URI
    const planWithRequested = {
      ...mockPlanData,
      plan: {
        ...mockPlanData.plan,
        feedbackStatus: { status: 'REQUESTED' },
        versionedTemplate: {
          ...mockPlanData.plan.versionedTemplate,
          owner: {
            ...mockPlanData.plan.versionedTemplate?.owner,
            uri: ORG_URI,  // must match meAdmin's affiliation.uri
          },
        },
      },
    };

    const meAdmin = {
      ...mockMeData,
      me: {
        ...mockMeData.me,
        affiliation: { uri: ORG_URI },  // <-- must match plan owner uri
        role: UserRole.Admin,
      },
    };

    mockUseQuery.mockImplementation((document) => {
      if (document === PublishedQuestionDocument) {
        return { data: mockQuestionDataForTextArea, loading: false, error: undefined, refetch: jest.fn() } as any;
      }
      if (document === AnswerByVersionedQuestionIdDocument) {
        return { data: mockAnswerDataForTextArea, loading: false, error: undefined, refetch: jest.fn() } as any;
      }
      if (document === PlanDocument) {
        return { data: planWithRequested, loading: false, refetch: mockRefetch } as any;
      }
      if (document === MeDocument) {
        return { data: meAdmin, loading: false, error: undefined, refetch: jest.fn() } as any;  // <-- was missing
      }
      return { data: null, loading: false, error: undefined } as any;
    });

    await act(async () => {
      render(<PlanOverviewQuestionPageShared config={config} />);
    });

    expect(screen.getByText('feedbackNotification.title')).toBeInTheDocument();
    expect(screen.getByText('feedbackNotification.description')).toBeInTheDocument();
  });

  it('disables form submit and hides Save button when isReadOnly is true', async () => {
    // Simulate feedbackStatus REQUESTED and user is not admin
    const planWithRequested = { ...mockPlanData, plan: { ...mockPlanData.plan, feedbackStatus: { status: 'REQUESTED' }, planCreator: { ...mockPlanData.plan.planCreator, affiliation: { uri: 'https://ror.org/03yrm5c26' } } } };
    const meAdmin = { ...mockMeData, me: { ...mockMeData.me, affiliation: { uri: 'https://ror.org/03yrm5c26' }, role: UserRole.Admin } };
    mockUseQuery.mockImplementation((document) => {
      if (document === PublishedQuestionDocument) {
        return { data: mockQuestionDataForTextArea, loading: false, error: undefined, refetch: jest.fn() } as any;
      }
      if (document === AnswerByVersionedQuestionIdDocument) {
        return { data: mockAnswerDataForTextArea, loading: false, error: undefined, refetch: jest.fn() } as any;
      }
      if (document === PlanDocument) {
        return { data: planWithRequested, loading: false, refetch: mockRefetch } as any;
      }
      if (document === MeDocument) {
        return { data: meAdmin, loading: false, error: undefined, refetch: jest.fn() } as any;
      }
      return { data: null, loading: false, error: undefined } as any;
    });
    await act(async () => {
      render(<PlanOverviewQuestionPageShared config={config} />);
    });
    // Save button should not be rendered
    expect(screen.queryByRole('button', { name: /save/i })).not.toBeInTheDocument();
    // Form should prevent default on submit
    const form = screen.getByTestId('question-form');
    const preventDefaultSpy = jest.spyOn(Event.prototype, 'preventDefault');
    fireEvent.submit(form);
    expect(preventDefaultSpy).toHaveBeenCalled();
    preventDefaultSpy.mockRestore();
  });

  it('shows Save button when isReadOnly is false (admin)', async () => {
    // Simulate feedbackStatus REQUESTED but user is admin
    const planWithRequested = { ...mockPlanData, plan: { ...mockPlanData.plan, feedbackStatus: { status: 'REQUESTED' }, versionedTemplate: { ...mockPlanData.plan.versionedTemplate, owner: { ...mockPlanData.plan.versionedTemplate.owner, uri: 'user-uri' } } } };
    const meAdmin = { ...mockMeData, me: { ...mockMeData.me, affiliation: { uri: 'admin-uri' }, role: 'ADMIN' } };
    mockUseQuery.mockImplementation((document) => {
      if (document === PublishedQuestionDocument) {
        return { data: mockQuestionDataForTextArea, loading: false, error: undefined, refetch: jest.fn() } as any;
      }
      if (document === AnswerByVersionedQuestionIdDocument) {
        return { data: mockAnswerDataForTextArea, loading: false, error: undefined, refetch: jest.fn() } as any;
      }
      if (document === PlanDocument) {
        return { data: planWithRequested, loading: false, refetch: mockRefetch } as any;
      }
      if (document === MeDocument) {
        return { data: meAdmin, loading: false, error: undefined, refetch: jest.fn() } as any;
      }
      return { data: null, loading: false, error: undefined } as any;
    });
    await act(async () => {
      render(<PlanOverviewQuestionPageShared config={config} />);
    });
    // Save button should be rendered
    expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
  });
});


