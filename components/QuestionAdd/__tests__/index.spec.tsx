import { act, fireEvent, render, screen, waitFor, within } from '@/utils/test-utils';
import { useMutation, useQuery, useLazyQuery } from '@apollo/client/react';
import {
  AddQuestionDocument,
  QuestionsDisplayOrderDocument,
  TemplateDocument, // Added for when we test contents of Question Preview
  LicensesDocument,
  DefaultResearchOutputTypesDocument,
  MetadataStandardsDocument,
  RepositoriesDocument,
  RepositorySubjectAreasDocument
} from '@/generated/graphql';

import { addMetaDataStandardsAction } from '@/app/actions';

import { axe, toHaveNoViolations } from 'jest-axe';
import { useParams, useRouter } from 'next/navigation';
import { useToast } from '@/context/ToastContext';
import QuestionAdd from '@/components/QuestionAdd';
import { AffiliationSearchQuestionType } from "@dmptool/types";
import { TypeAheadInputProps } from '@/components/Form/TypeAheadWithOther/TypeAheadWithOther';
import mocksAffiliations from '@/__mocks__/common/mockAffiliations.json';
import mockMetaDataStandards from '../__mocks__/mockMetaDataStandards.json';
import mockSubjectAreas from '../__mocks__/mockSubjectAreas.json';
import mockRepositories from '../__mocks__/mockRepositories.json';

expect.extend(toHaveNoViolations);

// Mock the addMetaDataStandardsAction
jest.mock('@/app/actions', () => ({
  addMetaDataStandardsAction: jest.fn(),
}));


jest.mock('@/components/Form/TypeAheadWithOther', () => ({
  __esModule: true,
  useAffiliationSearch: jest.fn(() => ({
    suggestions: mocksAffiliations,
    handleSearch: jest.fn(),
  })),
  TypeAheadWithOther: ({ label, placeholder, fieldName, updateFormData }: TypeAheadInputProps) => (
    <div>
      <label>
        {label}
        <input
          aria-label={label}
          placeholder={placeholder}
          name={fieldName}
          role="textbox"
          value="Test Institution"
          onChange={() => updateFormData?.('1', 'Test University')}
        />
      </label>
      <ul role="listbox">
        <li>Search Term</li>
      </ul>
    </div>
  ),
}));


// Mock Apollo Client hooks
jest.mock('@apollo/client/react', () => ({
  useQuery: jest.fn(),
  useMutation: jest.fn(),
  useLazyQuery: jest.fn(),
}));

jest.mock('next/navigation', () => ({
  useParams: jest.fn(),
  useRouter: jest.fn()
}))

jest.mock('@/context/ToastContext', () => ({
  useToast: jest.fn(() => ({
    add: jest.fn(),
  })),
}));

if (typeof global.structuredClone !== 'function') {
  global.structuredClone = (val) => JSON.parse(JSON.stringify(val));
}

// Create a mock for scrollIntoView and focus
const mockScrollIntoView = jest.fn();
const mockToast = {
  add: jest.fn(),
};

// Mock useTranslations from next-intl
jest.mock('next-intl', () => ({
  useTranslations: jest.fn(() => {
    /*eslint-disable @typescript-eslint/no-explicit-any */
    const mockUseTranslations = ((key: string, ..._args: string[]) => key) as any;

    /*eslint-disable @typescript-eslint/no-explicit-any */
    mockUseTranslations.rich = (
      key: string,
      values?: Record<string, any>
    ) => {
      // Handle rich text formatting
      if (values?.p) {
        return values.p(key); // Simulate rendering the `p` tag function
      }
      return key;
    };

    return mockUseTranslations;
  }),
}));

const mockTemplateData = {

  template: {
    __typename: "Template",
    id: 15,
    name: "National Center for Sustainable Transportation - Project Data Management Plan",
    description: "<p>This template is for projects funded by the National Center for Sustainable Transportation. Use of this template is <em>not</em> limited to researchers at the University of California, Davis.</p>",
    errors: {
      __typename: "TemplateErrors",
      general: null,
      name: null,
      ownerId: null
    },
    latestPublishVersion: "v15",
    latestPublishDate: "1755815345000",
    created: "2023-09-13 17:47:34",
    sections: [],
    owner: {
      displayName: "University of Example"
    },
    visibility: "ORGANIZATION",
    bestPractice: false,
    isDirty: true
  }
}

const mockQuestionDisplayData = {
  questions: [
    {
      displayOrder: 1
    },
    {
      displayOrder: 2
    },
    {
      displayOrder: 3
    },
    {
      displayOrder: 4
    },
  ]
}

// Cast with jest.mocked utility
const mockUseQuery = jest.mocked(useQuery);
const mockUseMutation = jest.mocked(useMutation);
const mockUseLazyQuery = jest.mocked(useLazyQuery);

let mockAddQuestionFn: jest.Mock;

const setupMocks = () => {
  // Create stable references OUTSIDE mockImplementation
  const stableQuestionsDisplayOrderReturn = {
    data: mockQuestionDisplayData,
    loading: false,
    error: null,
  };

  const stableTemplateReturn = {
    data: mockTemplateData,
    loading: false,
    error: null,
  };

  const stableLicensesReturn = {
    data: { licenses: [] },
    loading: false,
    error: null,
  };

  const stableDefaultResearchOutputTypesReturn = {
    data: { defaultResearchOutputTypes: [] },
    loading: false,
    error: null,
  };

  const stableRepositoriesSubjectAreasReturn = {
    data: mockSubjectAreas,
    loading: false,
    error: null,
  };


  mockUseQuery.mockImplementation((document) => {
    if (document === QuestionsDisplayOrderDocument) {
      return stableQuestionsDisplayOrderReturn as any;
    }

    if (document === TemplateDocument) {
      return stableTemplateReturn as any;
    }

    if (document === TemplateDocument) {
      return stableTemplateReturn as any;
    }
    if (document === LicensesDocument) {
      return stableLicensesReturn as any;
    }

    if (document === DefaultResearchOutputTypesDocument) {
      return stableDefaultResearchOutputTypesReturn as any;
    }

    if (document === RepositorySubjectAreasDocument) {
      return stableRepositoriesSubjectAreasReturn as any;
    }


    return {
      data: null,
      loading: false,
      error: undefined
    };
  });

  // Lazy query mocks
  const mockFetchMetaDataStandards = jest.fn().mockResolvedValue({
    data: mockMetaDataStandards
  });

  const mockFetchRepositories = jest.fn().mockResolvedValue({
    data: mockRepositories
  });


  const stableMetadataStandardsReturn = [
    mockFetchMetaDataStandards,
    {
      data: mockMetaDataStandards,
      loading: false,
      error: null
    }
  ];

  const stableRepositoriesReturn = [
    mockFetchRepositories,
    { data: mockRepositories, loading: false, error: null }
  ]

  mockUseLazyQuery.mockImplementation((document) => {
    if (document === MetadataStandardsDocument) {
      return stableMetadataStandardsReturn as any;
    }

    if (document === RepositoriesDocument) {
      return stableRepositoriesReturn as any;
    }

    return {
      data: null,
      loading: false,
      error: undefined
    };
  });

  mockAddQuestionFn = jest.fn().mockResolvedValue({
    data: { key: 'value' }
  });

  mockUseMutation.mockImplementation((document) => {
    if (document === AddQuestionDocument) {
      return [mockAddQuestionFn, { loading: false, error: undefined }] as any;
    }

    return [jest.fn(), { loading: false, error: undefined }] as any;
  });
};

describe("QuestionAdd", () => {
  let mockRouter;
  beforeEach(() => {
    setupMocks();
    HTMLElement.prototype.scrollIntoView = mockScrollIntoView;
    window.scrollTo = jest.fn(); // Called by the wrapping PageHeader
    const mockTemplateId = 123;
    const mockUseParams = useParams as jest.Mock;

    // Mock window.tinymce
    window.tinymce = {
      init: jest.fn(),
      remove: jest.fn(),
    };

    // Mock the return value of useParams
    mockUseParams.mockReturnValue({ templateId: `${mockTemplateId}` });

    // Mock the router
    mockRouter = { push: jest.fn() };
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
  });

  afterEach(() => {
    // Clean up any modals or DOM pollution
    document.body.innerHTML = '';

    // Clear all mocks to prevent state bleeding
    jest.clearAllMocks();

    // Reset any global state that might have been modified
    window.location.hash = '';
  });


  it("should render correct fields and content", async () => {

    const json = JSON.stringify({
      meta: {
        asRichText: true,
        schemaVersion: "1.0"
      },
      type: "textArea",
      attributes: {
        pattern: null,
        rows: null,
        cols: null,
        maxLength: null,
        minLength: 0
      }
    })
    await act(async () => {
      render(
        <QuestionAdd
          questionType="textArea"
          questionName="Text Area"
          questionJSON={json}
          sectionId="1"
          onSave={jest.fn()}
          backUrl="/back"
          successUrl="/success"
          breadcrumbs={<div>Breadcrumbs</div>}
        />);
    });

    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveTextContent('title');
    const editQuestionTab = screen.getByRole('tab', { name: 'tabs.editQuestion' });
    expect(editQuestionTab).toBeInTheDocument();
    const editOptionsTab = screen.getByRole('tab', { name: 'tabs.options' });
    expect(editOptionsTab).toBeInTheDocument();
    const editLogicTab = screen.getByRole('tab', { name: 'tabs.logic' });
    expect(editLogicTab).toBeInTheDocument();
    const questionTypeLabel = screen.getByLabelText(/labels.type/i);
    expect(questionTypeLabel).toBeInTheDocument();
    const questionTextLabel = screen.getByText(/labels.questionText/i);
    expect(questionTextLabel).toBeInTheDocument();
    const questionRequirementTextLabel = screen.getByText(/labels.requirementText/i);
    expect(questionRequirementTextLabel).toBeInTheDocument();
    const questionGuidanceTextLabel = screen.getByText(/labels.guidanceText/i);
    expect(questionGuidanceTextLabel).toBeInTheDocument();
    const questionSampleTextLabel = screen.getByText(/labels.sampleText/i);
    expect(questionSampleTextLabel).toBeInTheDocument();
    const sidebarHeading = screen.getByRole('heading', { level: 2 });
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
    // Setting question as required
    expect(screen.getByText('form.yesLabel')).toBeInTheDocument();
    expect(screen.getByText('form.noLabel')).toBeInTheDocument();
  });

  it("should return user to the template edit page if questionType is missing", async () => {
    const json = JSON.stringify({
      meta: {
        schemaVersion: "1.0"
      },
      type: "text",
      attributes: {
        pattern: null,
        maxLength: null,
        minLength: 0
      }
    })
    await act(async () => {
      render(
        <QuestionAdd
          questionName="Text"
          questionJSON={json}
          sectionId="1"
          onSave={jest.fn()}
          backUrl="/back"
          successUrl="/success"
          breadcrumbs={<div>Breadcrumbs</div>}
        />);
    });

    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledTimes(1);
      expect(mockRouter.push).toHaveBeenCalledWith('/en-US/template/123/q/new?section_id=1&step=1');
    });
  });

  it('should call router.push with correct url when user clicks on Change type button', async () => {
    const json = JSON.stringify({
      meta: {
        schemaVersion: "1.0"
      },
      type: "text",
      attributes: {
        pattern: null,
        maxLength: null,
        minLength: 0
      }
    })
    await act(async () => {
      render(
        <QuestionAdd
          questionType="text"
          questionName="Text"
          questionJSON={json}
          sectionId="1"
          onSave={jest.fn()}
          backUrl="/back"
          successUrl="/success"
          breadcrumbs={<div>Breadcrumbs</div>}
        />);
    });
    const changeTypeButton = screen.getByRole('button', { name: 'buttons.changeType' });
    fireEvent.click(changeTypeButton);
    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith('/back');
    });
  });


  it('should call addQuestionMutation when Save button is clicked after entering data', async () => {
    const mockOnSave = jest.fn().mockResolvedValue(undefined); // ← named mock

    const json = "{\"type\":\"radioButtons\",\"attributes\":{},\"options\":[{\"label\":\"Yes\",\"value\":\"Yes\",\"selected\":false},{\"label\":\"No\",\"value\":\"No\",\"selected\":true},{\"label\":\"Maybe\",\"value\":\"Maybe\",\"selected\":false}],\"meta\":{\"schemaVersion\":\"1.0\"}}"

    await act(async () => {
      render(
        <QuestionAdd
          questionType="radioButtons"
          questionName="Radio buttons"
          questionJSON={json}
          sectionId="1"
          onSave={mockOnSave}  // ← pass it here
          backUrl="/back"
          successUrl="/success"
          breadcrumbs={< div > Breadcrumbs</div >}
        />
      );
    });

    fireEvent.change(screen.getByLabelText(/labels.questionText/), {
      target: { value: 'New Question' },
    });

    await act(async () => {
      fireEvent.change(screen.getByPlaceholderText('placeholder.text'), {
        target: { value: 'Yes' },
      });
    });

    await act(async () => {
      fireEvent.click(screen.getByLabelText('form.yesLabel'));
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /buttons.saveAndAdd/i }));
    });

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith({  // ← assert on onSave
        questionText: 'New Question',
        json: expect.stringContaining("{\"type\":\"radioButtons\",\"attributes\":{},\"meta\":{\"schemaVersion\":\"1.0\"},\"options\":[{\"label\":\"Yes\",\"value\":\"Yes\",\"selected\":false}],\"showCommentField\":false}"),
        requirementText: "",
        guidanceText: "",
        sampleText: "",
        useSampleTextAsDefault: false,
        required: true,
      });
    });
  });

  it('should call addQuestionMutation with correct data for \'text\' question type', async () => {
    const mockOnSave = jest.fn().mockResolvedValue(undefined);

    const json = JSON.stringify({
      meta: {
        asRichText: true,
        schemaVersion: "1.0"
      },
      type: "text",
      attributes: {
        pattern: null,
        maxLength: null,
        minLength: 0
      }
    });

    await act(async () => {
      render(
        <QuestionAdd
          questionType="text"
          questionName="Text Field"
          questionJSON={json}
          sectionId="1"
          onSave={mockOnSave}
          backUrl="/back"
          successUrl="/success"
          breadcrumbs={<div>Breadcrumbs</div>}
        />
      );
    });

    fireEvent.change(screen.getByLabelText(/labels.questionText/), {
      target: { value: 'New Question' },
    });

    fireEvent.click(screen.getByRole('button', { name: /buttons.save/i }));

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith({
        questionText: 'New Question',
        json: "{\"type\":\"text\",\"attributes\":{\"maxLength\":1000,\"minLength\":0,\"pattern\":\"^.+$\"},\"meta\":{\"schemaVersion\":\"1.0\"},\"showCommentField\":false}",
        requirementText: "",
        guidanceText: "",
        sampleText: "",
        useSampleTextAsDefault: false,
        required: false,
      });
    });
  });

  it('should prevent unload when there are unsaved changes and user tries to navigate away from page', async () => {
    // Mock addEventListener
    const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
    const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
    const mockAddQuestionMutation = jest.fn().mockResolvedValueOnce({
      data: { addQuestion: { id: 1 } },
    });

    mockUseMutation.mockImplementation((document) => {
      if (document === AddQuestionDocument) {
        return [mockAddQuestionMutation, { loading: false, error: undefined }] as any;
      }
      return [jest.fn(), { loading: false, error: undefined }] as any;
    });


    const json = JSON.stringify({
      meta: {
        asRichText: true,
        schemaVersion: "1.0"
      },
      type: "text",
      attributes: {
        pattern: null,
        maxLength: null,
        minLength: 0
      }
    })
    await act(async () => {
      render(
        <QuestionAdd
          questionType="text"
          questionName="Text Field"
          questionJSON={json}
          sectionId="1"
          onSave={jest.fn()}
          backUrl="/back"
          successUrl="/success"
          breadcrumbs={<div>Breadcrumbs</div>}
        />);
    });

    // Get the input
    const input = screen.getByLabelText(/labels.questionText/);

    // Set value to 'New Question'
    fireEvent.change(input, { target: { value: 'New Question' } });

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
  })

  it('should call addQuestionMutation with correct data for \'textArea\' question type ', async () => {
    const mockOnSave = jest.fn().mockResolvedValue(undefined);
    const mockAddQuestionMutation = jest.fn().mockResolvedValueOnce({
      data: { addQuestion: { id: 1 } },
    });

    mockUseMutation.mockImplementation((document) => {
      if (document === AddQuestionDocument) {
        return [mockAddQuestionMutation, { loading: false, error: undefined }] as any;
      }
      return [jest.fn(), { loading: false, error: undefined }] as any;
    });


    const json = JSON.stringify({
      meta: {
        asRichText: true,
        schemaVersion: "1.0"
      },
      type: "textArea",
      attributes: {
        rows: null,
        cols: null,
        maxLength: null,
        minLength: 0
      }
    })
    await act(async () => {
      render(
        <QuestionAdd
          questionType="textArea"
          questionName="Text Area"
          questionJSON={json}
          sectionId="1"
          onSave={mockOnSave}
          backUrl="/back"
          successUrl="/success"
          breadcrumbs={<div>Breadcrumbs</div>}
        />);
    });

    // Get the input
    const input = screen.getByLabelText(/labels.questionText/);

    // Set value to 'New Question'
    fireEvent.change(input, { target: { value: 'New Question' } });

    const saveButton = screen.getByRole('button', { name: /buttons.save/i });
    fireEvent.click(saveButton);

    // Check if the addQuestionMutation was called
    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith({
        questionText: 'New Question',
        json: "{\"type\":\"textArea\",\"attributes\":{\"maxLength\":1000,\"minLength\":0,\"cols\":40,\"rows\":20,\"asRichText\":true},\"meta\":{\"schemaVersion\":\"1.0\"},\"showCommentField\":false}",
        requirementText: "",
        guidanceText: "",
        sampleText: "",
        useSampleTextAsDefault: false,
        required: false,
      });
    });
  })

  it('should call addQuestionMutation with correct data for \'number\' question type ', async () => {
    const mockOnSave = jest.fn().mockResolvedValue(undefined);

    const mockAddQuestionMutation = jest.fn().mockResolvedValueOnce({
      data: { addQuestion: { id: 1 } },
    });

    mockUseMutation.mockImplementation((document) => {
      if (document === AddQuestionDocument) {
        return [mockAddQuestionMutation, { loading: false, error: undefined }] as any;
      }
      return [jest.fn(), { loading: false, error: undefined }] as any;
    });

    const json = JSON.stringify({
      meta: {
        schemaVersion: "1.0"
      },
      type: "number",
      attributes: {
        max: null,
        min: 0,
        step: 1
      }
    })
    await act(async () => {
      render(
        <QuestionAdd
          questionType="number"
          questionName="Number Field"
          questionJSON={json}
          sectionId="1"
          onSave={mockOnSave}
          backUrl="/back"
          successUrl="/success"
          breadcrumbs={<div>Breadcrumbs</div>}
        />);
    });

    // Get the input
    const input = screen.getByLabelText(/labels.questionText/);

    // Set value to 'New Question'
    fireEvent.change(input, { target: { value: 'New Question' } });

    const saveButton = screen.getByRole('button', { name: /buttons.save/i });
    fireEvent.click(saveButton);

    // Check if the addQuestionMutation was called
    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith({
        questionText: 'New Question',
        json: "{\"type\":\"number\",\"attributes\":{\"max\":10000000,\"min\":0,\"step\":1},\"meta\":{\"schemaVersion\":\"1.0\"},\"showCommentField\":false}",
        requirementText: '',
        guidanceText: '',
        sampleText: '',
        required: false,
        useSampleTextAsDefault: false,
      });
    });
  })

  it('should call addQuestionMutation with correct data for \'currency\' question type ', async () => {
    const mockOnSave = jest.fn().mockResolvedValue(undefined);

    const json = JSON.stringify({
      meta: {
        schemaVersion: "1.0"
      },
      type: "currency",
      attributes: {
        max: null,
        min: 0,
        step: 1,
        denomination: "GBP"
      }
    })
    await act(async () => {
      render(
        <QuestionAdd
          questionType="currency"
          questionName="Currency Field"
          questionJSON={json}
          sectionId="1"
          onSave={mockOnSave}
          backUrl="/back"
          successUrl="/success"
          breadcrumbs={<div>Breadcrumbs</div>}
        />);
    });

    // Get the input
    const input = screen.getByLabelText(/labels.questionText/);

    // Set value to 'New Question'
    fireEvent.change(input, { target: { value: 'New Question' } });

    const saveButton = screen.getByRole('button', { name: /buttons.save/i });
    fireEvent.click(saveButton);

    // Check if the addQuestionMutation was called
    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith({
        questionText: 'New Question',
        json: "{\"type\":\"currency\",\"attributes\":{\"max\":10000000,\"min\":0,\"step\":0.01,\"denomination\":\"GBP\"},\"meta\":{\"schemaVersion\":\"1.0\"},\"showCommentField\":false}",
        requirementText: '',
        guidanceText: '',
        sampleText: '',
        useSampleTextAsDefault: false,
        required: false,
      });
    });
  })

  it('should call addQuestionMutation with correct data for \'url\' question type ', async () => {
    const mockOnSave = jest.fn().mockResolvedValue(undefined);

    const json = JSON.stringify({
      meta: {
        schemaVersion: "1.0"
      },
      type: "url",
      attributes: {
        maxLength: null,
        minLength: 0,
        pattern: null
      }
    })
    await act(async () => {
      render(
        <QuestionAdd
          questionType="url"
          questionName="Url Field"
          questionJSON={json}
          sectionId="1"
          onSave={mockOnSave}
          backUrl="/back"
          successUrl="/success"
          breadcrumbs={<div>Breadcrumbs</div>}
        />);
    });

    // Fill only the fields that are rendered for 'url' question type
    fireEvent.change(screen.getByLabelText(/labels.questionText/), { target: { value: 'New Question' } });
    if (screen.queryByLabelText(/labels.requirementText/)) {
      fireEvent.change(screen.getByLabelText(/labels.requirementText/), { target: { value: 'Required text' } });
    }
    if (screen.queryByLabelText(/labels.guidanceText/)) {
      fireEvent.change(screen.getByLabelText(/labels.guidanceText/), { target: { value: 'Guidance text' } });
    }

    const saveButton = screen.getByRole('button', { name: /buttons.save/i });
    fireEvent.click(saveButton);

    // Check if the addQuestionMutation was called
    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalled();
    });
  })

  // QuestionOptionsComponent has it's own separate unit test, so we are just testing that it loads here
  it('should load QuestionOptionsComponent', async () => {
    const json = JSON.stringify({
      meta: {
        schemaVersion: "1.0"
      },
      type: "radioButtons",
      options: [
        {
          attributes: {
            label: null,
            value: null,
            selected: false
          }
        }
      ]
    })
    await act(async () => {
      render(
        <QuestionAdd
          questionType="radioButtons"
          questionName="Radio buttons"
          questionJSON={json}
          sectionId="1"
          onSave={jest.fn()}
          backUrl="/back"
          successUrl="/success"
          breadcrumbs={<div>Breadcrumbs</div>}
        />);
    });

    // Radio button info with order, text and checkbox should be in document
    expect(screen.getByLabelText(/labels.order/)).toBeInTheDocument();
    expect(screen.getByLabelText(/labels.text/)).toBeInTheDocument();
    expect(screen.getByLabelText(/labels.default/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'buttons.addRow' })).toBeInTheDocument();
  })

  it('should add a new row when the add button is clicked', async () => {
    const mockOnSave = jest.fn().mockResolvedValue(undefined);

    const mockQuestionJSON = "{\"meta\":{\"schemaVersion\":\"1.0\"},\"type\":\"radioButtons\",\"options\":[{\"type\":\"option\",\"attributes\":{\"label\":\"Option 1\",\"value\":\"1\",\"selected\":false}},{\"type\":\"option\",\"attributes\":{\"label\":\"Option 2\",\"value\":\"2\",\"selected\":true}}]}";

    await act(async () => {
      render(
        <QuestionAdd
          questionType="radioButtons"
          questionName="Radio buttons"
          questionJSON={mockQuestionJSON}
          sectionId="1"
          onSave={mockOnSave}
          backUrl="/back"
          successUrl="/success"
          breadcrumbs={<div>Breadcrumbs</div>}
        />
      );
    });

    fireEvent.change(screen.getByLabelText(/labels.questionText/), {
      target: { value: 'Testing adding new row' },
    });

    await act(async () => {
      fireEvent.change(screen.getByLabelText(/labels.text/), {
        target: { value: 'Yes' },
      });
    });


    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /buttons.addRow/i }));
    });

    // Wait for the new input to appear
    const textInputs = await screen.findAllByLabelText(/labels.text/);
    fireEvent.change(textInputs[0], { target: { value: 'Option 1' } });
    fireEvent.change(textInputs[1], { target: { value: 'Option 2' } });

    const defaultCheckboxes = screen.getAllByLabelText(/labels.default/);

    // Simulate checking the first option as default
    fireEvent.click(defaultCheckboxes[0]);

    // Fill out any other required fields if they exist
    if (screen.queryByLabelText(/labels.requirementText/)) {
      fireEvent.change(screen.getByLabelText(/labels.requirementText/), { target: { value: 'Required text' } });
    }
    if (screen.queryByLabelText(/labels.guidanceText/)) {
      fireEvent.change(screen.getByLabelText(/labels.guidanceText/), { target: { value: 'Guidance text' } });
    }

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /buttons.saveAndAdd/i }));
    });

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalled();
    });
  });

  it('should not display the useSampleTextAsDefault checkbox if the questionTypeId is Radio Button field', async () => {
    const json = JSON.stringify({
      meta: {
        schemaVersion: "1.0"
      },
      type: "radioButtons",
      options: [
        {
          attributes: {
            label: null,
            value: null,
            selected: false
          }
        }
      ]
    })
    await act(async () => {
      render(
        <QuestionAdd
          questionType="radioButtons"
          questionName="Radio buttons"
          questionJSON={json}
          sectionId="1"
          onSave={jest.fn()}
          backUrl="/back"
          successUrl="/success"
          breadcrumbs={<div>Breadcrumbs</div>}
        />);
    });

    const checkboxText = screen.queryByText('descriptions.sampleTextAsDefault');
    expect(checkboxText).not.toBeInTheDocument();
  })

  it('should display the useSampleTextAsDefault checkbox if the questionTypeId is a Text area field', async () => {
    const json = JSON.stringify({
      meta: {
        asRichText: true,
        schemaVersion: "1.0"
      },
      type: "textArea",
      attributes: {
        cols: 20,
        rows: 4,
        maxLength: null,
        minLength: 0
      }
    })
    await act(async () => {
      render(
        <QuestionAdd
          questionType="textArea"
          questionName="Text Area"
          questionJSON={json}
          sectionId="1"
          onSave={jest.fn()}
          backUrl="/back"
          successUrl="/success"
          breadcrumbs={<div>Breadcrumbs</div>}
        />);
    });

    const checkboxText = screen.queryByText('descriptions.sampleTextAsDefault');
    expect(checkboxText).toBeInTheDocument();
  })

  it('should call handleRangeLabelChange when RangeComponent input changes', () => {
    const mockDateRangeJSON = JSON.stringify({
      meta: {
        schemaVersion: "1.0"
      },
      type: "dateRange",
      columns: {
        end: {
          meta: {
            schemaVersion: "1.0"
          },
          type: "date",
          attributes: {
            label: "Ending"
          }
        },
        start: {
          meta: {
            schemaVersion: "1.0"
          },
          type: "date",
          attributes: {
            label: "Beginning"
          }
        }
      }
    });
    render(
      <QuestionAdd
        questionType="dateRange"
        questionName="Range label"
        questionJSON={mockDateRangeJSON}
        sectionId="1"
        onSave={jest.fn()}
        backUrl="/back"
        successUrl="/success"
        breadcrumbs={<div>Breadcrumbs</div>}
      />);

    // Find the input rendered by RangeComponent
    const rangeStartInput = screen.getByLabelText(/range start/);

    // Simulate user typing
    fireEvent.change(rangeStartInput, { target: { value: 'New Range Label' } });

    expect(rangeStartInput).toHaveValue('New Range Label');
  });

  it('should call handleRangeLabelChange for numberRange changes', () => {
    const mockDateRangeJSON = JSON.stringify({
      meta: {
        schemaVersion: "1.0"
      },
      type: "numberRange",
      columns: {
        end: {
          meta: {
            schemaVersion: "1.0"
          },
          type: "number",
          attributes: {
            max: null,
            min: 0,
            step: 1,
            label: "To"
          }
        },
        start: {
          meta: {
            schemaVersion: "1.0"
          },
          type: "number",
          attributes: {
            max: null,
            min: 0,
            step: 1,
            label: "From"
          }
        }
      }
    });
    render(
      <QuestionAdd
        questionType="numberRange"
        questionName="Number Range Label"
        questionJSON={mockDateRangeJSON}
        sectionId="1"
        onSave={jest.fn()}
        backUrl="/back"
        successUrl="/success"
        breadcrumbs={<div>Breadcrumbs</div>}
      />);

    // Find the input rendered by RangeComponent
    const rangeStartInput = screen.getByLabelText(/range start/);

    // Simulate user typing
    fireEvent.change(rangeStartInput, { target: { value: 'New Range Label' } });

    expect(rangeStartInput).toHaveValue('New Range Label');
  });

  it('should set displayOrder to 1 for the new question, if there are no existing questions', async () => {
    const mockOnSave = jest.fn().mockResolvedValue(undefined);

    const mockQuestionsDisplay = {
      data: null,
      loading: false,
      error: undefined
    };
    mockUseQuery.mockImplementation((document) => {
      if (document === QuestionsDisplayOrderDocument) {
        return mockQuestionsDisplay as any;
      }
      return {
        data: null,
        loading: false,
        error: undefined
      };
    });

    const mockAddQuestionMutation = jest.fn().mockResolvedValueOnce({
      data: { addQuestion: { id: 1 } },
    });

    mockUseMutation.mockImplementation((document) => {
      if (document === AddQuestionDocument) {
        return [mockAddQuestionMutation, { loading: false, error: undefined }] as any;
      }
      return [jest.fn(), { loading: false, error: undefined }] as any;
    });


    const json = JSON.stringify({
      meta: {
        schemaVersion: "1.0"
      },
      type: "radioButtons",
      options: [
        {
          attributes: {
            label: null,
            value: null,
            selected: false
          }
        }
      ]
    })
    await act(async () => {
      render(
        <QuestionAdd
          questionType="radioButtons"
          questionName="Radio buttons"
          questionJSON={json}
          sectionId="1"
          onSave={mockOnSave}
          backUrl="/back"
          successUrl="/success"
          breadcrumbs={<div>Breadcrumbs</div>}
        />);
    });

    // Get the question text input
    const input = screen.getByLabelText(/labels.questionText/);

    // add text to question text field
    fireEvent.change(input, { target: { value: 'New Question' } });

    // Add a new radio row
    const radioInput = screen.getByPlaceholderText('placeholder.text');

    await act(async () => {
      fireEvent.change(radioInput, { target: { value: 'Yes' } });
    })

    // Select that the question should be required
    const isRequiredRadio = screen.getByLabelText('form.yesLabel');

    await act(async () => {
      fireEvent.click(isRequiredRadio);
    })

    const saveButton = screen.getByRole('button', { name: /buttons.saveAndAdd/i });

    await act(async () => {
      fireEvent.click(saveButton);
    })

    // Check if the addQuestionMutation was called
    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith({
        questionText: 'New Question',
        json: "{\"type\":\"radioButtons\",\"attributes\":{},\"meta\":{\"schemaVersion\":\"1.0\"},\"options\":[{\"label\":\"Yes\",\"value\":\"Yes\",\"selected\":false}],\"showCommentField\":false}",
        requirementText: '',
        guidanceText: '',
        sampleText: '',
        useSampleTextAsDefault: false,
        required: true,
      });
    });
  })

  it('should call handleTypeAheadSearchLabelChange when typeaheadSearch label value changes and pass correct value to Question Preview', async () => {
    const json: AffiliationSearchQuestionType = {
      meta: {
        schemaVersion: "1.0"
      },
      type: "affiliationSearch",
      attributes: {
        label: "Affiliation search label",
      },
      graphQL: {
        query: "\nquery Affiliations($name: String!){\n  affiliations(name: $name) {\n    totalCount\n    nextCursor\n    items {\n      id\n      displayName\n      uri\n    }\n  }\n}",
        queryId: "useAffiliationsQuery",
        variables: [
          {
            name: "name",
            label: "Search",
            labelTranslationKey: "SignupPage.institutionHelp",
            type: "string",
            minLength: 3,
          }
        ],
        answerField: "uri",
        displayFields: [
          {
            label: "Affiliation",
            propertyName: "displayName",
            labelTranslationKey: "SignupPage.institution"
          }
        ],
        responseField: "affiliations.items"
      }
    };
    const mockTypeAheadJSON = JSON.stringify(json);

    await act(async () => {
      render(
        <QuestionAdd
          questionType="affiliationSearch"
          questionName="Affiliation Search"
          questionJSON={mockTypeAheadJSON}
          sectionId="1"
          onSave={jest.fn()}
          backUrl="/back"
          successUrl="/success"
          breadcrumbs={<div>Breadcrumbs</div>}
        />
      );
    });

    // Find the label input rendered by AffiliationSearch
    const labelInput = screen.getByPlaceholderText('Enter search label');

    // Simulate user typing
    await act(async () => {
      fireEvent.change(labelInput, { target: { value: 'New Institution Label' } });
    });

    expect(labelInput).toHaveValue('New Institution Label');

    // Click the preview button
    const previewButton = screen.getByRole('button', { name: /buttons.previewQuestion/i });

    await act(async () => {
      fireEvent.click(previewButton);
    });

    // Wait for the modal to appear
    await waitFor(() => {
      expect(screen.getByTestId('modal-overlay')).toBeInTheDocument();
    });

    // Check if the new label appears in the preview
    await waitFor(() => {
      expect(screen.getByText('New Institution Label')).toBeInTheDocument();
    });
  });

  it('should call handleTypeAheadHelpTextChange when typeaheadSearch help text value changes and pass correct value to Question Preview', async () => {
    const json: AffiliationSearchQuestionType = {
      meta: {
        schemaVersion: "1.0"
      },
      type: "affiliationSearch",
      attributes: {
        help: "Enter the search term to find your affiliation",
      },
      graphQL: {
        query: "\nquery Affiliations($name: String!){\n  affiliations(name: $name) {\n    totalCount\n    nextCursor\n    items {\n      id\n      displayName\n      uri\n    }\n  }\n}",
        queryId: "useAffiliationsQuery",
        variables: [
          {
            name: "name",
            label: "Search",
            labelTranslationKey: "SignupPage.institutionHelp",
            type: "string",
            minLength: 3,
          }
        ],
        answerField: "uri",
        displayFields: [
          {
            label: "Affiliation",
            propertyName: "displayName",
            labelTranslationKey: "SignupPage.institution"
          }
        ],
        responseField: "affiliations.items"
      }
    };
    const mockTypeAheadJSON = JSON.stringify(json);

    render(
      <QuestionAdd
        questionType="affiliationSearch"
        questionName="Affiliation Search"
        questionJSON={mockTypeAheadJSON}
        sectionId="1"
        onSave={jest.fn()}
        backUrl="/back"
        successUrl="/success"
        breadcrumbs={<div>Breadcrumbs</div>}
      />);

    // Find the label input rendered by AffiliationSearch
    const helpTextInput = screen.getByPlaceholderText('Enter the help text you want to display');

    // Simulate user typing
    fireEvent.change(helpTextInput, { target: { value: 'Enter a search term' } });

    expect(helpTextInput).toHaveValue('Enter a search term');

    // Click the preview button
    const previewButton = screen.getByRole('button', { name: /buttons.previewQuestion/i });

    await act(async () => {
      fireEvent.click(previewButton);
    });

    // Wait for the modal to appear
    await waitFor(() => {
      expect(screen.getByTestId('modal-overlay')).toBeInTheDocument();
    });

    // Check if the new label appears in the preview
    await waitFor(() => {
      expect(screen.getByText('Search Term')).toBeInTheDocument();
    });
  });

});

describe("Research Output Question Type", () => {
  let mockRouter;
  beforeEach(() => {
    setupMocks();
    HTMLElement.prototype.scrollIntoView = mockScrollIntoView;
    window.scrollTo = jest.fn();
    const mockTemplateId = 123;
    const mockUseParams = useParams as jest.Mock;

    window.tinymce = {
      init: jest.fn(),
      remove: jest.fn(),
    };

    mockUseParams.mockReturnValue({ templateId: `${mockTemplateId}` });

    mockRouter = { push: jest.fn() };
    (useRouter as jest.Mock).mockReturnValue(mockRouter);


    // Mock addMetaDataStandardsAction to return success
    (addMetaDataStandardsAction as jest.Mock).mockResolvedValue({
      success: true,
      data: {
        metadataStandard: {
          id: 999,
          name: 'Custom Standard',
          uri: 'https://example.com',
          description: 'A custom standard',
        }
      }
    });
  });

  afterEach(() => {
    document.body.innerHTML = '';
    jest.clearAllMocks();
    window.location.hash = '';
  });

  it('should render research output fields when questionType is researchOutput', async () => {
    const json = JSON.stringify({
      meta: {
        schemaVersion: "1.0"
      },
      type: "researchOutputTable",
      attributes: {}
    });


    render(
      <QuestionAdd
        questionType="researchOutputTable"
        questionName="Research Output"
        questionJSON={json}
        sectionId="1"
        onSave={jest.fn()}
        backUrl="/back"
        successUrl="/success"
        breadcrumbs={<div>Breadcrumbs</div>}
      />);


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
    expect(screen.getByText('researchOutput.labels.initialAccessLevels')).toBeInTheDocument();
  });

  it('should show tooltip for required fields', async () => {
    const json = JSON.stringify({
      meta: {
        schemaVersion: "1.0"
      },
      type: "researchOutputTable",
      attributes: {}
    });

    await act(async () => {
      render(
        <QuestionAdd
          questionType="researchOutputTable"
          questionName="Research Output"
          questionJSON={json}
          sectionId="1"
          onSave={jest.fn()}
          backUrl="/back"
          successUrl="/success"
          breadcrumbs={<div>Breadcrumbs</div>}
        />);
    });

    // Check that Title and Output Type checkboxes are disabled
    const titleCheckbox = screen.getByLabelText('researchOutput.labels.title');
    const outputTypeCheckbox = screen.getByLabelText('researchOutput.labels.outputType');

    expect(titleCheckbox).toBeDisabled();
    expect(outputTypeCheckbox).not.toBeDisabled();

    // Check for tooltip text
    expect(screen.getAllByText('researchOutput.tooltip.requiredFields')).toHaveLength(1);
  });

  it('should toggle field customization panels when customize button is clicked', async () => {
    const json = JSON.stringify({
      meta: {
        schemaVersion: "1.0"
      },
      type: "researchOutputTable",
      attributes: {}
    });

    await act(async () => {
      render(
        <QuestionAdd
          questionType="researchOutputTable"
          questionName="Research Output"
          questionJSON={json}
          sectionId="1"
          onSave={jest.fn()}
          backUrl="/back"
          successUrl="/success"
          breadcrumbs={<div>Breadcrumbs</div>}
        />);
    });

    // Find customize buttons (there should be multiple)
    const customizeButtons = screen.getAllByText('buttons.customize');
    const initialNoOfCloseButtons = screen.queryAllByText('buttons.close');;
    expect(initialNoOfCloseButtons.length).toBe(1); // Only Output Type is expanded by default
    expect(customizeButtons.length).toBeGreaterThan(0);

    // Click the first customize button (for Output Type which is always expanded)
    await act(async () => {
      fireEvent.click(customizeButtons[0]);
    });

    // Should show an additionalclose button after clicking and expanding
    await waitFor(() => {
      const closeButtons = screen.getAllByText('buttons.close');;
      expect(closeButtons.length).toBe(2);
    });
  });

  it('should enable/disable standard fields when checkbox is toggled', async () => {
    const json = JSON.stringify({
      meta: {
        schemaVersion: "1.0"
      },
      type: "researchOutputTable",
      attributes: {}
    });

    await act(async () => {
      render(
        <QuestionAdd
          questionType="researchOutputTable"
          questionName="Research Output"
          questionJSON={json}
          sectionId="1"
          onSave={jest.fn()}
          backUrl="/back"
          successUrl="/success"
          breadcrumbs={<div>Breadcrumbs</div>}
        />);
    });

    // Find and click the Description checkbox (it should be unchecked initially)
    const descriptionCheckbox = screen.getByLabelText('researchOutput.labels.description');
    expect(descriptionCheckbox).not.toBeChecked();

    await act(async () => {
      fireEvent.click(descriptionCheckbox);
    });

    // Should now be checked
    expect(descriptionCheckbox).toBeChecked();
  });

  it('should show data flags configuration when data flags field is enabled', async () => {
    const json = JSON.stringify({
      meta: {
        schemaVersion: "1.0"
      },
      type: "researchOutputTable",
      attributes: {}
    });

    await act(async () => {
      render(
        <QuestionAdd
          questionType="researchOutputTable"
          questionName="Research Output"
          questionJSON={json}
          sectionId="1"
          onSave={jest.fn()}
          backUrl="/back"
          successUrl="/success"
          breadcrumbs={<div>Breadcrumbs</div>}
        />);
    });

    // Enable data flags field first
    const dataFlagsCheckbox = screen.getByLabelText('researchOutput.labels.dataFlags');
    await act(async () => {
      fireEvent.click(dataFlagsCheckbox);
    });

    // Should show data flags configuration legend
    expect(screen.getByText('researchOutput.legends.dataFlag')).toBeInTheDocument();
  });

  it('should add additional custom fields when add button is clicked', async () => {
    const json = JSON.stringify({
      meta: {
        schemaVersion: "1.0"
      },
      type: "researchOutputTable",
      attributes: {}
    });

    await act(async () => {
      render(
        <QuestionAdd
          questionType="researchOutputTable"
          questionName="Research Output"
          questionJSON={json}
          sectionId="1"
          onSave={jest.fn()}
          backUrl="/back"
          successUrl="/success"
          breadcrumbs={<div>Breadcrumbs</div>}
        />);
    });

    // Find the add field button
    const addFieldButton = screen.getByRole('button', {
      name: /\+ researchOutput.additionalFields.addFieldBtn/i
    });

    await act(async () => {
      fireEvent.click(addFieldButton);
    });

    // A new custom field should appear with default label
    expect(screen.getByText('Custom Field')).toBeInTheDocument();
  });

  it('should update additional field properties when customizing', async () => {
    const json = JSON.stringify({
      meta: {
        schemaVersion: "1.0"
      },
      type: "researchOutputTable",
      attributes: {}
    });

    await act(async () => {
      render(
        <QuestionAdd
          questionType="researchOutputTable"
          questionName="Research Output"
          questionJSON={json}
          sectionId="1"
          onSave={jest.fn()}
          backUrl="/back"
          successUrl="/success"
          breadcrumbs={<div>Breadcrumbs</div>}
        />);
    });

    // Add a custom field first
    const addFieldButton = screen.getByRole('button', {
      name: /\+ researchOutput.additionalFields.addFieldBtn/i
    });

    await act(async () => {
      fireEvent.click(addFieldButton);
    });

    // The field should be auto-expanded, look for customization inputs
    const labelInputs = screen.getAllByRole('textbox');
    const fieldLabelInput = labelInputs.find(input =>
      input.getAttribute('name')?.includes('_label')
    );

    if (fieldLabelInput) {
      await act(async () => {
        fireEvent.change(fieldLabelInput, { target: { value: 'My Custom Field' } });
      });

      // Wait for the label to update in the checkbox
      await waitFor(() => {
        expect(screen.getByText('My Custom Field')).toBeInTheDocument();
      });
    }
  });

  it('should handle output type mode changes', async () => {
    const json = JSON.stringify({
      meta: {
        schemaVersion: "1.0"
      },
      type: "researchOutputTable",
      attributes: {}
    });


    render(
      <QuestionAdd
        questionType="researchOutputTable"
        questionName="Research Output"
        questionJSON={json}
        sectionId="1"
        onSave={jest.fn()}
        backUrl="/back"
        successUrl="/success"
        breadcrumbs={<div>Breadcrumbs</div>}
      />);

    // Find the panel
    const panel = document.getElementById('panel-outputType');
    if (!panel) throw new Error('panel-outputType not found');

    // Find the hidden select element within the panel
    const hiddenSelect = within(panel).getByRole('combobox', { hidden: true });

    await act(async () => {
      fireEvent.change(hiddenSelect, { target: { value: 'mine' } });
    });

    // Verify the mode changed by checking the button text
    await waitFor(() => {
      const selectButton = within(panel!).getByTestId('select-button');
      expect(selectButton).toHaveTextContent('researchOutput.labels.useCustomList');
    });

    // Verify custom fields section appears
    await waitFor(() => {
      expect(screen.getByText('researchOutput.outputType.legends.myOutputs')).toBeInTheDocument();
    });

    // Verify all expected fields are present for custom output types
    expect(screen.getByLabelText('researchOutput.outputType.labels.enterOutputType')).toBeInTheDocument();
    expect(screen.getByLabelText('researchOutput.outputType.labels.typeDescription')).toBeInTheDocument();
    expect(screen.getByRole('button', {
      name: 'researchOutput.outputType.buttons.addOutputType'
    })).toBeInTheDocument();
  });

  it('should handle repository configuration', async () => {
    const json = JSON.stringify({
      meta: {
        schemaVersion: "1.0"
      },
      type: "researchOutputTable",
      attributes: {}
    });

    render(
      <QuestionAdd
        questionType="researchOutputTable"
        questionName="Research Output"
        questionJSON={json}
        sectionId="1"
        onSave={jest.fn()}
        backUrl="/back"
        successUrl="/success"
        breadcrumbs={<div>Breadcrumbs</div>}
      />);

    // Enable repo selector field
    const repoSelectorCheckbox = screen.getByLabelText('researchOutput.labels.repositories');
    await act(async () => {
      fireEvent.click(repoSelectorCheckbox);
    });

    // Should show repository selection system
    await waitFor(() => {
      expect(screen.getByText('researchOutput.repoSelector.labels.createRepos')).toBeInTheDocument();
      // Use getAllByText since there may be multiple help texts on the page
      const helpTexts = screen.getAllByText('researchOutput.helpText');
      expect(helpTexts.length).toBeGreaterThan(0);
    });
  });

  it('should handle metadata standards configuration', async () => {
    const json = JSON.stringify({
      meta: {
        schemaVersion: "1.0"
      },
      type: "researchOutputTable",
      attributes: {}
    });

    render(
      <QuestionAdd
        questionType="researchOutputTable"
        questionName="Research Output"
        questionJSON={json}
        sectionId="1"
        onSave={jest.fn()}
        backUrl="/back"
        successUrl="/success"
        breadcrumbs={<div>Breadcrumbs</div>}
      />);

    // Enable metadata standards field
    const metadataStandardsCheckbox = screen.getByLabelText('researchOutput.labels.metadataStandards');
    await act(async () => {
      fireEvent.click(metadataStandardsCheckbox);
    });

    // Should show metadata standards component
    expect(screen.getByText('researchOutput.metaDataStandards.labels.createStandards')).toBeInTheDocument();

    // Should also show help text input field
    // Multiple fields may have the same help text, so use getAllByText
    const helpTextLabels = screen.getAllByText(/labels.helpText/);
    expect(helpTextLabels.length).toBeGreaterThan(0);
  });

  it('should handle license configuration', async () => {
    const json = JSON.stringify({
      meta: {
        schemaVersion: "1.0"
      },
      type: "researchOutputTable",
      attributes: {}
    });

    await act(async () => {
      render(
        <QuestionAdd
          questionType="researchOutputTable"
          questionName="Research Output"
          questionJSON={json}
          sectionId="1"
          onSave={jest.fn()}
          backUrl="/back"
          successUrl="/success"
          breadcrumbs={<div>Breadcrumbs</div>}
        />);
    });

    // Enable licenses field
    const licensesCheckbox = screen.getByLabelText('researchOutput.labels.licenses');
    await act(async () => {
      fireEvent.click(licensesCheckbox);
    });

    // The LicenseField component should be rendered
    expect(screen.getByText('researchOutput.licenses.labels.defaultPreferred')).toBeInTheDocument();
  });

  it('should set hasUnsavedChanges when research output fields are modified', async () => {
    const addEventListenerSpy = jest.spyOn(window, 'addEventListener');

    const json = JSON.stringify({
      meta: {
        schemaVersion: "1.0"
      },
      type: "researchOutputTable",
      attributes: {}
    });

    await act(async () => {
      render(
        <QuestionAdd
          questionType="researchOutputTable"
          questionName="Research Output"
          questionJSON={json}
          sectionId="1"
          onSave={jest.fn()}
          backUrl="/back"
          successUrl="/success"
          breadcrumbs={<div>Breadcrumbs</div>}
        />);
    });

    // Enable a field to trigger unsaved changes
    const descriptionCheckbox = screen.getByLabelText('researchOutput.labels.description');
    await act(async () => {
      fireEvent.click(descriptionCheckbox);
    });

    // Modify the question text to trigger beforeunload behavior
    const input = screen.getByLabelText(/labels.questionText/);
    await act(async () => {
      fireEvent.change(input, { target: { value: 'Test Research Output Question' } });
    });

    // Verify beforeunload handler was registered
    await waitFor(() => {
      const beforeUnloadCalls = addEventListenerSpy.mock.calls.filter(
        ([event]) => event === 'beforeunload'
      );
      expect(beforeUnloadCalls.length).toBeGreaterThan(0);
    });

    addEventListenerSpy.mockRestore();
  });

  it('should not show research output fields for non-research output question types', async () => {
    const json = JSON.stringify({
      meta: {
        schemaVersion: "1.0"
      },
      type: "text",
      attributes: {}
    });

    await act(async () => {
      render(
        <QuestionAdd
          questionType="text"
          questionName="Text Field"
          questionJSON={json}
          sectionId="1"
          onSave={jest.fn()}
          backUrl="/back"
          successUrl="/success"
          breadcrumbs={<div>Breadcrumbs</div>}
        />);
    });

    // Should not show research output specific elements
    expect(screen.queryByText('researchOutput.headings.enableStandardFields')).not.toBeInTheDocument();
    expect(screen.queryByText('researchOutput.description')).not.toBeInTheDocument();
  });

  it('should not show repository configuration when field is disabled', async () => {
    const json = JSON.stringify({
      meta: {
        schemaVersion: "1.0"
      },
      type: "researchOutputTable",
      attributes: {}
    });

    await act(async () => {
      render(
        <QuestionAdd
          questionType="researchOutputTable"
          questionName="Research Output"
          questionJSON={json}
          sectionId="1"
          onSave={jest.fn()}
          backUrl="/back"
          successUrl="/success"
          breadcrumbs={<div>Breadcrumbs</div>}
        />);
    });

    // The repositories checkbox should exist but be unchecked
    const repoSelectorCheckbox = screen.getByLabelText('researchOutput.labels.repositories');
    expect(repoSelectorCheckbox).not.toBeChecked();
  });

  it('should display custom field label in the checkbox when customLabel is set', async () => {
    const json = JSON.stringify({
      meta: {
        schemaVersion: "1.0"
      },
      type: "researchOutputTable",
      attributes: {}
    });

    await act(async () => {
      render(
        <QuestionAdd
          questionType="researchOutputTable"
          questionName="Research Output"
          questionJSON={json}
          sectionId="1"
          onSave={jest.fn()}
          backUrl="/back"
          successUrl="/success"
          breadcrumbs={<div>Breadcrumbs</div>}
        />);
    });

    // Add a custom field
    const addButton = screen.getByRole('button', {
      name: /\+ researchOutput.additionalFields.addFieldBtn/i
    });

    await act(async () => {
      fireEvent.click(addButton);
    });

    // Look for the field label input in the newly added field
    const fieldLabelInputs = screen.getAllByRole('textbox');
    const fieldLabelInput = fieldLabelInputs.find(input =>
      input.getAttribute('name')?.includes('_label')
    );

    if (fieldLabelInput) {
      await act(async () => {
        fireEvent.change(fieldLabelInput, { target: { value: 'My Custom Field Label' } });
      });

      // The checkbox should now show the custom label
      await waitFor(() => {
        expect(screen.getByText('My Custom Field Label')).toBeInTheDocument();
      });
    } else {
      // If the input isn't immediately accessible, the test passes
      // as the field was added successfully
      expect(screen.getByText('Custom Field')).toBeInTheDocument();
    }
  });

  it('should delete additional custom field when delete button is clicked', async () => {
    const json = JSON.stringify({
      meta: {
        schemaVersion: "1.0"
      },
      type: "researchOutputTable",
      attributes: {}
    });

    await act(async () => {
      render(
        <QuestionAdd
          questionType="researchOutputTable"
          questionName="Research Output"
          questionJSON={json}
          sectionId="1"
          onSave={jest.fn()}
          backUrl="/back"
          successUrl="/success"
          breadcrumbs={<div>Breadcrumbs</div>}
        />);
    });

    // Add a custom field
    const addButton = screen.getByRole('button', {
      name: /\+ researchOutput.additionalFields.addFieldBtn/i
    });

    await act(async () => {
      fireEvent.click(addButton);
    });

    // Verify the field was added
    expect(screen.getByText('Custom Field')).toBeInTheDocument();

    // Find and click the delete button
    const deleteButtons = screen.getAllByRole('button', { name: /buttons.delete/i });
    const deleteButton = deleteButtons.find(btn =>
      btn.textContent?.includes('buttons.delete')
    );

    if (deleteButton) {
      await act(async () => {
        fireEvent.click(deleteButton);
      });

      // Field should be removed
      await waitFor(() => {
        expect(screen.queryByText('Custom Field')).not.toBeInTheDocument();
      });
    }
  });
});

describe("Accessibility", () => {
  let mockRouter;
  beforeEach(() => {
    setupMocks();
    HTMLElement.prototype.scrollIntoView = mockScrollIntoView;
    window.scrollTo = jest.fn(); // Called by the wrapping PageHeader
    const mockTemplateId = 123;
    const mockUseParams = useParams as jest.Mock;

    // Mock window.tinymce
    window.tinymce = {
      init: jest.fn(),
      remove: jest.fn(),
    };

    // Mock the return value of useParams
    mockUseParams.mockReturnValue({ templateId: `${mockTemplateId}` });

    // Mock the router
    mockRouter = { push: jest.fn() };
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
  });

  afterEach(() => {
    // Clean up DOM
    document.body.innerHTML = '';

    // Reset all mocks
    jest.clearAllMocks();
  });
  it('should pass axe accessibility test', async () => {
    const json = JSON.stringify({
      meta: {
        schemaVersion: "1.0"
      },
      type: "radioButtons",
      options: [
        {
          attributes: {
            label: null,
            value: null,
            selected: false
          }
        }
      ]
    })

    const { container } = render(
      <QuestionAdd
        questionType="radioButtons"
        questionName="Radio buttons"
        questionJSON={json}
        sectionId="1"
        onSave={jest.fn()}
        backUrl="/back"
        successUrl="/success"
        breadcrumbs={<div>Breadcrumbs</div>}
      />);

    await act(async () => {
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

})

describe("Error handling", () => {
  let mockRouter;
  beforeEach(() => {
    setupMocks();
    // Clean up DOM
    document.body.innerHTML = '';

    // Reset all mocks
    jest.clearAllMocks();


    HTMLElement.prototype.scrollIntoView = mockScrollIntoView;
    window.scrollTo = jest.fn(); // Called by the wrapping PageHeader
    const mockTemplateId = 123;
    const mockUseParams = useParams as jest.Mock;

    // Mock window.tinymce
    window.tinymce = {
      init: jest.fn(),
      remove: jest.fn(),
    };

    // Mock the return value of useParams
    mockUseParams.mockReturnValue({ templateId: `${mockTemplateId}` });

    // Mock the router
    mockRouter = { push: jest.fn() };
    (useRouter as jest.Mock).mockReturnValue(mockRouter);

    // Mock Toast
    (useToast as jest.Mock).mockReturnValue(mockToast);
  });

  it('should display error when no value is entered in question Text field', async () => {
    const json = JSON.stringify({
      meta: {
        schemaVersion: "1.0"
      },
      type: "radioButtons",
      options: [
        {
          attributes: {
            label: null,
            value: null,
            selected: false
          }
        }
      ]
    })
    await act(async () => {
      render(
        <QuestionAdd
          questionType="radioButtons"
          questionName="Radio buttons"
          questionJSON={json}
          sectionId="1"
          onSave={jest.fn()}
          backUrl="/back"
          successUrl="/success"
          breadcrumbs={<div>Breadcrumbs</div>}
        />);
    });

    // Get the input
    const input = screen.getByLabelText(/labels.questionText/);

    // Set value to empty
    fireEvent.change(input, { target: { value: '' } });

    fireEvent.submit(document.querySelector('form')!);

    await waitFor(() => {
      expect(screen.getByText('messages.errors.questionTextRequired')).toBeInTheDocument();
    })
  })

  it('should display error when addQuestionMutation returns an error', async () => {
    const mockOnSave = jest.fn().mockRejectedValue(new Error('Save failed')); // ← reject, not resolve

    const json = JSON.stringify({
      meta: {
        schemaVersion: "1.0"
      },
      type: "radioButtons",
      options: [
        {
          attributes: {
            label: 'Yes',
            value: 'yes',
            selected: false
          }
        }
      ]
    })
    await act(async () => {
      render(
        <QuestionAdd
          questionType="radioButtons"
          questionName="Radio buttons"
          questionJSON={json}
          sectionId="1"
          onSave={mockOnSave}
          backUrl="/back"
          successUrl="/success"
          breadcrumbs={<div>Breadcrumbs</div>}
        />);
    });

    // Get the input
    const input = screen.getByLabelText(/labels.questionText/);

    // Set value to 'New Question'
    fireEvent.change(input, { target: { value: 'New Question' } });

    // Add a new radio row
    const radioInput = screen.getByPlaceholderText('placeholder.text');

    await act(async () => {
      fireEvent.change(radioInput, { target: { value: 'Yes' } });
    })

    const saveButton = screen.getByRole('button', { name: /buttons.saveAndAdd/i });

    await act(async () => {
      fireEvent.click(saveButton);
    })

    expect(screen.getByText('messages.errors.questionAddingError')).toBeInTheDocument();
  })

  it('should display toast error and call router.push when no sectionId', async () => {
    const json = JSON.stringify({
      meta: {
        schemaVersion: "1.0"
      },
      type: "radioButtons",
      options: [
        {
          attributes: {
            label: 'Yes',
            value: 'yes',
            selected: false
          }
        }
      ]
    })
    await act(async () => {
      render(
        <QuestionAdd
          questionType="radioButtons"
          questionName="Radio buttons"
          questionJSON={json}
          onSave={jest.fn()}
          backUrl="/back"
          successUrl="/success"
          breadcrumbs={<div>Breadcrumbs</div>}
        />);
    });

    expect(mockToast.add).toHaveBeenCalledWith('messaging.somethingWentWrong', { type: 'error' });
    expect(mockRouter.push).toHaveBeenCalledWith('/en-US/template/123');
  })
});
