import React from 'react';

import { act, fireEvent, render, screen, within } from '@/utils/test-utils';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { useQuery } from '@apollo/client/react';
import {
  TemplateDocument,
  RecommendedLicensesDocument,
  DefaultResearchOutputTypesDocument
} from '@/generated/graphql';
import QuestionView from '@/components/QuestionView';
import {
  AffiliationSearchQuestionType,
  CheckboxesQuestionType,
  CurrencyQuestionType,
  DateRangeQuestionType,
  DateQuestionType,
  EmailQuestionType,
  MultiselectBoxQuestionType,
  NumberQuestionType,
  NumberRangeQuestionType,
  RadioButtonsQuestionType,
  ResearchOutputTableQuestionType,
  SelectBoxQuestionType,
  TextQuestionType,
  URLQuestionType
} from "@dmptool/types";
import { TypeAheadInputProps } from '@/components/Form/TypeAheadWithOther/TypeAheadWithOther';
import mocksAffiliations from '@/__mocks__/common/mockAffiliations.json';

expect.extend(toHaveNoViolations);

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
}));


const mockQuestion = {
  guidanceText: 'Question guidance...',
  questionText: 'Question text?',
  requirementText: 'Question requirements',
  sampleText: 'Lorem ipsum dolor sit...',
  useSampleTextAsDefault: false,
  json: JSON.stringify({
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
  }),
};


const mockTemplate = {
  name: "DMP Template from Dataverse",
  description: "DMP Template from Dataverse",
  errors: null,
  latestPublishVersion: "v1",
  latestPublishDate: "1648835084000",
  created: "1412980160000",
  sections: [
    {
      id: 67,
      displayOrder: 1,
      name: "Data description",
      questions: [mockQuestion],
    },
  ]
};

// Cast with jest.mocked utility
const mockUseQuery = jest.mocked(useQuery);

const setupMocks = () => {
  // Create stable references OUTSIDE mockImplementation
  const stableTemplateReturn = {
    data: { template: mockTemplate },
    loading: false,
    error: null,
  };

  const stableRecommendedLicensesReturn = {
    data: {
      recommendedLicenses: [
        {
          __typename: "License",
          name: "CC0-1.0",
          id: 54,
          uri: "https://spdx.org/licenses/CC0-1.0.json"
        },
        {
          __typename: "License",
          name: "CC-BY-4.0",
          id: 55,
          uri: "https://spdx.org/licenses/CC-BY-4.0.json"
        },
        {
          __typename: "License",
          name: "MIT",
          id: 56,
          uri: "https://spdx.org/licenses/MIT.json"
        }
      ]
    },
    loading: false,
    error: null,
  };

  const stableDefaultResearchOutputTypesReturn = {
    data: {
      defaultResearchOutputTypes: [
        {
          __typename: "ResearchOutputType",
          id: 1,
          name: "Audiovisual",
          value: "audiovisual",
          errors: {
            __typename: "ResearchOutputTypeErrors",
            general: null,
            name: null,
            value: null
          },
          description: "A series of visual representations imparting an impression of motion when shown in succession. May or may not include sound. (e.g. films, video, etc.)"
        },
        {
          __typename: "ResearchOutputType",
          id: 2,
          name: "Collection",
          value: "collection",
          errors: {
            __typename: "ResearchOutputTypeErrors",
            general: null,
            name: null,
            value: null
          },
          description: "An aggregation of resources, which may encompass collections of one resourceType as well as those of mixed types. A collection is described as a group; its parts may also be separately described. (e.g. A collection of samples, or various files making up a report)"
        },
        {
          __typename: "ResearchOutputType",
          id: 3,
          name: "Data paper",
          value: "data-paper",
          errors: {
            __typename: "ResearchOutputTypeErrors",
            general: null,
            name: null,
            value: null
          },
          description: "A factual and objective publication with a focused intent to identify and describe specific data, sets of data, or data collections to facilitate discoverability. (i.e. A data paper describes data provenance and methodologies used in the gathering, processing, organizing, and representing the data)"
        }
      ]
    },
    loading: false,
    error: null,
  };

  mockUseQuery.mockImplementation((document) => {
    if (document === TemplateDocument) {
      /* eslint-disable @typescript-eslint/no-explicit-any */
      return stableTemplateReturn as any;
    }
    if (document === RecommendedLicensesDocument) {
      /* eslint-disable @typescript-eslint/no-explicit-any */
      return stableRecommendedLicensesReturn as any;
    }
    if (document === DefaultResearchOutputTypesDocument) {
      /* eslint-disable @typescript-eslint/no-explicit-any */
      return stableDefaultResearchOutputTypesReturn as any;
    }
  });
};

describe("QuestionView", () => {
  beforeEach(() => {
    setupMocks();
    // Mock window.tinymce
    window.tinymce = {
      init: jest.fn(),
      remove: jest.fn(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  })

  it("should render the view", async () => {
    render(
      <QuestionView
        question={mockQuestion}
        isPreview={true}
        templateId={1}
        path="/template/123"
      />);

    expect(screen.getByTestId('question-card')).toBeInTheDocument();
  });

  it('should render the textarea element with class "question-text-editor"', async () => {
    render(
      <QuestionView
        question={mockQuestion}
        isPreview={true}
        templateId={1}
        path="/template/123"
      />
    );

    expect(screen.getByLabelText(/question-text-editor/i)).toBeInTheDocument();
  });

  it('should return null when question is null', () => {
    const { container } = render(
      <QuestionView
        isPreview={false}
        question={null}
        templateId={1}
        path="/template/123"
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('should not render the requirements section when requirementText is null', () => {
    const mockQuestion = {
      questionText: 'Sample Question',
      requirementText: null,
      guidanceText: 'Sample Guidance',
      questionTypeId: 1,
      modified: '2023-01-01',
    };

    render(
      <QuestionView
        isPreview={false}
        question={mockQuestion}
        templateId={1}
        path="/template/123"
      />
    );

    const requirementsSection = screen.queryByText(/requirements/i);
    expect(requirementsSection).toBeNull();
  });

  it('should render the textarea element with class "question-text-editor"', async () => {
    render(
      <QuestionView
        question={mockQuestion}
        isPreview={true}
        templateId={1}
        path="/template/123"
      />
    );

    const cardBody = screen.getByTestId('card-body');
    const textarea = cardBody.querySelector('textarea.question-text-editor');
    expect(textarea).toBeInTheDocument();
  });

  it('should render the Text Field question type', async () => {
    const json: TextQuestionType = {
      meta: {
        schemaVersion: "1.0"
      },
      type: "text",
      attributes: {
        maxLength: 255
      }
    };
    const mockQuestionWithTextField = { ...mockQuestion, json: JSON.stringify(json) };

    render(
      <QuestionView
        question={mockQuestionWithTextField}
        isPreview={true}
        templateId={1}
        path="/template/123"
      />
    );
    expect(screen.getByTestId('card-body').textContent).toContain('text');

    // Find the input by its placeholder or role and name
    const input = screen.getByPlaceholderText('Enter text');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('type', 'text');
    expect(input).not.toHaveAttribute('maxLength', 255);
    expect(input).toHaveAttribute('name', 'textField');

    // Simulate typing
    await userEvent.type(input, 'Hello world!');
    expect(input).toHaveValue('Hello world!');
  });

  it('should render the Radio Buttons question type', async () => {
    const json: RadioButtonsQuestionType = {
      meta: {
        schemaVersion: "1.0"
      },
      type: "radioButtons",
      attributes: {},
      options: [
        {
          label: "Yes",
          value: "Yes",
          selected: true
        },
        {
          label: "No",
          value: "No",
          selected: false
        },
        {
          label: "Maybe",
          value: "Maybe",
          selected: false
        }
      ]
    };
    const mockQuestionWithRadioButtons = { ...mockQuestion, json: JSON.stringify(json) };

    render(
      <QuestionView
        question={mockQuestionWithRadioButtons}
        isPreview={true}
        templateId={1}
        path="/template/123"
      />
    );
    expect(screen.getByTestId('card-body').textContent).toContain('Yes');
    expect(screen.getByTestId('card-body').textContent).toContain('No');
    expect(screen.getByTestId('card-body').textContent).toContain('Maybe');
    const radioButtons = screen.getByTestId('card-body').querySelectorAll('input[type="radio"]');
    expect(radioButtons[0]).toBeChecked();
    act(() => {
      fireEvent.click(radioButtons[1]);
    })
    expect(radioButtons[1]).toBeChecked();
  });

  it('should render the Check Boxes question type', () => {
    const json: CheckboxesQuestionType = {
      type: "checkBoxes",
      meta: {
        schemaVersion: "1.0",
      },
      attributes: {
        labelTranslationKey: "questions.research_methods"
      },
      options: [
        {
          label: "Interviews",
          value: "interviews",
          selected: true
        },
        {
          label: "Surveys",
          value: "surveys",
          selected: false
        },
        {
          label: "Observations",
          value: "observations",
          selected: true
        },
        {
          label: "Focus Groups",
          value: "focus_groups",
          selected: true
        }
      ]
    };
    const mockQuestionWithCheckBoxes = { ...mockQuestion, json: JSON.stringify(json) };

    render(
      <QuestionView
        question={mockQuestionWithCheckBoxes}
        isPreview={true}
        templateId={1}
        path="/template/123"
      />
    );

    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes).toHaveLength(4);
    expect(checkboxes[0]).toHaveAttribute('value', 'interviews');
    expect(checkboxes[1]).toHaveAttribute('value', 'surveys');
    expect(checkboxes[2]).toHaveAttribute('value', 'observations');
    expect(checkboxes[3]).toHaveAttribute('value', 'focus_groups');
    expect(checkboxes[0]).toBeChecked();
    expect(checkboxes[1]).not.toBeChecked();
    expect(checkboxes[2]).toBeChecked();
    expect(checkboxes[3]).toBeChecked();
    act(() => {
      fireEvent.click(checkboxes[1]);
    })
    expect(checkboxes[1]).toBeChecked();
  });

  it('should render the Select Box question type', () => {
    const json: SelectBoxQuestionType = {
      type: 'selectBox',
      meta: {
        schemaVersion: '1.0',
      },
      attributes: {
        multiple: false
      },
      options: [
        {
          label: 'Option A',
          value: 'Option A',
          selected: true,
        },
        {
          label: 'Option B',
          value: 'Option B',
          selected: false
        },
        {
          label: 'Option C',
          value: 'Option C',
          selected: false
        },
      ],
    };
    const mockQuestionWithSelectBox = { ...mockQuestion, json: JSON.stringify(json) };

    render(
      <QuestionView
        question={mockQuestionWithSelectBox}
        isPreview={true}
        templateId={1}
        path="/template/123"
      />
    );
    expect(screen.getByTestId('card-body').textContent).toContain('Option A');
  });

  it('should render the Multi-Select Box question type', () => {
    const json: MultiselectBoxQuestionType = {
      type: 'multiselectBox',
      meta: {
        schemaVersion: '1.0',
      },
      attributes: {
        multiple: true
      },
      options: [
        {
          label: 'Option A',
          value: 'Option A',
          selected: true,
        },
        {
          label: 'Option B',
          value: 'Option B',
          selected: false
        },
        {
          label: 'Option C',
          value: 'Option C',
          selected: false
        },
      ],
    };
    const mockQuestionWithMultiselectBox = { ...mockQuestion, json: JSON.stringify(json) };

    render(
      <QuestionView
        question={mockQuestionWithMultiselectBox}
        isPreview={true}
        templateId={1}
        path="/template/123"
      />
    );
    expect(screen.getByTestId('card-body').textContent).toContain('Option A');
  });

  it('should render the date question type', async () => {
    const json: DateQuestionType = {
      meta: {
        schemaVersion: "1.0"
      },
      type: "date",
      attributes: {
        max: "2025-06-25",
        min: "1900-01-01",
        step: 1
      }
    };
    const mockQuestionWithDateField = { ...mockQuestion, json: JSON.stringify(json) };

    const user = userEvent.setup();
    async function slowType(user: ReturnType<typeof userEvent.setup>, element: HTMLElement, text: string, delayMs = 100) {
      await user.click(element); // ensure focus
      for (const char of text) {
        await user.keyboard(char);
        await new Promise(res => setTimeout(res, delayMs)); // manual delay
      }
    }

    render(
      <QuestionView
        question={mockQuestionWithDateField}
        isPreview={true}
        templateId={1}
        path="/template/123"
      />
    );
    expect(screen.getByTestId('card-body').textContent).toContain('Date');
    expect(screen.getByRole('presentation')).toBeInTheDocument();
    // Get all editable date segments
    const dateGroup = screen.getByRole('group');
    const segments = within(dateGroup).getAllByRole('spinbutton');

    const [month, day, year] = segments;

    await slowType(user, month, '12');
    await slowType(user, day, '25');
    await slowType(user, year, '2025');


    // Grab the hidden input by its title
    const hiddenInput = screen.getByTitle('');
    // Check that it eventually gets updated
    expect(hiddenInput).toHaveAttribute('value', '2025-12-25'); // adjust format as needed
  });


  it('should render the date range question type', () => {
    const json: DateRangeQuestionType = {
      meta: {
        schemaVersion: "1.0"
      },
      type: "dateRange",
      attributes: {},
      columns: {
        end: {
          label: "Ending",
          step: 1
        },
        start: {
          label: "Starting",
          step: 1
        }
      }
    };
    const mockQuestionWithDateRange = { ...mockQuestion, json: JSON.stringify(json) };

    render(
      <QuestionView
        question={mockQuestionWithDateRange}
        isPreview={true}
        templateId={1}
        path="/template/123"
      />
    );
    expect(screen.getByTestId('card-body').textContent).toContain('Starting');
    expect(screen.getByTestId('card-body').textContent).toContain('Ending');
    const groups = screen.queryAllByRole('group');
    expect(groups).toHaveLength(2);
  });

  it('should render the number question type', async () => {
    const json: NumberQuestionType = {
      meta: {
        schemaVersion: "1.0"
      },
      type: "number",
      attributes: {
        max: 10000000,
        min: 0,
        step: 1
      }
    };
    const mockQuestionWithNumberField = { ...mockQuestion, json: JSON.stringify(json) };

    render(
      <QuestionView
        question={mockQuestionWithNumberField}
        isPreview={true}
        templateId={1}
        path="/template/123"
      />
    );
    expect(screen.getByTestId('card-body').textContent).toContain('number');
    const groups = screen.queryAllByRole('button');
    expect(groups).toHaveLength(2);

    // Find the input by its placeholder or role and name
    const input = screen.getByPlaceholderText('number');
    expect(input).toBeInTheDocument();

    // Simulate typing
    await userEvent.type(input, '1');
    expect(input).toHaveValue('01');
  });

  it('should render the number range question type', () => {
    const json: NumberRangeQuestionType = {
      meta: {
        schemaVersion: "1.0"
      },
      type: "numberRange",
      attributes: {},
      columns: {
        end: {
          label: "Ending",
          step: 1,
          min: 0
        },
        start: {
          label: "Beginning",
          step: 1,
          min: 0
        }
      }
    };
    const mockQuestionWithNumberRange = { ...mockQuestion, json: JSON.stringify(json) };

    render(
      <QuestionView
        question={mockQuestionWithNumberRange}
        isPreview={true}
        templateId={1}
        path="/template/123"
      />
    );
    expect(screen.getByTestId('card-body').textContent).toContain('Beginning');
    expect(screen.getByTestId('card-body').textContent).toContain('Ending');
    const groups = screen.queryAllByRole('button');
    expect(groups).toHaveLength(4);
  });

  it('should render the currency question type', () => {
    const json: CurrencyQuestionType = {
      meta: {
        schemaVersion: "1.0"
      },
      type: "currency",
      attributes: {
        denomination: "USD",
        max: 10000000,
        min: 0,
        step: 0.01
      }
    };
    const mockQuestionWithCurrencyField = { ...mockQuestion, json: JSON.stringify(json) };

    render(
      <QuestionView
        question={mockQuestionWithCurrencyField}
        isPreview={true}
        templateId={1}
        path="/template/123"
      />
    );
    expect(screen.queryByRole('button', { name: /increase/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /decrease/i })).not.toBeInTheDocument();
    expect(screen.getByText('$')).toBeInTheDocument();
    expect(screen.getByDisplayValue('0')).toBeInTheDocument();

    const groups = screen.queryAllByRole('button');
    expect(groups).toHaveLength(0);
  });


  it('should render the url question type', async () => {
    const json: URLQuestionType = {
      meta: {
        schemaVersion: "1.0"
      },
      type: "url",
      attributes: {
        pattern: "https?://.+",
        maxLength: 2048,
        minLength: 2
      }
    };
    const mockQuestionWithURLField = { ...mockQuestion, json: JSON.stringify(json) };

    render(
      <QuestionView
        question={mockQuestionWithURLField}
        isPreview={true}
        templateId={1}
        path="/template/123"
      />
    );
    expect(screen.getByTestId('card-body').textContent).toContain('url');
    // Find the input by its placeholder or role and name
    const input = screen.getByPlaceholderText('url');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('type', 'url');
    expect(input).toHaveAttribute('maxLength', '2048');
    expect(input).toHaveAttribute('minLength', '2');
    expect(input).toHaveAttribute('name', 'urlInput');

    // Simulate typing
    await userEvent.type(input, 'Hello world!');
    expect(input).toHaveValue('Hello world!');
  });

  it('should render the email question type', () => {
    const json: EmailQuestionType = {
      meta: {
        schemaVersion: "1.0"
      },
      type: "email",
      attributes: {
        pattern: "^.+$",
        multiple: false,
        maxLength: 100,
        minLength: 0
      }
    };
    const mockQuestionWithEmailField = { ...mockQuestion, json: JSON.stringify(json) };

    render(
      <QuestionView
        question={mockQuestionWithEmailField}
        isPreview={true}
        templateId={1}
        path="/template/123"
      />
    );
    screen.getByRole('textbox', { name: /email/i });
    screen.getByPlaceholderText('email');
    screen.getByDisplayValue('');
    expect(screen.getByRole('textbox')).toHaveAttribute('type', 'email');
    expect(screen.getByRole('textbox')).toHaveAttribute('minLength', '0');
    expect(screen.getByRole('textbox')).toHaveAttribute('maxLength', '100');

  });

  it('should render the typeahead search question type', () => {
    const json: AffiliationSearchQuestionType = {
      meta: {
        schemaVersion: "1.0"
      },
      type: "affiliationSearch",
      attributes: {
        label: 'Enter a search term to find your affiliation',
      },
      graphQL: {
        query: "\nquery Affiliations($name: String!){\n  affiliations(name: $name) {\n    totalCount\n    nextCursor\n    items {\n      id\n      displayName\n      uri\n    }\n  }\n}",
        queryId: "useAffiliationsQuery",
        variables: [
          {
            name: "name",
            type: "string",
            label: "Name",
            minLength: 3,
            labelTranslationKey: "SignupPage.institutionHelp"
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
    const mockQuestionWithAffiliationSearch = { ...mockQuestion, json: JSON.stringify(json) };

    render(
      <QuestionView
        question={mockQuestionWithAffiliationSearch}
        isPreview={true}
        templateId={1}
        path="/template/123"
      />
    );
    expect(screen.getByTestId('card-body').textContent).toContain('Enter a search term to find your affiliation');
    const searchInput = screen.getByRole('textbox');
    expect(searchInput).toBeInTheDocument();
    expect(searchInput).toHaveValue('Test Institution');
  });

  it('should render the researchOutputTable question type', async () => {
    const json: ResearchOutputTableQuestionType = {
      meta: {
        title: "Research Output Table",
        schemaVersion: "1.0",
        usageDescription: "A table for collecting structured research output data",
      },
      type: "researchOutputTable",
      columns: [
        {
          commonStandardId: "title",
          help: "Enter the title of this research output",
          content: {
            meta: {
              schemaVersion: "1.0",
            },
            type: "text",
            attributes: {
              maxLength: 500,
            },
          },
          enabled: true,
          heading: "Title",
          required: true,
        },
        {
          commonStandardId: "description",
          help: "Enter a brief description of this research output",
          content: {
            meta: {
              schemaVersion: "1.0",
            },
            type: "textArea",
            attributes: {
              cols: 20,
              rows: 2,
              maxLength: 10000,
              asRichText: true,
              label: "Description",
              labelTranslationKey: "labels.description",
            },
          },
          enabled: true,
          heading: "Description",
          required: true,
        },
        {
          commonStandardId: "type",
          help: "Select the type of this research output",
          content: {
            meta: {
              schemaVersion: "1.0",
            },
            type: "selectBox",
            options: [
              {
                label: "Dataset",
                value: "dataset",
                selected: false,
              },
              {
                label: "Software",
                value: "software",
                selected: false,
              },
            ],
            attributes: {
              multiple: false,
              label: "Output Type",
              labelTranslationKey: "labels.outputType",
            },
          },
          enabled: true,
          heading: "Output Type",
          required: true,
        },
        {
          heading: "Anticipated Release Date",
          commonStandardId: "issued",
          help: "",
          required: false,
          enabled: false,
          content: {
            type: "date",
            meta: { schemaVersion: "1.0" },
            attributes: { step: 1 },
          },
        },
        {
          heading: "Anticipated File Size",
          commonStandardId: "byte_size",
          help: "",
          required: false,
          enabled: false,
          content: {
            type: "numberWithContext",
            meta: { schemaVersion: "1.0" },
            attributes: {
              step: 1,
              min: 0,
              context: [
                { label: "Bytes", value: "bytes", selected: false },
                { label: "KB", value: "kb", selected: true },
                { label: "MB", value: "mb", selected: false },
                { label: "GB", value: "gb", selected: true },
                { label: "TB", value: "tb", selected: true },
                { label: "PB", value: "pb", selected: true },
              ],
            },
          },
        },
      ],
      attributes: {
        help: "",
        label: "",
        canAddRows: true,
        initialRows: 1,
        canRemoveRows: true,
        labelTranslationKey: "",
      },
    };
    const mockQuestionWithResearchOutput = { ...mockQuestion, json: JSON.stringify(json) };

    render(
      <QuestionView
        question={mockQuestionWithResearchOutput}
        isPreview={true}
        templateId={1}
        path="/template/123"
      />
    );

    // Check that the research output table component is rendered
    const cardBody = screen.getByTestId('card-body');
    expect(cardBody).toBeInTheDocument();
    // Check that the form fields are rendered
    expect(screen.getByText('Title')).toBeInTheDocument();
    expect(screen.getByText('headings.addResearchOutput')).toBeInTheDocument();
    expect(screen.getByText('Enter the title of this research output')).toBeInTheDocument();
    expect(screen.getByText('labels.description')).toBeInTheDocument();
    expect(screen.getByText('Enter a brief description of this research output')).toBeInTheDocument();
    expect(screen.getByText('labels.outputType')).toBeInTheDocument();
    expect(screen.getAllByText('Select the type of this research output')).toHaveLength(1);
    expect(screen.getByText('labels.anticipatedReleaseDate')).toBeInTheDocument();
    expect(screen.getByText('labels.anticipatedFileSize')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'buttons.save' })).toBeInTheDocument();
  });

  it('should not execute logic when question is undefined', () => {
    render(
      <QuestionView
        question={undefined}
        isPreview={true}
        templateId={1}
        path="/template/123"
      />
    );

    // Assert that no elements are rendered
    expect(screen.queryByTestId('question-card')).toBeNull();
  });

  it('should pass axe accessibility test', async () => {
    const { container } = render(
      <QuestionView
        question={mockQuestion}
        isPreview={true}
        templateId={1}
        path="/template/123"
      />
    );

    await act(async () => {
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
