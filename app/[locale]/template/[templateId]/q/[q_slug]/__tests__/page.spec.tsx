import React from "react";
import { act, fireEvent, render, screen, waitFor, within } from '@/utils/test-utils';
import { routePath } from '@/utils/routes';
import { useQuery } from '@apollo/client/react';
import {
  QuestionDocument,
  LicensesDocument,
  DefaultResearchOutputTypesDocument,
} from '@/generated/graphql';

import {
  removeQuestionAction,
  updateQuestionAction
} from '../actions';

import { axe, toHaveNoViolations } from 'jest-axe';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/context/ToastContext';
import logECS from '@/utils/clientLogger';
import QuestionEdit from '../page';
import { mockScrollIntoView, mockScrollTo } from "@/__mocks__/common";
import mockQuestionData from '../__mocks__/mockQuestionData.json';
import mockRadioQuestion from '@/__mocks__/common/mockRadioQuestion.json';
import mockQuestionDataForDateRange from '@/__mocks__/common/mockDateRangeQuestion.json';
import mockQuestionDataForNumberRange from '@/__mocks__/common/mockNumberRangeQuestion.json';
import mockQuestionDataForTypeAheadSearch from '@/__mocks__/common/mockTypeaheadQuestion.json';
import mockQuestionDataForTextField from '@/__mocks__/common/mockTextQuestion.json';
import mockQuestionDataForTextArea from '@/__mocks__/common/mockTextAreaQuestion.json';
import mockQuestionDataForURL from '@/__mocks__/common/mockURLQuestion.json';
import mockQuestionDataForNumber from '@/__mocks__/common/mockNumberQuestion.json';
import mockQuestionDataForCurrency from '@/__mocks__/common/mockCurrencyQuestion.json';
import mockSelectedQuestion from '../__mocks__/mockSelectedQuestion.json';
import mockLicensesData from '../__mocks__/mockLicensesList.json';
import mockDefaultOutputTypesData from '../__mocks__/mockDefaultOutputTypes.json';
import * as getParsedJSONModule from '@/components/hooks/getParsedQuestionJSON';
import { AffiliationSearchQuestionType } from "@dmptool/types";

const RESEARCH_OUTPUT_TABLE_JSON = "{\"meta\":{\"title\":\"Research Output Table\",\"schemaVersion\":\"1.0\",\"usageDescription\":\"A table for collecting structured research output data\"},\"type\":\"researchOutputTable\",\"columns\":[{\"meta\":{\"schemaVersion\":\"1.0\"},\"content\":{\"meta\":{\"schemaVersion\":\"1.0\"},\"type\":\"text\",\"attributes\":{\"help\":\"\",\"maxLength\":500}},\"enabled\":true,\"heading\":\"Title\",\"required\":false},{\"meta\":{\"schemaVersion\":\"1.0\"},\"content\":{\"meta\":{\"schemaVersion\":\"1.0\"},\"type\":\"textArea\",\"attributes\":{\"help\":\"My description help text \",\"labelTranslationKey\":\"researchOutput.description.heading\"}},\"enabled\":true,\"heading\":\"Description\",\"required\":false},{\"meta\":{\"schemaVersion\":\"1.0\"},\"content\":{\"meta\":{\"schemaVersion\":\"1.0\"},\"type\":\"selectBox\",\"options\":[],\"attributes\":{\"help\":\"\",\"multiple\":false,\"labelTranslationKey\":\"researchOutput.accessLevel.heading\"}},\"enabled\":true,\"heading\":\"Output Type\",\"required\":false},{\"meta\":{\"schemaVersion\":\"1.0\"},\"content\":{\"meta\":{\"schemaVersion\":\"1.0\"},\"type\":\"checkBoxes\",\"options\":[{\"label\":\"May contain sensitive data?\",\"value\":\"sensitive\"}],\"attributes\":{\"help\":\"\",\"labelTranslationKey\":\"researchOutput.dataFlags.heading\"}},\"enabled\":true,\"heading\":\"Sensitive Data\",\"required\":false},{\"meta\":{\"schemaVersion\":\"1.0\"},\"content\":{\"meta\":{\"schemaVersion\":\"1.0\"},\"type\":\"checkBoxes\",\"options\":[{\"label\":\"May contain personally identifiable information?\",\"value\":\"personal\"}],\"attributes\":{\"help\":\"\",\"labelTranslationKey\":\"researchOutput.dataFlags.heading\"}},\"enabled\":true,\"heading\":\"Personal Data\",\"required\":false},{\"meta\":{\"schemaVersion\":\"1.0\"},\"content\":{\"meta\":{\"schemaVersion\":\"1.0\"},\"type\":\"repositorySearch\",\"graphQL\":{\"query\":\"query Repositories($term: String, $keywords: [String!], $repositoryType: String, $paginationOptions: PaginationOptions){ repositories(term: $term, keywords: $keywords, repositoryType: $repositoryType, paginationOptions: $paginationOptions) { totalCount currentOffset limit hasNextPage hasPreviousPage availableSortFields items { id name uri description website keywords repositoryTypes } } }\",\"queryId\":\"useRepositoriesQuery\",\"variables\":[{\"name\":\"term\",\"type\":\"string\",\"label\":\"Search for a repository\",\"minLength\":3},{\"name\":\"keywords\",\"type\":\"string\",\"label\":\"Subject Areas\",\"minLength\":3},{\"name\":\"repositoryType\",\"type\":\"string\",\"label\":\"Repository type\",\"minLength\":3},{\"name\":\"paginationOptions\",\"type\":\"paginationOptions\",\"label\":\"Pagination Options\"}],\"answerField\":\"uri\",\"displayFields\":[{\"label\":\"Name\",\"propertyName\":\"name\"},{\"label\":\"Description\",\"propertyName\":\"description\"},{\"label\":\"Website\",\"propertyName\":\"website\"},{\"label\":\"Subject Areas\",\"propertyName\":\"keywords\"}],\"responseField\":\"repositories.items\"},\"attributes\":{\"help\":\"My repositories help text\",\"label\":\"Repositories\"}},\"enabled\":true,\"heading\":\"Repositories\",\"required\":false,\"attributes\":{\"help\":\"Select repositor(ies) you would prefer users to deposit in\",\"labelTranslationKey\":\"researchOutput.repository.heading\"},\"preferences\":[{\"label\":\"Zenodo\",\"value\":\"https://www.re3data.org/repository/https://www.re3data.org/api/v1/repository/r3d100010468\"},{\"label\":\"University of Opole Knowledge Base\",\"value\":\"https://www.re3data.org/repository/r3d100014686\"}]},{\"meta\":{\"schemaVersion\":\"1.0\"},\"content\":{\"meta\":{\"schemaVersion\":\"1.0\"},\"type\":\"metadataStandardSearch\",\"graphQL\":{\"query\":\"query MetadataStandards($term: String, $keywords: [String!], $paginationOptions: PaginationOptions){ metadataStandards(term: $term, keywords: $keywords, paginationOptions: $paginationOptions) { totalCount currentOffset limit hasNextPage hasPreviousPage availableSortFields items { id name uri description keywords } } }\",\"queryId\":\"useMetadataStandardsQuery\",\"variables\":[{\"name\":\"term\",\"type\":\"string\",\"label\":\"Search for a metadata standard\",\"minLength\":3},{\"name\":\"keywords\",\"type\":\"string\",\"label\":\"Subject Areas\",\"minLength\":3},{\"name\":\"paginationOptions\",\"type\":\"paginationOptions\",\"label\":\"Pagination Options\"}],\"answerField\":\"uri\",\"displayFields\":[{\"label\":\"Name\",\"propertyName\":\"name\"},{\"label\":\"Description\",\"propertyName\":\"description\"},{\"label\":\"Website\",\"propertyName\":\"website\"},{\"label\":\"Subject Areas\",\"propertyName\":\"keywords\"}],\"responseField\":\"metadataStandards.items\"},\"attributes\":{\"help\":\"My metadata standards help text\",\"label\":\"Metadata Standards\"}},\"enabled\":true,\"heading\":\"Metadata Standards\",\"required\":false,\"attributes\":{\"help\":\"Select metadata standard(s) you would prefer users to use\",\"labelTranslationKey\":\"researchOutput.metadataStandard.heading\"},\"preferences\":[{\"label\":\"Terminal RI Unicamp\",\"value\":\"https://repositorio.unicamp.br/\"},{\"label\":\"STAC 1.2.0\",\"value\":\"https://stac-extensions.github.io/version/v1.2.0/schema.json\"},{\"label\":\"Sintomas osteomusculares\",\"value\":\"https://prpi.usp.br/gestao-de-dados-cientificos/?codmnu=9979\"}]},{\"meta\":{\"schemaVersion\":\"1.0\"},\"content\":{\"meta\":{\"schemaVersion\":\"1.0\"},\"type\":\"licenseSearch\",\"graphQL\":{\"query\":\"query Licenses{ licenses { id name uri description } }\",\"variables\":[],\"answerField\":\"uri\",\"displayFields\":[{\"label\":\"Name\",\"propertyName\":\"name\"},{\"label\":\"Description\",\"propertyName\":\"description\"},{\"label\":\"Recommended\",\"propertyName\":\"recommended\"}],\"responseField\":\"licenses\"},\"attributes\":{\"help\":\"My licenses help text\",\"label\":\"Licenses\"}},\"enabled\":true,\"heading\":\"Licenses\",\"required\":false,\"attributes\":{\"help\":\"Select license(s) you would prefer users to apply to the research output\",\"labelTranslationKey\":\"researchOutput.license.heading\"},\"preferences\":[{\"label\":\"CC-BY-4.0\",\"value\":\"https://spdx.org/licenses/CC-BY-4.0.json\"},{\"label\":\"CC0-1.0\",\"value\":\"https://spdx.org/licenses/CC0-1.0.json\"},{\"label\":\"any-OSI-perl-modules\",\"value\":\"https://spdx.org/licenses/any-OSI-perl-modules.json\"}]},{\"meta\":{\"schemaVersion\":\"1.0\"},\"content\":{\"meta\":{\"schemaVersion\":\"1.0\"},\"type\":\"selectBox\",\"options\":[],\"attributes\":{\"help\":\"My initial access levels help text\",\"multiple\":false,\"labelTranslationKey\":\"researchOutput.accessLevel.heading\"}},\"enabled\":true,\"heading\":\"Initial Access Levels\",\"required\":false},{\"meta\":{\"schemaVersion\":\"1.0\"},\"content\":{\"meta\":{\"schemaVersion\":\"1.0\"},\"type\":\"text\",\"attributes\":{\"help\":\"\",\"maxLength\":255}},\"enabled\":true,\"heading\":\"Coverage\",\"required\":false},{\"meta\":{\"schemaVersion\":\"1.0\"},\"content\":{\"meta\":{\"schemaVersion\":\"1.0\"},\"type\":\"text\",\"attributes\":{\"help\":\"My custom field help text\",\"maxLength\":150,\"defaultValue\":\"My custom field default value\"}},\"enabled\":true,\"heading\":\"My custom field label\",\"required\":false}],\"attributes\":{\"help\":\"\",\"label\":\"\",\"canAddRows\":true,\"initialRows\":1,\"canRemoveRows\":true,\"labelTranslationKey\":\"\"}}";

beforeEach(() => {
  // Cannot get the escaping to work in the mock JSON file, so doing it programmatically here
  const affiliationQuery = 'query Affiliations($name: String!){ ' +
    'affiliations(name: $name) { ' +
    'totalCount ' +
    'nextCursor ' +
    'items { ' +
    'id ' +
    'displayName ' +
    'uri ' +
    '} ' +
    '} ' +
    '}';

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
  mockQuestionDataForTypeAheadSearch.question.json = JSON.stringify(json);
});

expect.extend(toHaveNoViolations);

jest.mock('@/components/hooks/getParsedQuestionJSON', () => {
  const actual = jest.requireActual('@/components/hooks/getParsedQuestionJSON');
  return {
    __esModule: true,
    ...actual,
    getParsedQuestionJSON: jest.fn(actual.getParsedQuestionJSON),
  };
});

// Mock the useTemplateQuery hook
jest.mock("@/generated/graphql", () => ({
  useQuestionQuery: jest.fn(),
  useLicensesQuery: jest.fn(),
  useDefaultResearchOutputTypesQuery: jest.fn(),
}));

jest.mock('../actions/index', () => ({
  updateQuestionAction: jest.fn(),
  removeQuestionAction: jest.fn(),
}));

// Create a variable to store the onRepositoriesChange callback
/* eslint-disable @typescript-eslint/no-explicit-any */
let capturedOnRepositoriesChange: ((repos: any[]) => void) | null = null;

// Mock research output related components
jest.mock('@/components/QuestionAdd/ReposSelector', () => ({
  __esModule: true,
  default: ({ handleTogglePreferredRepositories, onRepositoriesChange }: {
    handleTogglePreferredRepositories: (value: boolean) => void;
    onRepositoriesChange: (repos: { id: string; name: string; url: string }[]) => void;
  }) => {
    // Capture the callback for use in tests
    capturedOnRepositoriesChange = onRepositoriesChange;
    return (
      <div data-testid="repository-selection-system">
        <button onClick={() => handleTogglePreferredRepositories(true)}>
          Toggle Preferred Repositories
        </button>
        <button onClick={() => onRepositoriesChange([{ id: '1', name: 'Test Repo', url: 'https://test.com' }])}>
          Add Repository
        </button>
      </div>
    );
  },
}));

// Create a variable to store the onMetaDataStandardsChange callback
let capturedOnMetaDataStandardsChange: ((standards: any[]) => void) | null = null;

jest.mock('@/components/QuestionAdd/MetaDataStandards', () => ({
  __esModule: true,
  default: ({ handleToggleMetaDataStandards, onMetaDataStandardsChange }: { handleToggleMetaDataStandards: (value: boolean) => void; onMetaDataStandardsChange: (standards: { id: string; name: string; url: string }[]) => void; }) => {
    // Capture the callback for use in tests
    capturedOnMetaDataStandardsChange = onMetaDataStandardsChange;
    return (
      <div data-testid="metadata-standards">
        <button onClick={() => handleToggleMetaDataStandards(true)}>
          Toggle MetaData Standards
        </button>
        <button onClick={() => onMetaDataStandardsChange([{ id: '1', name: 'Test Standard', url: 'https://test.com' }])}>
          Add MetaData Standard
        </button>
      </div>
    );
  },
}));

jest.mock('@/components/QuestionAdd/OutputTypeField', () => ({
  __esModule: true,
  default: ({ onModeChange, onAddCustomType, onRemoveCustomType, newOutputType, setNewOutputType }: { onModeChange: (mode: string) => void; onAddCustomType: () => void; onRemoveCustomType: (type: string) => void; newOutputType: { type: string; description: string }; setNewOutputType: (type: { type: string; description: string }) => void; }) => (
    <div data-testid="output-type-field">
      <input
        data-testid="new-output-type-input"
        value={newOutputType.type}
        onChange={(e) => setNewOutputType({ ...newOutputType, type: e.target.value })}
        placeholder="Enter new output type"
      />
      <button onClick={() => onModeChange('mine')}>Change Mode to Mine</button>
      <button onClick={() => onAddCustomType()}>Add Custom Type</button>
      <button onClick={() => onRemoveCustomType('Test Type')}>Remove Custom Type</button>
    </div>
  ),
}));

jest.mock('@/components/QuestionAdd/LicenseField', () => ({
  __esModule: true,
  default: ({ onModeChange, onAddCustomType, onRemoveCustomType, newLicenseType, setNewLicenseType }: { onModeChange: (mode: string) => void; onAddCustomType: () => void; onRemoveCustomType: (type: string) => void; newLicenseType: string; setNewLicenseType: (type: string) => void; }) => (
    <div data-testid="license-field">
      <input
        data-testid="new-license-type-input"
        value={newLicenseType}
        onChange={(e) => setNewLicenseType(e.target.value)}
        placeholder="Enter new license type"
      />
      <button onClick={() => onModeChange('addToDefaults')}>Change Mode to Add To Defaults</button>
      <button onClick={() => onAddCustomType()}>Add Custom License</button>
      <button onClick={() => onRemoveCustomType('Test License')}>Remove Custom License</button>
    </div>
  ),
  otherLicenses: [
    { id: 'MIT', name: 'MIT License' },
    { id: 'GPL-3.0', name: 'GNU General Public License v3.0' }
  ],
}));

jest.mock('@/components/QuestionAdd/InitialAccessLevel', () => ({
  __esModule: true,
  default: ({ defaultAccessLevels }: any) => (
    <div data-testid="initial-access-level">
      {/* eslint-disable @typescript-eslint/no-explicit-any */}
      {defaultAccessLevels?.map((level: any, index: number) => (
        <div key={index}>{level.label}</div>
      ))}
    </div>
  ),
}));

jest.mock('next/navigation', () => ({
  useParams: jest.fn(),
  useRouter: jest.fn(),
  useSearchParams: jest.fn()
}))

const mockUseRouter = useRouter as jest.Mock;
const mockSearchParams = useSearchParams as jest.Mock;

if (typeof global.structuredClone !== 'function') {
  global.structuredClone = (val) => JSON.parse(JSON.stringify(val));
}

jest.mock('@/context/ToastContext', () => ({
  useToast: jest.fn(() => ({
    add: jest.fn(),
  })),
}));

// Mock Apollo Client hooks
jest.mock('@apollo/client/react', () => ({
  useQuery: jest.fn(),
}));

// Cast with jest.mocked utility
const mockUseQuery = jest.mocked(useQuery);

const setupMocks = () => {
  // Create stable references OUTSIDE mockImplementation
  const stableQuestionReturn = {
    data: mockQuestionData,
    loading: false,
    error: null,
  };

  const stableLicensesReturn = {
    data: mockLicensesData,
    loading: false,
    error: null,
  };

  const stableDefaultResearchOutputTypesReturn = {
    data: mockDefaultOutputTypesData,
    loading: false,
    error: null,
  };

  mockUseQuery.mockImplementation((document) => {
    if (document === QuestionDocument) {
      return stableQuestionReturn as any;
    }

    if (document === LicensesDocument) {
      return stableLicensesReturn as any;
    }

    if (document === DefaultResearchOutputTypesDocument) {
      return stableDefaultResearchOutputTypesReturn as any;
    }

    return {
      data: null,
      loading: false,
      error: undefined
    };
  });
};
describe("QuestionEditPage", () => {
  let mockRouter;
  beforeEach(() => {
    setupMocks();
    HTMLElement.prototype.scrollIntoView = mockScrollIntoView;
    mockScrollTo();
    const mockTemplateId = 123;
    const mockUseParams = useParams as jest.Mock;

    // Mock the return value of useParams
    mockUseParams.mockReturnValue({ templateId: `${mockTemplateId}`, q_slug: 67 });
    // Mock the search params so `searchParams.get(...)` calls in the
    // component don't throw. Return the researchOutputTable questionType by default.
    mockSearchParams.mockReturnValue({
      get: (key: string) => {
        const params: Record<string, string> = { questionType: 'researchOutputTable' };
        return params[key] || null;
      },
    } as unknown as ReturnType<typeof useSearchParams>);
    mockUseRouter.mockReturnValue({
      push: jest.fn(),
    });


    // Mock window.tinymce
    window.tinymce = {
      init: jest.fn(),
      remove: jest.fn(),
    };


    // Mock the router
    mockRouter = { push: jest.fn() };
    (useRouter as jest.Mock).mockReturnValue(mockRouter);

    (updateQuestionAction as jest.Mock).mockResolvedValue({
      success: true,
      data: {
        errors: {
          id: 3699,
          guidanceText: "<p>Research output guidance</p>",
          errors: {
            general: null,
            questionText: null
          },
          isDirty: true,
          required: false,
          json: RESEARCH_OUTPUT_TABLE_JSON,
          requirementText: "<p>Research Output requirements</p>",
          sampleText: "",
          useSampleTextAsDefault: false,
          sectionId: 300,
          templateId: 73,
          questionText: "Research Output question"
        },
      }
    });

    (removeQuestionAction as jest.Mock).mockResolvedValue({
      success: true,
      data: {
        id: 3699,
        errors: {
          general: null,
          guidanceText: null,
          json: null,
          questionText: null,
          requirementText: null,
          sampleText: null
        }
      }
    });
  });

  it("should render correct fields and content", async () => {

    const mockQuestionTextArea = {
      data: mockQuestionDataForTextArea,
      loading: false,
      error: undefined
    };
    mockUseQuery.mockImplementation((document) => {
      if (document === QuestionDocument) {
        return mockQuestionTextArea as any;
      }
      return {
        data: null,
        loading: false,
        error: undefined
      };
    });

    // Render with text question type
    (useSearchParams as jest.MockedFunction<typeof useSearchParams>).mockImplementation(() => {
      return {
        get: (key: string) => {
          const params: Record<string, string> = { questionTypeId: 'textArea' };
          return params[key] || null;
        },
        getAll: () => [],
        has: (key: string) => key in { questionTypeId: 'textArea' },
        keys() { },
        values() { },
        entries() { },
        forEach() { },
        toString() { return ''; },
      } as unknown as ReturnType<typeof useSearchParams>;
    });

    await act(async () => {
      render(
        <QuestionEdit />
      );
    });

    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveTextContent('title');
    const editQuestionTab = screen.getByRole('tab', { name: 'tabs.editQuestion' });
    expect(editQuestionTab).toBeInTheDocument();
    const editOptionsTab = screen.getByRole('tab', { name: 'tabs.options' });
    expect(editOptionsTab).toBeInTheDocument();
    const editLogicTab = screen.getByRole('tab', { name: 'tabs.logic' });
    expect(editLogicTab).toBeInTheDocument();
    const questionTypeLabel = screen.getByText(/labels.type/i);
    expect(questionTypeLabel).toBeInTheDocument();
    const questionTextLabel = screen.getByText(/labels.questionText/i);
    expect(questionTextLabel).toBeInTheDocument();
    const questionRequirementTextLabel = screen.getByText(/labels.requirementText/i);
    expect(questionRequirementTextLabel).toBeInTheDocument();
    const questionGuidanceTextLabel = screen.getByText(/labels.guidanceText/i);
    expect(questionGuidanceTextLabel).toBeInTheDocument();
    const questionSampleTextLabel = screen.getByText(/labels.sampleText/i);
    expect(questionSampleTextLabel).toBeInTheDocument();
    const sidebarHeading = screen.getByRole('heading', { name: /headings.preview/i });
    expect(sidebarHeading).toBeInTheDocument();
    expect(sidebarHeading).toHaveTextContent('headings.preview');
    const bestPracticeHeading = screen.getByRole('heading', { level: 3 });
    expect(bestPracticeHeading).toHaveTextContent('headings.bestPractice');
    const sidebarPara1 = screen.getByText('descriptions.previewText', { selector: 'p' });
    expect(sidebarPara1).toBeInTheDocument();
    const bestPracticePara1 = screen.getByText('descriptions.bestPracticePara1', { selector: 'p' });
    expect(bestPracticePara1).toBeInTheDocument();
    const bestPracticePara2 = screen.getByText('descriptions.bestPracticePara2', { selector: 'p' });
    expect(bestPracticePara2).toBeInTheDocument();
    const bestPracticePara3 = screen.getByText('descriptions.bestPracticePara3', { selector: 'p' });
    expect(bestPracticePara3).toBeInTheDocument();

    // Marking question as required should include the 'yes' and 'no' radio buttons
    expect(screen.getByText('form.yesLabel')).toBeInTheDocument();
    expect(screen.getByText('form.noLabel')).toBeInTheDocument();
  });

  it("should set question.required to \'true\' when user selects the \'yes\' radio button", async () => {
    const mockQuestionTextArea = {
      data: {
        question: {
          ...mockRadioQuestion.question,
          required: true, // <-- ensure this is present
        }
      },
      loading: false,
      error: undefined,
    };
    mockUseQuery.mockImplementation((document) => {
      if (document === QuestionDocument) {
        return mockQuestionTextArea as any;
      }
      return {
        data: null,
        loading: false,
        error: undefined
      };
    });

    (useSearchParams as jest.MockedFunction<typeof useSearchParams>).mockImplementation(() => {
      return {
        get: (key: string) => {
          const params: Record<string, string> = { questionType: 'radioButtons' };
          return params[key] || null;
        },
        getAll: () => [],
        has: (key: string) => key in { questionType: 'radioButtons' },
        keys() { },
        values() { },
        entries() { },
        forEach() { },
        toString() { return ''; },
      } as unknown as ReturnType<typeof useSearchParams>;
    });

    render(
      <QuestionEdit />
    );

    await waitFor(() => {
      expect(screen.getByText('breadcrumbs.home')).toBeInTheDocument();
    })

    // Get the radio buttons by their role and value
    const yesRadio = screen.getByRole('radio', { name: 'form.yesLabel' });
    const noRadio = screen.getByRole('radio', { name: 'form.noLabel' });

    expect(yesRadio).toBeChecked();
    // Click the radio button
    fireEvent.click(noRadio);

    // Submit form
    const saveButton = screen.getByText('buttons.saveAndUpdate');
    expect(saveButton).toBeInTheDocument();

    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(updateQuestionAction).toHaveBeenCalledWith({
        questionId: 67,
        displayOrder: 17,
        json: '{\"type\":\"radioButtons\",\"attributes\":{},\"meta\":{\"schemaVersion\":\"1.0\"},\"options\":[{\"label\":\"Yes\",\"value\":\"Yes\",\"selected\":true},{\"label\":\"No\",\"value\":\"No\",\"selected\":false},{\"label\":\"Maybe\",\"value\":\"Maybe\",\"selected\":false}]}',
        questionText: "Testing",
        requirementText: "This is requirement text",
        guidanceText: "This is the guidance text",
        sampleText: "This is sample text",
        useSampleTextAsDefault: false,
        required: false
      })
    });
  });

  it('should display error when no value is entered in question Text field', async () => {

    // Render with text question type
    (useSearchParams as jest.MockedFunction<typeof useSearchParams>).mockImplementation(() => {
      return {
        get: (key: string) => {
          const params: Record<string, string> = { questionTypeId: 'text' };
          return params[key] || null;
        },
        getAll: () => [],
        has: (key: string) => key in { questionTypeId: 'text' },
        keys() { },
        values() { },
        entries() { },
        forEach() { },
        toString() { return ''; },
      } as unknown as ReturnType<typeof useSearchParams>;
    });

    await act(async () => {
      render(
        <QuestionEdit />
      );
    });

    // Get the input
    const input = screen.getByLabelText(/labels.questionText/i);

    // Set value to empty
    fireEvent.change(input, { target: { value: '' } });

    const saveButton = screen.getByRole('button', { name: /buttons.save/i });
    fireEvent.click(saveButton);

    const errorMessage = screen.getByText('messages.errors.questionTextRequired');
    expect(errorMessage).toBeInTheDocument();
  })

  it('should redirect to Question Types page when user clicks the \'Change type\' button', async () => {
    // Render with text question type
    (useSearchParams as jest.MockedFunction<typeof useSearchParams>).mockImplementation(() => {
      return {
        get: (key: string) => {
          const params: Record<string, string> = { questionTypeId: 'textArea' };
          return params[key] || null;
        },
        getAll: () => [],
        has: (key: string) => key in { questionTypeId: 'textArea' },
        keys() { },
        values() { },
        entries() { },
        forEach() { },
        toString() { return ''; },
      } as unknown as ReturnType<typeof useSearchParams>;
    });

    await act(async () => {
      render(
        <QuestionEdit />
      );
    });
    // Get the 'Change type' button and simulate a click
    const changeTypeButton = screen.getByRole('button', { name: /buttons.changeType/i });
    fireEvent.click(changeTypeButton);

    // Verify that router redirects to question types page
    expect(mockRouter.push).toHaveBeenCalledWith('/en-US/template/123/q/new?section_id=67&step=1&questionId=67');
  })

  it('should call the updateQuestionAction when user clicks \'save\' button', async () => {
    const mockQuestionTextArea = {
      data: mockQuestionDataForTextField,
      loading: false,
      error: undefined,
    };
    mockUseQuery.mockImplementation((document) => {
      if (document === QuestionDocument) {
        return mockQuestionTextArea as any;
      }
      return {
        data: null,
        loading: false,
        error: undefined
      };
    });

    // Render with text question type
    (useSearchParams as jest.MockedFunction<typeof useSearchParams>).mockImplementation(() => {
      return {
        get: (key: string) => {
          const params: Record<string, string> = { questionTypeId: 'text' };
          return params[key] || null;
        },
        getAll: () => [],
        has: (key: string) => key in { questionTypeId: 'text' },
        keys() { },
        values() { },
        entries() { },
        forEach() { },
        toString() { return ''; },
      } as unknown as ReturnType<typeof useSearchParams>;
    });

    await act(async () => {
      render(
        <QuestionEdit />
      );
    });

    const input = screen.getByLabelText(/labels.questionText/i);

    // Set required QuestionType value
    fireEvent.change(input, { target: { value: 'Testing' } });


    const saveButton = screen.getByText('buttons.saveAndUpdate');
    expect(saveButton).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(saveButton);
    });

    await waitFor(() => {
      expect(updateQuestionAction).toHaveBeenCalledWith({
        questionId: 67,
        displayOrder: 17,
        json: '{"type":"text","attributes":{"maxLength":1000,"minLength":0,"pattern":"^.+$"},"meta":{"schemaVersion":"1.0"}}',
        questionText: 'Testing',
        requirementText: 'This is requirement text',
        guidanceText: 'This is the guidance text',
        sampleText: 'This is sample text',
        useSampleTextAsDefault: false,
        required: false
      },
      );
    });
    await waitFor(() => {

      // Should redirect to Edit Template page
      expect(mockRouter.push).toHaveBeenCalledWith(routePath('template.show', { templateId: '123' }));
    });
  })

  it('should not display the useSampleTextAsDefault checkbox if the questionTypeId is Radio Button field', async () => {
    const mockQuestionTextArea = {
      data: mockRadioQuestion,
      loading: false,
      error: undefined,
    };
    mockUseQuery.mockImplementation((document) => {
      if (document === QuestionDocument) {
        return mockQuestionTextArea as any;
      }
      return {
        data: null,
        loading: false,
        error: undefined
      };
    });

    // Render with text question type
    (useSearchParams as jest.MockedFunction<typeof useSearchParams>).mockImplementation(() => {
      return {
        get: (key: string) => {
          const params: Record<string, string> = { questionTypeId: 'radioButtons' };
          return params[key] || null;
        },
        getAll: () => [],
        has: (key: string) => key in { questionTypeId: 'radioButtons' },
        keys() { },
        values() { },
        entries() { },
        forEach() { },
        toString() { return ''; },
      } as unknown as ReturnType<typeof useSearchParams>;
    });

    await act(async () => {
      render(
        <QuestionEdit />
      );
    });

    const checkboxText = screen.queryByText('descriptions.sampleTextAsDefault');
    expect(checkboxText).not.toBeInTheDocument();
  })

  it('should display the useSampleTextAsDefault checkbox if the questionTypeId is for a textArea field', async () => {

    // Render with text question type
    (useSearchParams as jest.MockedFunction<typeof useSearchParams>).mockImplementation(() => {
      return {
        get: (key: string) => {
          const params: Record<string, string> = { questionTypeId: 'textArea' };
          return params[key] || null;
        },
        getAll: () => [],
        has: (key: string) => key in { questionTypeId: 'textArea' },
        keys() { },
        values() { },
        entries() { },
        forEach() { },
        toString() { return ''; },
      } as unknown as ReturnType<typeof useSearchParams>;
    });

    const mockQuestionTextArea = {
      data: mockQuestionDataForTextArea,
      loading: false,
      error: undefined,
    };
    mockUseQuery.mockImplementation((document) => {
      if (document === QuestionDocument) {
        return mockQuestionTextArea as any;
      }
      return {
        data: null,
        loading: false,
        error: undefined
      };
    });

    await act(async () => {
      render(
        <QuestionEdit />
      );
    });

    const sampleTextField = screen.queryByText('descriptions.sampleTextAsDefault');
    expect(sampleTextField).toBeInTheDocument();
  })

  it('should not display the useSampleTextAsDefault checkbox if the questionTypeId is for a text field', async () => {
    // Render with text question type
    (useSearchParams as jest.MockedFunction<typeof useSearchParams>).mockImplementation(() => {
      return {
        get: (key: string) => {
          const params: Record<string, string> = { questionTypeId: 'text' };
          return params[key] || null;
        },
        getAll: () => [],
        has: (key: string) => key in { questionTypeId: 'text' },
        keys() { },
        values() { },
        entries() { },
        forEach() { },
        toString() { return ''; },
      } as unknown as ReturnType<typeof useSearchParams>;
    });


    const mockQuestionTextArea = {
      data: mockQuestionDataForTextField,
      loading: false,
      error: undefined,
    };
    mockUseQuery.mockImplementation((document) => {
      if (document === QuestionDocument) {
        return mockQuestionTextArea as any;
      }
      return {
        data: null,
        loading: false,
        error: undefined
      };
    });

    await act(async () => {
      render(
        <QuestionEdit />
      );
    });

    const questionSampleTextLabel = screen.queryByText(/labels.sampleText/i);
    expect(questionSampleTextLabel).not.toBeInTheDocument();
  })

  it("should call handleRangeLabelChange for dateRange question type", async () => {
    const mockQuestionTextArea = {
      data: mockQuestionDataForDateRange,
      loading: false,
      error: undefined,
    };
    mockUseQuery.mockImplementation((document) => {
      if (document === QuestionDocument) {
        return mockQuestionTextArea as any;
      }
      return {
        data: null,
        loading: false,
        error: undefined
      };
    });

    // Render with text question type
    (useSearchParams as jest.MockedFunction<typeof useSearchParams>).mockImplementation(() => {
      return {
        get: (key: string) => {
          const params: Record<string, string> = { questionTypeId: 'dateRange' };
          return params[key] || null;
        },
        getAll: () => [],
        has: (key: string) => key in { questionTypeId: 'dateRange' },
        keys() { },
        values() { },
        entries() { },
        forEach() { },
        toString() { return ''; },
      } as unknown as ReturnType<typeof useSearchParams>;
    });

    await act(async () => {
      render(
        <QuestionEdit />
      );
    });
    // Find the input rendered by RangeComponent
    const rangeStartInput = screen.getByLabelText(/range start/i);

    // Simulate user typing
    fireEvent.change(rangeStartInput, { target: { value: 'New Range Label' } });

    expect(rangeStartInput).toHaveValue('New Range Label');

  });

  it("should call handleRangeLabelChange for number range question type", async () => {
    const mockQuestionTextArea = {
      data: mockQuestionDataForNumberRange,
      loading: false,
      error: undefined,
    };
    mockUseQuery.mockImplementation((document) => {
      if (document === QuestionDocument) {
        return mockQuestionTextArea as any;
      }
      return {
        data: null,
        loading: false,
        error: undefined
      };
    });

    // Render with text question type
    (useSearchParams as jest.MockedFunction<typeof useSearchParams>).mockImplementation(() => {
      return {
        get: (key: string) => {
          const params: Record<string, string> = { questionTypeId: 'numberRange' };
          return params[key] || null;
        },
        getAll: () => [],
        has: (key: string) => key in { questionTypeId: 'numberRange' },
        keys() { },
        values() { },
        entries() { },
        forEach() { },
        toString() { return ''; },
      } as unknown as ReturnType<typeof useSearchParams>;
    });

    await act(async () => {
      render(
        <QuestionEdit />
      );
    });
    // Find the input rendered by RangeComponent
    const rangeStartInput = screen.getByLabelText(/range start/i);

    // Simulate user typing
    fireEvent.change(rangeStartInput, { target: { value: '2' } });

    expect(rangeStartInput).toHaveValue('2');

  });

  it("should call handleTypeAheadSearchLabelChange for affiliationSearch question type", async () => {
    const mockQuestionTextArea = {
      data: mockQuestionDataForTypeAheadSearch,
      loading: false,
      error: undefined,
    };
    mockUseQuery.mockImplementation((document) => {
      if (document === QuestionDocument) {
        return mockQuestionTextArea as any;
      }
      return {
        data: null,
        loading: false,
        error: undefined
      };
    });

    // Render with text affiliation search type
    (useSearchParams as jest.MockedFunction<typeof useSearchParams>).mockImplementation(() => {
      return {
        get: (key: string) => {
          const params: Record<string, string> = { questionTypeId: 'affiliationSearch' };
          return params[key] || null;
        },
        getAll: () => [],
        has: (key: string) => key in { questionTypeId: 'affiliationSearch' },
        keys() { },
        values() { },
        entries() { },
        forEach() { },
        toString() { return ''; },
      } as unknown as ReturnType<typeof useSearchParams>;
    });

    await act(async () => {
      render(
        <QuestionEdit />
      );
    });

    // Find the label input rendered by AffiliationSearch
    const labelInput = screen.getByPlaceholderText('Enter search label');

    // Simulate user typing
    fireEvent.change(labelInput, { target: { value: 'New Institution Label' } });

    expect(labelInput).toHaveValue('New Institution Label');

  });

  it("should call handleTypeAheadHelpTextChange for affiliationSearch question type", async () => {

    const mockQuestionTextArea = {
      data: mockQuestionDataForTypeAheadSearch,
      loading: false,
      error: undefined,
    };
    mockUseQuery.mockImplementation((document) => {
      if (document === QuestionDocument) {
        return mockQuestionTextArea as any;
      }
      return {
        data: null,
        loading: false,
        error: undefined
      };
    });

    // Render with text question type
    (useSearchParams as jest.MockedFunction<typeof useSearchParams>).mockImplementation(() => {
      return {
        get: (key: string) => {
          const params: Record<string, string> = { questionTypeId: 'affiliationSearch' };
          return params[key] || null;
        },
        getAll: () => [],
        has: (key: string) => key in { questionTypeId: 'affiliationSearch' },
        keys() { },
        values() { },
        entries() { },
        forEach() { },
        toString() { return ''; },
      } as unknown as ReturnType<typeof useSearchParams>;
    });

    await act(async () => {
      render(
        <QuestionEdit />
      );
    });
    // Find the label input rendered by AffiliationSearch
    const helpTextInput = screen.getByPlaceholderText('Enter the help text you want to display');

    // Simulate user typing
    fireEvent.change(helpTextInput, { target: { value: 'Enter a search term' } });

    expect(helpTextInput).toHaveValue('Enter a search term');

  });

  it("should display error if updateQuestionAction rejects", async () => {

    const mockQuestionTextArea = {
      data: mockQuestionDataForNumberRange,
      loading: false,
      error: undefined,
    };
    mockUseQuery.mockImplementation((document) => {
      if (document === QuestionDocument) {
        return mockQuestionTextArea as any;
      }
      return {
        data: null,
        loading: false,
        error: undefined
      };
    });

    (updateQuestionAction as jest.Mock).mockResolvedValue({
      success: false,
      errors: ['There was an error']
    });

    // Render with text question type
    (useSearchParams as jest.MockedFunction<typeof useSearchParams>).mockImplementation(() => {
      return {
        get: (key: string) => {
          const params: Record<string, string> = { questionTypeId: 'textArea' };
          return params[key] || null;
        },
        getAll: () => [],
        has: (key: string) => key in { questionTypeId: 'textArea' },
        keys() { },
        values() { },
        entries() { },
        forEach() { },
        toString() { return ''; },
      } as unknown as ReturnType<typeof useSearchParams>;
    });

    await act(async () => {
      render(
        <QuestionEdit />
      );
    });
    // Get the input
    const input = screen.getByLabelText(/labels.questionText/i);

    // Set value to 'New Question'
    fireEvent.change(input, { target: { value: 'New Question' } });

    const saveButton = screen.getByRole('button', { name: /buttons.saveAndUpdate/i });
    await act(async () => {
      fireEvent.click(saveButton);
    });

    expect(screen.getByText('There was an error')).toBeInTheDocument();
  });

  it('should call logECS if call to getParsedQuestionJSON returns error', async () => {
    const mockGetParsed = getParsedJSONModule.getParsedQuestionJSON as jest.Mock;

    // temporarily override return value
    mockGetParsed.mockReturnValueOnce({
      parsed: null,
      error: 'Mocked parse error',
    });

    const mockQuestionTextArea = {
      data: mockQuestionDataForTextField,
      loading: false,
      error: undefined,
    };
    mockUseQuery.mockImplementation((document) => {
      if (document === QuestionDocument) {
        return mockQuestionTextArea as any;
      }
      return {
        data: null,
        loading: false,
        error: undefined
      };
    });

    // Render with text question type
    (useSearchParams as jest.MockedFunction<typeof useSearchParams>).mockImplementation(() => {
      return {
        get: (key: string) => {
          const params: Record<string, string> = { questionTypeId: 'textArea' };
          return params[key] || null;
        },
        getAll: () => [],
        has: (key: string) => key in { questionTypeId: 'textArea' },
        keys() { },
        values() { },
        entries() { },
        forEach() { },
        toString() { return ''; },
      } as unknown as ReturnType<typeof useSearchParams>;
    });

    await act(async () => {
      render(
        <QuestionEdit />
      );
    });

    // Expect logECS to be called
    await waitFor(() => {
      expect(logECS).toHaveBeenCalledWith(
        'error',
        'Parsing error',
        expect.objectContaining({
          error: expect.anything(),
          url: { path: '/en-US/template/123/q/67' },
        })
      );
    });
  });

  it('should set question to filtered question when user passes in questionTypeIdQueryParam', async () => {
    const mockQuestionTextArea = {
      data: mockQuestionDataForDateRange,
      loading: false,
      error: undefined,
    };
    mockUseQuery.mockImplementation((document) => {
      if (document === QuestionDocument) {
        return mockQuestionTextArea as any;
      }
      return {
        data: null,
        loading: false,
        error: undefined
      };
    });

    // Render with text question type
    (useSearchParams as jest.MockedFunction<typeof useSearchParams>).mockImplementation(() => {
      return {
        get: (key: string) => {
          const params: Record<string, string> = { questionType: 'dateRange' };
          return params[key] || null;
        },
        getAll: () => [],
        has: (key: string) => key in { questionType: 'short_text' },
        keys() { },
        values() { },
        entries() { },
        forEach() { },
        toString() { return ''; },
      } as unknown as ReturnType<typeof useSearchParams>;
    });

    await act(async () => {
      render(
        <QuestionEdit />
      );
    });

    await waitFor(() => {
      expect(screen.getByText('Starting Label')).toBeInTheDocument();
      expect(screen.getByText('Ending Label')).toBeInTheDocument();
    });
  });

  it('should set error when parsing fails for getMatchingQuestionType', async () => {
    const mockGetParsed = getParsedJSONModule.getParsedQuestionJSON as jest.Mock;

    // 1. First render sets parsedQuestionJSON
    mockGetParsed.mockReturnValueOnce({
      parsed: { type: 'dateRange' },
      error: null,
    });

    // 2. On second invocation (triggered by form submit), it fails
    mockGetParsed.mockReturnValueOnce({
      parsed: null,
      error: 'Failed to parse during submit',
    });

    const mockQuestionTextArea = {
      data: mockQuestionDataForDateRange,
      loading: false,
      error: undefined,
    };
    mockUseQuery.mockImplementation((document) => {
      if (document === QuestionDocument) {
        return mockQuestionTextArea as any;
      }
      return {
        data: null,
        loading: false,
        error: undefined
      };
    });

    // Render with text question type
    (useSearchParams as jest.MockedFunction<typeof useSearchParams>).mockImplementation(() => {
      return {
        get: (key: string) => {
          const params: Record<string, string> = { questionType: 'dateRange' };
          return params[key] || null;
        },
        getAll: () => [],
        has: (key: string) => key in { questionType: 'short_text' },
        keys() { },
        values() { },
        entries() { },
        forEach() { },
        toString() { return ''; },
      } as unknown as ReturnType<typeof useSearchParams>;
    });

    await act(async () => {
      render(
        <QuestionEdit />
      );
    });

    await waitFor(() => {
      expect(screen.getByText('Failed to parse during submit')).toBeInTheDocument();
    });
  });

  it('should call logECS if useQuestionQuery graphql query returns an error ', async () => {
    const mockQuestionTextArea = {
      data: null,
      loading: false,
      error: { message: 'There was an error when calling useQuestionQuery' },
    };
    mockUseQuery.mockImplementation((document) => {
      if (document === QuestionDocument) {
        return mockQuestionTextArea as any;
      }
      return {
        data: null,
        loading: false,
        error: undefined
      };
    });

    // Render with text question type
    (useSearchParams as jest.MockedFunction<typeof useSearchParams>).mockImplementation(() => {
      return {
        get: (key: string) => {
          const params: Record<string, string> = { questionTypeId: 'affiliationSearch' };
          return params[key] || null;
        },
        getAll: () => [],
        has: (key: string) => key in { questionTypeId: 'affiliationSearch' },
        keys() { },
        values() { },
        entries() { },
        forEach() { },
        toString() { return ''; },
      } as unknown as ReturnType<typeof useSearchParams>;
    });

    await act(async () => {
      render(
        <QuestionEdit />
      );
    });

    // Expect logECS to be called
    await waitFor(() => {
      expect(logECS).toHaveBeenCalledWith(
        'error',
        'Parsing error',
        expect.objectContaining({
          error: expect.anything(),
          url: { path: '/en-US/template/123/q/67' },
        })
      );
    });
  });

  it('should pass axe accessibility test', async () => {
    // Render with text question type
    (useSearchParams as jest.MockedFunction<typeof useSearchParams>).mockImplementation(() => {
      return {
        get: (key: string) => {
          const params: Record<string, string> = { questionTypeId: 'checkBoxes' };
          return params[key] || null;
        },
        getAll: () => [],
        has: (key: string) => key in { questionTypeId: 'checkBoxes' },
        keys() { },
        values() { },
        entries() { },
        forEach() { },
        toString() { return ''; },
      } as unknown as ReturnType<typeof useSearchParams>;
    });

    const { container } = render(
      <QuestionEdit />
    );
    await act(async () => {
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe.each([
    {
      questionType: "text",
      mockData: mockQuestionDataForTextField,
      expectedJson: {
        type: "text",
        attributes: {
          maxLength: 1000,
          minLength: 0,
          pattern: "^.+$",
        },
        meta: {
          schemaVersion: "1.0"
        },
      }
    },
    {
      questionType: "textArea",
      mockData: mockQuestionDataForTextArea,
      expectedJson: {
        type: "textArea",
        attributes: {
          asRichText: true,
          cols: 20,
          rows: 20,
          maxLength: 1000,
          minLength: 0,
        },
        meta: {
          schemaVersion: "1.0",
        },
      },
    },
    {
      questionType: "number",
      mockData: mockQuestionDataForNumber,
      expectedJson: {
        type: "number",
        attributes: {
          min: 0,
          max: 10000000,
          step: 1,
        },
        meta: {
          schemaVersion: "1.0",
        },
      },
    },
    {
      questionType: "currency",
      mockData: mockQuestionDataForCurrency,
      expectedJson: {
        type: "currency",
        attributes: {
          denomination: "USD",
          min: 0,
          max: 10000000,
          step: 0.01
        },
        meta: {
          schemaVersion: "1.0",
        }

      },
    },
    {
      questionType: "url",
      mockData: mockQuestionDataForURL,
      expectedJson: {
        type: "url",
        attributes: {
          maxLength: 2048,
          minLength: 2,
          pattern: "https?://.+",
        },
        meta: {
          schemaVersion: "1.0",
        },
      },
    },
  ])("QuestionEditPage - $questionType", ({ questionType, mockData }) => {

    it(`should call updateQuestionAction with correct JSON for ${questionType}`, async () => {
      const mockQuestionTextArea = {
        data: mockData,
        loading: false,
        error: undefined,
      };
      mockUseQuery.mockImplementation((document) => {
        if (document === QuestionDocument) {
          return mockQuestionTextArea as any;
        }
        return {
          data: null,
          loading: false,
          error: undefined
        };
      });

      (useSearchParams as jest.MockedFunction<typeof useSearchParams>).mockImplementation(() => {
        return {
          get: (key: string) => {
            const params: Record<string, string> = { questionType };
            return params[key] || null;
          },
          getAll: () => [],
          has: (key: string) => key in { questionType },
          keys() { },
          values() { },
          entries() { },
          forEach() { },
          toString() {
            return "";
          },
        } as unknown as ReturnType<typeof useSearchParams>;
      });

      await act(async () => {
        render(<QuestionEdit />);
      });

      const saveButton = screen.getByText("buttons.saveAndUpdate");
      expect(saveButton).toBeInTheDocument();

      await act(async () => {
        fireEvent.click(saveButton);
      });
      await waitFor(() => {
        expect(updateQuestionAction).toHaveBeenCalledWith({
          questionId: 67,
          displayOrder: 17,
          json: '{"type":"text","attributes":{"maxLength":1000,"minLength":0,"pattern":"^.+$"},"meta":{"schemaVersion":"1.0"}}',
          questionText: 'Testing',
          requirementText: 'This is requirement text',
          guidanceText: 'This is the guidance text',
          sampleText: 'This is sample text',
          useSampleTextAsDefault: false,
          required: false
        },
        );
      });
    });
  });
});

describe('QuestionEditPage Delete Functionality', () => {
  let mockRouter;
  beforeEach(() => {
    HTMLElement.prototype.scrollIntoView = mockScrollIntoView;
    mockScrollTo();
    const mockTemplateId = 123;
    const mockUseParams = useParams as jest.Mock;

    // Mock the return value of useParams
    mockUseParams.mockReturnValue({ templateId: `${mockTemplateId}`, q_slug: 67 });

    mockUseRouter.mockReturnValue({
      push: jest.fn(),
    });

    // Mock window.tinymce
    window.tinymce = {
      init: jest.fn(),
      remove: jest.fn(),
    };

    // Mock the router
    mockRouter = { push: jest.fn() };
    (useRouter as jest.Mock).mockReturnValue(mockRouter);

    (updateQuestionAction as jest.Mock).mockResolvedValue({
      success: true,
      data: {
        errors: {
          id: 3699,
          guidanceText: "<p>Research output guidance</p>",
          errors: {
            general: null,
            questionText: null
          },
          isDirty: true,
          required: false,
          json: RESEARCH_OUTPUT_TABLE_JSON,
          requirementText: "<p>Research Output requirements</p>",
          sampleText: "",
          useSampleTextAsDefault: false,
          sectionId: 300,
          templateId: 73,
          questionText: "Research Output question"
        },
      }
    });

    (removeQuestionAction as jest.Mock).mockResolvedValue({
      success: true,
      data: {
        id: 3699,
        errors: {
          general: null,
          guidanceText: null,
          json: null,
          questionText: null,
          requirementText: null,
          sampleText: null
        }
      }
    });


    // Render with radio button question type
    (useSearchParams as jest.MockedFunction<typeof useSearchParams>).mockImplementation(() => {
      return {
        get: (key: string) => {
          const params: Record<string, string> = { questionTypeId: 'checkBoxes' };
          return params[key] || null;
        },
        getAll: () => [],
        has: (key: string) => key in { questionTypeId: 'checkBoxes' },
        keys() { },
        values() { },
        entries() { },
        forEach() { },
        toString() { return ''; },
      } as unknown as ReturnType<typeof useSearchParams>;
    });

    (useToast as jest.Mock).mockReturnValue({ add: jest.fn() });
  });

  it('should render the delete button', () => {
    render(<QuestionEdit />);
    expect(screen.getByText('buttons.deleteQuestion')).toBeInTheDocument();
  });

  it('should open the confirmation dialog on delete button click', async () => {
    render(<QuestionEdit />);
    const deleteButton = screen.getByText('buttons.deleteQuestion');
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(screen.getByText('headings.confirmDelete')).toBeInTheDocument();
    });
    expect(screen.getByText('buttons.confirm')).toBeInTheDocument();
    expect(screen.getByText('buttons.cancel')).toBeInTheDocument();
  });

  it('should call the removeQuestionAction and redirect when confirm is clicked', async () => {
    (removeQuestionAction as jest.Mock).mockResolvedValue({
      success: true,
      data: {
        id: 3699,
        errors: {
          general: null,
          guidanceText: null,
          json: null,
          questionText: null,
          requirementText: null,
          sampleText: null
        }
      }
    });
    render(<QuestionEdit />);
    fireEvent.click(screen.getByText('buttons.deleteQuestion'));

    await waitFor(() => {
      expect(screen.getByText('headings.confirmDelete')).toBeInTheDocument();
    });

    const confirmButton = screen.getByText('buttons.confirm');
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(removeQuestionAction).toHaveBeenCalledWith({
        questionId: 67,
      });
      expect(mockRouter.push).toHaveBeenCalledWith(routePath('template.show', { templateId: '123' }));
    });
  });

  it('should display error message when removeQuestionMutation returns an error', async () => {

    (removeQuestionAction as jest.Mock).mockResolvedValue({
      success: false,
      errors: ['There was an error removing the question']
    });

    // Render with radio button question type
    (useSearchParams as jest.MockedFunction<typeof useSearchParams>).mockImplementation(() => {
      return {
        get: (key: string) => {
          const params: Record<string, string> = { questionTypeId: 'checkBoxes' };
          return params[key] || null;
        },
        getAll: () => [],
        has: (key: string) => key in { questionTypeId: 'checkBoxes' },
        keys() { },
        values() { },
        entries() { },
        forEach() { },
        toString() { return ''; },
      } as unknown as ReturnType<typeof useSearchParams>;
    });


    render(<QuestionEdit />);

    // Click the 'Delete question' button
    await act(async () => {
      fireEvent.click(screen.getByText('buttons.deleteQuestion'));
    })

    // Expect to get a confirmation screen
    expect(screen.getByText('headings.confirmDelete')).toBeInTheDocument();

    const confirmButton = screen.getByText('buttons.confirm');

    // Click to confirm deletion
    await act(async () => {
      fireEvent.click(confirmButton);
    })

    // Should see error message since removeQuestionAction returns an error
    expect(screen.getByText('There was an error removing the question')).toBeInTheDocument();
  });

  it('should close the dialog when cancel is clicked', async () => {
    render(<QuestionEdit />);
    fireEvent.click(screen.getByText('buttons.deleteQuestion'));

    await waitFor(() => {
      expect(screen.getByText('headings.confirmDelete')).toBeInTheDocument();
    });

    const cancelButton = screen.getByText('buttons.cancel');
    fireEvent.click(cancelButton);

    await waitFor(() => {
      expect(screen.queryByText('headings.confirmDelete')).not.toBeInTheDocument();
    });
  });
});


describe('Options questions', () => {
  let mockRouter;
  beforeEach(() => {
    HTMLElement.prototype.scrollIntoView = mockScrollIntoView;
    mockScrollTo();
    const mockTemplateId = 123;
    const mockUseParams = useParams as jest.Mock;

    // Mock the return value of useParams
    mockUseParams.mockReturnValue({ templateId: `${mockTemplateId}`, q_slug: 67 });

    mockUseRouter.mockReturnValue({
      push: jest.fn(),
    });

    // Mock window.tinymce
    window.tinymce = {
      init: jest.fn(),
      remove: jest.fn(),
    };


    // Mock the router
    mockRouter = { push: jest.fn() };
    (useRouter as jest.Mock).mockReturnValue(mockRouter);

    (updateQuestionAction as jest.Mock).mockResolvedValue({
      success: true,
      data: {
        errors: {
          id: 3699,
          guidanceText: "<p>Research output guidance</p>",
          errors: {
            general: null,
            questionText: null
          },
          isDirty: true,
          required: false,
          json: RESEARCH_OUTPUT_TABLE_JSON,
          requirementText: "<p>Research Output requirements</p>",
          sampleText: "",
          useSampleTextAsDefault: false,
          sectionId: 300,
          templateId: 73,
          questionText: "Research Output question"
        },
      }
    });

    (useToast as jest.Mock).mockReturnValue({ add: jest.fn() });
  });

  it('should load Radio options', async () => {
    const mockQuestionTextArea = {
      data: mockRadioQuestion,
      loading: false,
      error: undefined,
    };
    mockUseQuery.mockImplementation((document) => {
      if (document === QuestionDocument) {
        return mockQuestionTextArea as any;
      }
      return {
        data: null,
        loading: false,
        error: undefined
      };
    });

    // Render with radio button question type
    (useSearchParams as jest.MockedFunction<typeof useSearchParams>).mockImplementation(() => {
      return {
        get: (key: string) => {
          const params: Record<string, string> = { questionTypeId: 'radioButtons' };
          return params[key] || null;
        },
        getAll: () => [],
        has: (key: string) => key in { questionTypeId: 'radioButtons' },
        keys() { },
        values() { },
        entries() { },
        forEach() { },
        toString() { return ''; },
      } as unknown as ReturnType<typeof useSearchParams>;
    });

    await act(async () => {
      render(<QuestionEdit />);
    });

    // Verify that the expected radio buttons appear
    const yesRadio = screen.getByLabelText('form.yesLabel');
    const noRadio = screen.getByLabelText('form.noLabel');

    expect(yesRadio).toBeInTheDocument();
    expect(noRadio).toBeInTheDocument();
    expect(noRadio).toBeChecked();

    // Click the yes option
    await act(async () => {
      fireEvent.click(yesRadio);
    })

    expect(yesRadio).toBeChecked();
    expect(noRadio).not.toBeChecked();
  })

  it('should add a new row when the add button is clicked', async () => {
    const stableQuestionReturn = {
      data: mockRadioQuestion,
      loading: false,
      error: null,
    };

    const stableLicensesReturn = {
      data: mockLicensesData,
      loading: false,
      error: null,
    };

    const stableDefaultResearchOutputTypesReturn = {
      data: mockDefaultOutputTypesData,
      loading: false,
      error: null,
    };

    mockUseQuery.mockImplementation((document) => {
      if (document === QuestionDocument) {
        return stableQuestionReturn as any;
      }

      if (document === LicensesDocument) {
        return stableLicensesReturn as any;
      }

      if (document === DefaultResearchOutputTypesDocument) {
        return stableDefaultResearchOutputTypesReturn as any;
      }

      return {
        data: null,
        loading: false,
        error: undefined
      };
    });

    // Render with radio button question type
    (useSearchParams as jest.MockedFunction<typeof useSearchParams>).mockImplementation(() => {
      return {
        get: (key: string) => {
          const params: Record<string, string> = { questionTypeId: 'checkBoxes' };
          return params[key] || null;
        },
        getAll: () => [],
        has: (key: string) => key in { questionTypeId: 'checkBoxes' },
        keys() { },
        values() { },
        entries() { },
        forEach() { },
        toString() { return ''; },
      } as unknown as ReturnType<typeof useSearchParams>;
    });

    await act(async () => {
      render(<QuestionEdit />);
    });

    const addButton = screen.getByRole('button', { name: /buttons.addRow/i });

    await act(async () => {
      fireEvent.click(addButton);
    })


    const allRows = screen.queryAllByLabelText('Text');
    expect(allRows.length).toBe(3);

    // Enter the label text for new radio button
    fireEvent.change(allRows[2], { target: { value: 'Maybe' } });

    // Get the save button and save
    const saveButton = screen.getByText('buttons.saveAndUpdate');
    expect(saveButton).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(saveButton);
    });

    await waitFor(() => {
      expect(updateQuestionAction).toHaveBeenCalledWith({
        questionId: 67,
        displayOrder: 17,
        json: '{"type":"radioButtons","attributes":{},"meta":{"schemaVersion":"1.0"},"options":[{"label":"Yes","value":"Yes","selected":true},{"label":"No","value":"No","selected":false},{"label":"Maybe","value":"Maybe","selected":false},{"label":"Maybe","value":"Maybe","selected":false}]}',
        questionText: 'Testing',
        requirementText: 'This is requirement text',
        guidanceText: 'This is the guidance text',
        sampleText: 'This is sample text',
        useSampleTextAsDefault: false,
        required: false
      },
      );
    });
  });

  it('should prevent unload when there are unsaved changes and user tries to navigate away from page', async () => {
    // Mock addEventListener
    const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
    const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
    const mockQuestionTextArea = {
      data: mockRadioQuestion,
      loading: false,
      error: undefined,
    };
    mockUseQuery.mockImplementation((document) => {
      if (document === QuestionDocument) {
        return mockQuestionTextArea as any;
      }
      return {
        data: null,
        loading: false,
        error: undefined
      };
    });

    // Render with radio button question type
    (useSearchParams as jest.MockedFunction<typeof useSearchParams>).mockImplementation(() => {
      return {
        get: (key: string) => {
          const params: Record<string, string> = { questionTypeId: 'checkBoxes' };
          return params[key] || null;
        },
        getAll: () => [],
        has: (key: string) => key in { questionTypeId: 'checkBoxes' },
        keys() { },
        values() { },
        entries() { },
        forEach() { },
        toString() { return ''; },
      } as unknown as ReturnType<typeof useSearchParams>;
    });

    await act(async () => {
      render(<QuestionEdit />);
    });

    const addButton = screen.getByRole('button', { name: /buttons.addRow/i });

    await act(async () => {
      fireEvent.click(addButton);
    })

    const allRows = screen.queryAllByLabelText('Text');
    expect(allRows.length).toBe(3);

    // Enter the label text for new radio button
    fireEvent.change(allRows[2], { target: { value: 'Maybe' } });

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

      if (typeof handler === 'function') {
        handler(event as unknown as BeforeUnloadEvent);
      } else if (handler && typeof handler.handleEvent === 'function') {
        handler.handleEvent(event as unknown as BeforeUnloadEvent);
      } else {
        throw new Error('beforeunload handler is not callable');
      }
    });
    // Cleanup
    removeEventListenerSpy.mockRestore();
    addEventListenerSpy.mockRestore();
  });
});

describe("Research Output Question Type - Edit", () => {
  let mockRouter;
  const researchOutputJson = JSON.stringify({
    meta: { schemaVersion: '1.0' },
    type: 'researchOutputTable',
    attributes: {},
    columns: [
      { heading: 'Title', enabled: true, required: true, content: { type: 'text' }, meta: { labelTranslationKey: 'researchOutput.title' } },
      { heading: 'Output Type', enabled: true, content: { type: 'selectBox', options: [{ label: 'Article', value: 'article' }] }, meta: { labelTranslationKey: 'researchOutput.outputType' } },
      { heading: 'Description', enabled: false, content: { type: 'textArea' }, meta: { labelTranslationKey: 'researchOutput.description' } },
    ]
  });

  beforeEach(() => {
    HTMLElement.prototype.scrollIntoView = mockScrollIntoView;
    window.scrollTo = jest.fn();
    const mockTemplateId = 123;
    const mockUseParams = useParams as jest.Mock;

    window.tinymce = { init: jest.fn(), remove: jest.fn() };

    mockUseParams.mockReturnValue({ templateId: `${mockTemplateId}`, q_slug: 67 });

    mockRouter = { push: jest.fn() };
    (useRouter as jest.Mock).mockReturnValue(mockRouter);

    // Ensure useSearchParams returns an object with .get() for these tests
    // Return 'researchOutputTable' for the 'questionType' param by default.
    (useSearchParams as jest.MockedFunction<typeof useSearchParams>).mockImplementation(() => {
      return {
        get: (key: string) => {
          const params: Record<string, string> = { questionType: 'researchOutputTable' };
          return params[key] || null;
        },
        getAll: () => [],
        has: (key: string) => key in { questionType: 'researchOutputTable' },
        keys() { },
        values() { },
        entries() { },
        forEach() { },
        toString() { return ''; },
      } as unknown as ReturnType<typeof useSearchParams>;
    });

    const stableQuestionReturn = {
      data: mockQuestionData,
      loading: false,
      error: null,
    };

    const stableLicensesReturn = {
      data: mockLicensesData,
      loading: false,
      error: null,
    };

    const stableDefaultResearchOutputTypesReturn = {
      data: mockDefaultOutputTypesData,
      loading: false,
      error: null,
    };

    mockUseQuery.mockImplementation((document) => {
      if (document === QuestionDocument) {
        return stableQuestionReturn as any;
      }

      if (document === LicensesDocument) {
        return stableLicensesReturn as any;
      }

      if (document === DefaultResearchOutputTypesDocument) {
        return stableDefaultResearchOutputTypesReturn as any;
      }

      return {
        data: null,
        loading: false,
        error: undefined
      };
    });

    (updateQuestionAction as jest.Mock).mockResolvedValue({
      success: true,
      data: {
        errors: {
          id: 3699,
          guidanceText: "<p>Research output guidance</p>",
          errors: {
            general: null,
            questionText: null
          },
          isDirty: true,
          required: false,
          json: RESEARCH_OUTPUT_TABLE_JSON,
          requirementText: "<p>Research Output requirements</p>",
          sampleText: "",
          useSampleTextAsDefault: false,
          sectionId: 300,
          templateId: 73,
          questionText: "Research Output question"
        },
      }
    });

    (removeQuestionAction as jest.Mock).mockResolvedValue({
      success: true,
      data: {
        id: 3699,
        errors: {
          general: null,
          guidanceText: null,
          json: null,
          questionText: null,
          requirementText: null,
          sampleText: null
        }
      }
    });
  })

  afterEach(() => {
    document.body.innerHTML = '';
    jest.clearAllMocks();
    window.location.hash = '';
  });

  it('should render research output fields when question JSON is researchOutputTable', async () => {
    const mockQuestionTextArea = {
      data: { question: { id: 67, questionText: 'Research Output Table Question', json: researchOutputJson, displayOrder: 1, sectionId: 67, requirementText: '', guidanceText: '', sampleText: '', useSampleTextAsDefault: false, required: false } },
      loading: false,
      error: undefined,
    };
    mockUseQuery.mockImplementation((document) => {
      if (document === QuestionDocument) {
        return mockQuestionTextArea as any;
      }
      return {
        data: null,
        loading: false,
        error: undefined
      };
    });

    await act(async () => {
      render(<QuestionEdit />);
    });

    // Check for research output specific elements
    expect(screen.getByText('researchOutput.headings.enableStandardFields')).toBeInTheDocument();
    expect(screen.getByText('researchOutput.description')).toBeInTheDocument();
    expect(screen.getByText('researchOutput.headings.additionalTextFields')).toBeInTheDocument();

    // Check for standard fields
    expect(screen.getByText('researchOutput.labels.title')).toBeInTheDocument();
    expect(screen.getByText('researchOutput.labels.outputType')).toBeInTheDocument();
    expect(screen.getByText('researchOutput.labels.description')).toBeInTheDocument();
    expect(screen.getByText('researchOutput.labels.dataFlags')).toBeInTheDocument();
    expect(screen.getByText('researchOutput.labels.repositories')).toBeInTheDocument();
    expect(screen.getByText('researchOutput.labels.metadataStandards')).toBeInTheDocument();
    expect(screen.getByText('researchOutput.labels.licenses')).toBeInTheDocument();
  });

  it('should show tooltip for required fields', async () => {
    const mockQuestionTextArea = {
      data: { question: { id: 67, questionText: 'Research Output Table Question', json: researchOutputJson, displayOrder: 1, sectionId: 67, requirementText: '', guidanceText: '', sampleText: '', useSampleTextAsDefault: false, required: false } },
      loading: false,
      error: undefined,
    };
    mockUseQuery.mockImplementation((document) => {
      if (document === QuestionDocument) {
        return mockQuestionTextArea as any;
      }
      return {
        data: null,
        loading: false,
        error: undefined
      };
    });

    await act(async () => {
      render(<QuestionEdit />);
    });

    const titleCheckbox = screen.getByLabelText('researchOutput.labels.title');
    const outputTypeCheckbox = screen.getByLabelText('researchOutput.labels.outputType');

    expect(titleCheckbox).toBeDisabled();
    expect(outputTypeCheckbox).not.toBeDisabled();

    expect(screen.getAllByText('researchOutput.tooltip.requiredFields')).toHaveLength(1);
  });

  it('should toggle field customization panels when customize button is clicked (edit)', async () => {
    const mockQuestionTextArea = {
      data: { question: { id: 67, questionText: 'Research Output Table Question', json: researchOutputJson, displayOrder: 1, sectionId: 67, requirementText: '', guidanceText: '', sampleText: '', useSampleTextAsDefault: false, required: false } },
      loading: false,
      error: undefined,
    };
    mockUseQuery.mockImplementation((document) => {
      if (document === QuestionDocument) {
        return mockQuestionTextArea as any;
      }
      return {
        data: null,
        loading: false,
        error: undefined
      };
    });

    await act(async () => {
      render(<QuestionEdit />);
    });

    const customizeButtons = screen.getAllByText('buttons.customize');
    expect(customizeButtons.length).toBeGreaterThan(0);

    const descriptionCustomizeButton = customizeButtons[0];
    await act(async () => { fireEvent.click(descriptionCustomizeButton); });

    const closeButtons = screen.getAllByText('buttons.close');
    expect(closeButtons.length).toBeGreaterThan(0);
  });

  it('should enable/disable standard fields when checkbox is toggled (edit)', async () => {
    const mockQuestionTextArea = {
      data: { question: { id: 67, questionText: 'Research Output Table Question', json: researchOutputJson, displayOrder: 1, sectionId: 67, requirementText: '', guidanceText: '', sampleText: '', useSampleTextAsDefault: false, required: false } },
      loading: false,
      error: undefined,
    };
    mockUseQuery.mockImplementation((document) => {
      if (document === QuestionDocument) {
        return mockQuestionTextArea as any;
      }
      return {
        data: null,
        loading: false,
        error: undefined
      };
    });

    await act(async () => { render(<QuestionEdit />); });

    const descriptionCheckbox = screen.getByLabelText('researchOutput.labels.description');
    expect(descriptionCheckbox).not.toBeChecked();

    await act(async () => { fireEvent.click(descriptionCheckbox); });

    expect(descriptionCheckbox).toBeChecked();
  });

  it('should show data flags configuration when data flags field is customized (edit)', async () => {
    const mockQuestionTextArea = {
      data: mockSelectedQuestion,
      loading: false,
      error: undefined,
    };
    mockUseQuery.mockImplementation((document) => {
      if (document === QuestionDocument) {
        return mockQuestionTextArea as any;
      }
      return {
        data: null,
        loading: false,
        error: undefined
      };
    });

    render(<QuestionEdit />);

    // Find the Data Flags checkbox
    const dataFlagsCheckbox = screen.getByLabelText('researchOutput.labels.dataFlags');

    // Find the customize button in the same row
    const dataFlagsRow = dataFlagsCheckbox.closest('.fieldRow') as HTMLElement;

    if (!dataFlagsRow) {
      throw new Error('Could not find data flags row');
    }

    const customizeButton = within(dataFlagsRow).getByRole('button', { name: /customize|buttons.customize/i });

    // Click the customize button to expand the panel
    await act(async () => {
      fireEvent.click(customizeButton);
    });

    // Now the legend and options should be visible
    expect(screen.getByText('researchOutput.legends.dataFlag')).toBeInTheDocument();
    expect(screen.getByText('May contain sensitive data?')).toBeInTheDocument();
    expect(screen.getByText('May contain personally identifiable information?')).toBeInTheDocument();
  });

  it('should handle repository configuration and repo selection system (edit)', async () => {
    const mockQuestionTextArea = {
      data: { question: { id: 67, questionText: 'Research Output Table Question', json: researchOutputJson, displayOrder: 1, sectionId: 67, requirementText: '', guidanceText: '', sampleText: '', useSampleTextAsDefault: false, required: false } },
      loading: false,
      error: undefined,
    };
    mockUseQuery.mockImplementation((document) => {
      if (document === QuestionDocument) {
        return mockQuestionTextArea as any;
      }
      return {
        data: null,
        loading: false,
        error: undefined
      };
    });

    await act(async () => { render(<QuestionEdit />); });

    const repoSelectorCheckbox = screen.getByLabelText('researchOutput.labels.repositories');
    await act(async () => { fireEvent.click(repoSelectorCheckbox); });

    expect(screen.getByTestId('repository-selection-system')).toBeInTheDocument();

    const addRepoButton = screen.getByText('Add Repository');
    await act(async () => { fireEvent.click(addRepoButton); });
  });

  it('should auto-enable repository field when adding a repository while field is disabled (edit)', async () => {
    const stableQuestionReturn = {
      data: { question: { id: 67, questionText: 'Research Output Table Question', json: researchOutputJson, displayOrder: 1, sectionId: 67, requirementText: '', guidanceText: '', sampleText: '', useSampleTextAsDefault: false, required: false } },
      loading: false,
      error: undefined,
    };

    const stableLicensesReturn = {
      data: {
        licenses: { items: [] }
      },
      loading: false,
      error: null,
    };

    const stableDefaultResearchOutputTypesReturn = {
      data: { defaultResearchOutputTypes: [] },
      loading: false,
      error: null,
    };

    mockUseQuery.mockImplementation((document) => {
      if (document === QuestionDocument) {
        return stableQuestionReturn as any;
      }

      if (document === LicensesDocument) {
        return stableLicensesReturn as any;
      }

      if (document === DefaultResearchOutputTypesDocument) {
        return stableDefaultResearchOutputTypesReturn as any;
      }

      return {
        data: null,
        loading: false,
        error: undefined
      };
    });

    render(<QuestionEdit />);

    const repoSelectorCheckbox = screen.getByLabelText('researchOutput.labels.repositories');
    expect(repoSelectorCheckbox).not.toBeChecked();

    await act(async () => { fireEvent.click(repoSelectorCheckbox); });
    expect(repoSelectorCheckbox).toBeChecked();
    expect(capturedOnRepositoriesChange).toBeDefined();

    await act(async () => { fireEvent.click(repoSelectorCheckbox); });
    expect(repoSelectorCheckbox).not.toBeChecked();

    // call captured handler directly
    await act(async () => { capturedOnRepositoriesChange!([{ id: '1', name: 'Test Repo', url: 'https://test.com' }]); });

    await waitFor(() => { expect(repoSelectorCheckbox).toBeChecked(); });
  });

  it('should handle metadata standards changes and auto-enable (edit)', async () => {
    const stableQuestionReturn = {
      data: mockSelectedQuestion,
      loading: false,
      error: undefined,
    };

    const stableLicensesReturn = {
      data: {
        licenses: { items: [] }
      },
      loading: false,
      error: null,
    };

    const stableDefaultResearchOutputTypesReturn = {
      data: { defaultResearchOutputTypes: [] },
      loading: false,
      error: null,
    };

    mockUseQuery.mockImplementation((document) => {
      if (document === QuestionDocument) {
        return stableQuestionReturn as any;
      }

      if (document === LicensesDocument) {
        return stableLicensesReturn as any;
      }

      if (document === DefaultResearchOutputTypesDocument) {
        return stableDefaultResearchOutputTypesReturn as any;
      }

      return {
        data: null,
        loading: false,
        error: undefined
      };
    });

    render(<QuestionEdit />);

    const metadataStandardsCheckbox = screen.getByLabelText('researchOutput.labels.metadataStandards');
    expect(metadataStandardsCheckbox).toBeChecked();

    await act(async () => { fireEvent.click(metadataStandardsCheckbox); });
    expect(metadataStandardsCheckbox).not.toBeChecked();
    expect(capturedOnMetaDataStandardsChange).toBeDefined();

    await act(async () => { fireEvent.click(metadataStandardsCheckbox); });
    expect(metadataStandardsCheckbox).toBeChecked();

    await act(async () => { capturedOnMetaDataStandardsChange!([{ id: '1', name: 'Test Standard', url: 'https://test.com' }]); });
    await waitFor(() => { expect(metadataStandardsCheckbox).toBeChecked(); });
  });

  it('should handle license field interactions (edit)', async () => {
    const mockQuestion = {
      data: { question: { id: 67, questionText: 'Research Output Table Question', json: researchOutputJson, displayOrder: 1, sectionId: 67, requirementText: '', guidanceText: '', sampleText: '', useSampleTextAsDefault: false, required: false } },
      loading: false,
      error: undefined,
    };
    mockUseQuery.mockImplementation((document) => {
      if (document === QuestionDocument) {
        return mockQuestion as any;
      }
      return {
        data: null,
        loading: false,
        error: undefined
      };
    });

    await act(async () => { render(<QuestionEdit />); });

    const licensesCheckbox = screen.getByLabelText('researchOutput.labels.licenses');
    await act(async () => { fireEvent.click(licensesCheckbox); });

    expect(screen.getByTestId('license-field')).toBeInTheDocument();

    const newLicenseTypeInput = screen.getByTestId('new-license-type-input');
    await act(async () => { fireEvent.change(newLicenseTypeInput, { target: { value: 'MIT' } }); });

    const addCustomLicenseButton = screen.getByText('Add Custom License');
    await act(async () => { fireEvent.click(addCustomLicenseButton); });
  });

  it('should set hasUnsavedChanges when research output fields are modified (edit)', async () => {
    const mockQuestion = {
      data: { question: { id: 67, questionText: 'Research Output Table Question', json: researchOutputJson, displayOrder: 1, sectionId: 67, requirementText: '', guidanceText: '', sampleText: '', useSampleTextAsDefault: false, required: false } },
      loading: false,
      error: undefined,
    };
    mockUseQuery.mockImplementation((document) => {
      if (document === QuestionDocument) {
        return mockQuestion as any;
      }
      return {
        data: null,
        loading: false,
        error: undefined
      };
    });

    await act(async () => { render(<QuestionEdit />); });

    const descriptionCheckbox = screen.getByLabelText('researchOutput.labels.description');
    await act(async () => { fireEvent.click(descriptionCheckbox); });

    const input = screen.getByLabelText(/labels.questionText/);
    await act(async () => { fireEvent.change(input, { target: { value: 'Test Research Output Question' } }); });
  });

  it('should not show research output fields for non-research output question types (edit)', async () => {

    // Ensure useSearchParams returns an object with .get() for these tests
    // Return 'researchOutputTable' for the 'questionType' param by default.
    (useSearchParams as jest.MockedFunction<typeof useSearchParams>).mockImplementation(() => {
      return {
        get: (key: string) => {
          const params: Record<string, string> = { questionType: 'textArea' };
          return params[key] || null;
        },
        getAll: () => [],
        has: (key: string) => key in { questionType: 'textArea' },
        keys() { },
        values() { },
        entries() { },
        forEach() { },
        toString() { return ''; },
      } as unknown as ReturnType<typeof useSearchParams>;
    });

    const nonResearchJson = JSON.stringify({ meta: { schemaVersion: '1.0' }, type: 'text', attributes: {} });
    const mockQuestion = {
      data: { question: { id: 67, questionText: 'Text Question', json: nonResearchJson, displayOrder: 1, sectionId: 67 } },
      loading: false,
      error: undefined,
    };
    mockUseQuery.mockImplementation((document) => {
      if (document === QuestionDocument) {
        return mockQuestion as any;
      }
      return {
        data: null,
        loading: false,
        error: undefined
      };
    });

    await act(async () => { render(<QuestionEdit />); });

    expect(screen.queryByText('researchOutput.headings.enableStandardFields')).not.toBeInTheDocument();
    expect(screen.queryByText('researchOutput.description')).not.toBeInTheDocument();
  });

});
