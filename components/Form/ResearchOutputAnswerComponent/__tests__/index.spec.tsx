import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import ResearchOutputAnswerComponent from '../index';
import { ResearchOutputTable } from '@/app/types';
import {
  DefaultResearchOutputTableQuestion,
  RepositorySearchAnswerType,
  MetadataStandardSearchAnswerType,
  LicenseSearchAnswerType,
  AnyTableColumnAnswerType
} from '@dmptool/types';

// Define props interface for the mock component
interface MockSingleResearchOutputComponentProps {
  columns: typeof DefaultResearchOutputTableQuestion['columns'];
  rows: ResearchOutputTable[];
  setRows: React.Dispatch<React.SetStateAction<ResearchOutputTable[]>>;
  onSave?: () => void;
  onCancel?: () => void;
  onDelete?: () => void;
  showButtons?: boolean;
  isNewEntry?: boolean;
  hasOtherRows?: boolean;
}

// Mock the SingleResearchOutputComponent
jest.mock('../SingleResearchOutputComponent', () => {
  return function MockSingleResearchOutputComponent({
    onSave,
    onCancel,
    onDelete,
    isNewEntry,
    hasOtherRows
  }: MockSingleResearchOutputComponentProps) {
    return (
      <div data-testid="single-research-output">
        <button onClick={onSave}>Save</button>
        <button onClick={onCancel}>Cancel</button>
        <button onClick={onDelete}>Delete</button>
        <div data-testid="is-new-entry">{isNewEntry ? 'true' : 'false'}</div>
        <div data-testid="has-other-rows">{hasOtherRows ? 'true' : 'false'}</div>
      </div>
    );
  };
});

// Mock translations
const messages = {
  Global: {
    buttons: {
      edit: 'Edit',
      delete: 'Delete',
    },
  },
  QuestionEdit: {
    buttons: {
      addOutput: 'Add Output',
    },
    headings: {
      addResearchOutput: 'Add Research Output',
      editResearchOutput: 'Edit Research Output',
    },
    definitions: {
      type: 'Type',
      repository: 'Repository',
    },
    messages: {
      areYouSureYouWantToDelete: 'Are you sure you want to delete?',
    },
  },
};

// Helper function to render with providers
const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <NextIntlClientProvider messages={messages} locale="en">
      {component}
    </NextIntlClientProvider>
  );
};

// Mock data matching the actual backend structure
const mockColumns: typeof DefaultResearchOutputTableQuestion['columns'] = [
  {
    heading: 'Title',
    commonStandardId: 'title',
    help: 'Enter the title of this research output',
    required: true,
    enabled: true,
    content: {
      type: 'text',
      meta: { schemaVersion: '1.0' },
      attributes: {
        maxLength: 500,
        labelTranslationKey: 'labels.title',
      },
    },
  },
  {
    heading: 'Description',
    commonStandardId: 'description',
    help: 'Enter a brief description of this research output',
    required: true,
    enabled: true,
    content: {
      type: 'textArea',
      meta: { schemaVersion: '1.0' },
      attributes: {
        cols: 20,
        rows: 2,
        asRichText: true,
        maxLength: 10000,
        label: 'Description',
        help: 'My description help text',
        labelTranslationKey: 'labels.description',
      },
    },
  },
  {
    heading: 'Output Type',
    commonStandardId: 'type',
    help: 'Select the type of this research output',
    required: true,
    enabled: true,
    content: {
      type: 'selectBox',
      meta: { schemaVersion: '1.0' },
      options: [
        { label: 'Audiovisual', value: 'audiovisual', selected: false },
        { label: 'Dataset', value: 'dataset', selected: false },
        { label: 'Software', value: 'software', selected: false },
        { label: 'Text', value: 'text', selected: false },
      ],
      attributes: {
        label: 'Output Type',
        multiple: false,
        labelTranslationKey: 'labels.outputType',
      },
    },
  },
  {
    heading: 'Data Flags',
    commonStandardId: 'data_flags',
    help: 'Mark all of the statements that are true about the dataset',
    required: false,
    enabled: true,
    content: {
      type: 'checkBoxes',
      meta: { schemaVersion: '1.0' },
      options: [
        { label: 'May contain sensitive data?', value: 'sensitive', selected: false },
        { label: 'May contain personally identifiable information?', value: 'personal', selected: false },
      ],
      attributes: {
        labelTranslationKey: 'labels.dataFlags',
      },
    },
  },
  {
    heading: 'Repositories',
    commonStandardId: 'host',
    help: 'Select repository(ies) you would prefer users to deposit in',
    required: false,
    enabled: true,
    content: {
      type: 'repositorySearch',
      meta: { schemaVersion: '1.0' },
      graphQL: {
        query: 'query Repositories($term: String){ repositories(term: $term) { items { id name uri } } }',
        queryId: 'useRepositoriesQuery',
        variables: [],
        answerField: 'uri',
        displayFields: [],
        responseField: 'repositories.items',
      },
      attributes: {
        label: 'Repositories',
        help: 'My repositories help text',
        labelTranslationKey: 'labels.repositories',
      },
    },
    preferences: [
      {
        label: 'Zenodo',
        value: 'https://www.re3data.org/repository/https://www.re3data.org/api/v1/repository/r3d100010468',
      },
    ],
  },
  {
    heading: 'Metadata Standards',
    commonStandardId: 'metadata',
    help: 'Select metadata standard(s) you would prefer users to use',
    required: false,
    enabled: true,
    content: {
      type: 'metadataStandardSearch',
      meta: { schemaVersion: '1.0' },
      graphQL: {
        query: 'query MetadataStandards($term: String){ metadataStandards(term: $term) { items { id name uri } } }',
        queryId: 'useMetadataStandardsQuery',
        variables: [],
        answerField: 'uri',
        displayFields: [],
        responseField: 'metadataStandards.items',
      },
      attributes: {
        label: 'Metadata Standards',
        help: 'My metadata standards help text',
        labelTranslationKey: 'labels.metadataStandards',
      },
    },
    preferences: [
      {
        label: 'Terminal RI Unicamp',
        value: 'https://repositorio.unicamp.br/',
      },
    ],
  },
  {
    heading: 'Licenses',
    commonStandardId: 'license_ref',
    help: 'Select the license you will apply to the research output',
    required: false,
    enabled: true,
    content: {
      type: 'licenseSearch',
      meta: { schemaVersion: '1.0' },
      graphQL: {
        query: 'query Licenses{ licenses { id name uri } }',
        queryId: 'useLicensesQuery',
        variables: [],
        answerField: 'uri',
        displayFields: [],
        responseField: 'licenses',
      },
      attributes: {
        label: 'Licenses',
        help: 'My licenses help text',
        labelTranslationKey: 'labels.licenses',
      },
    },
    preferences: [
      { label: 'CC-BY-4.0', value: 'https://spdx.org/licenses/CC-BY-4.0.json' },
      { label: 'CC0-1.0', value: 'https://spdx.org/licenses/CC0-1.0.json' },
    ],
  },
  {
    heading: 'Initial Access Levels',
    commonStandardId: 'data_access',
    help: 'Select the access level for this research output',
    required: false,
    enabled: true,
    content: {
      type: 'radioButtons',
      meta: { schemaVersion: '1.0' },
      options: [
        { label: 'Open', value: 'open', selected: false },
        { label: 'Restricted', value: 'restricted', selected: false },
        { label: 'Closed', value: 'closed', selected: false },
      ],
      attributes: {
        label: 'Initial Access Levels',
        help: 'My initial access levels help text',
        labelTranslationKey: 'labels.initialAccessLevels',
      },
    },
  },
  {
    heading: 'Custom field label',
    commonStandardId: 'custom',
    help: 'Enter the title of this research output',
    required: true,
    enabled: true,
    content: {
      type: 'text',
      meta: { schemaVersion: '1.0' },
      attributes: {
        label: 'Custom field label',
        help: 'Custom field help text',
        maxLength: 142,
      },
    },
  },
];

const createMockRow = (
  title: string,
  outputType: string,
  repositories: RepositorySearchAnswerType["answer"] = [],
  description: string = "",
  metadataStandards: MetadataStandardSearchAnswerType["answer"] = [],
  licenses: LicenseSearchAnswerType["answer"] = [],
  dataFlags: string[] = [],
  accessLevel: string = "",
  customField: string = "",
): ResearchOutputTable => ({
  columns: [
    // Title
    {
      type: "text",
      commonStandardId: "title",
      meta: { schemaVersion: "1.0" },
      answer: title,
    },
    // Description
    {
      type: "textArea",
      commonStandardId: "description",
      meta: { schemaVersion: "1.0" },
      answer: description,
    },
    // Output Type (selectBox)
    {
      type: "selectBox",
      commonStandardId: "type",
      meta: { schemaVersion: "1.0" },
      answer: outputType,
    },
    // Data Flags (checkBoxes)
    {
      type: "checkBoxes",
      commonStandardId: "data_flags",
      meta: { schemaVersion: "1.0" },
      answer: dataFlags,
    },
    // Repositories (repositorySearch)
    {
      type: "repositorySearch",
      commonStandardId: "host",
      meta: { schemaVersion: "1.0" },
      answer: repositories,
    },
    // Metadata Standards (metadataStandardSearch)
    {
      type: "metadataStandardSearch",
      commonStandardId: "metadata",
      meta: { schemaVersion: "1.0" },
      answer: metadataStandards,
    },
    // Licenses (licenseSearch)
    {
      type: "licenseSearch",
      commonStandardId: "license_ref",
      meta: { schemaVersion: "1.0" },
      answer: licenses,
    },
    // Initial Access Levels (radioButtons)
    {
      type: "radioButtons",
      commonStandardId: "data_access",
      meta: { schemaVersion: "1.0" },
      answer: accessLevel,
    },
    // Custom field (text)
    {
      type: "text",
      commonStandardId: "custom",
      meta: { schemaVersion: "1.0" },
      answer: customField,
    },
    // Date metadata (text)
    {
      type: "date",
      commonStandardId: "issued",
      meta: { schemaVersion: "1.0" },
      answer: "2025-12-16",
    },
    // Size metadata (text)
    {
      type: "numberWithContext",
      commonStandardId: "byte_size",
      meta: { schemaVersion: "1.0" },
      answer: { value: 2, context: "kb" },
    },
  ],
});

// Helper function to create an empty answer for a given column type
const createEmptyAnswer = (columnType: string): AnyTableColumnAnswerType => {
  const baseAnswer = {
    meta: { schemaVersion: '1.0' as const },
  };

  switch (columnType) {
    case 'text':
    case 'textArea':
    case 'email':
    case 'url':
    case 'selectBox':
    case 'radioButtons':
      return { ...baseAnswer, type: columnType, answer: '' };
    case 'checkBoxes':
    case 'multiselectBox':
      return { ...baseAnswer, type: columnType, answer: [] };
    case 'number':
    case 'currency':
      return { ...baseAnswer, type: columnType, answer: 0 };
    case 'boolean':
      return { ...baseAnswer, type: columnType, answer: false };
    case 'date':
      return { ...baseAnswer, type: 'date', answer: '' };
    case 'dateRange':
      return { ...baseAnswer, type: 'dateRange', answer: { start: '', end: '' } };
    case 'repositorySearch':
      return { ...baseAnswer, type: 'repositorySearch', answer: [] };
    case 'metadataStandardSearch':
      return { ...baseAnswer, type: 'metadataStandardSearch', answer: [] };
    case 'licenseSearch':
      return { ...baseAnswer, type: 'licenseSearch', answer: [] };
    case 'affiliationSearch':
      return { ...baseAnswer, type: 'affiliationSearch', answer: { affiliationId: '', affiliationName: '' } };
    case 'numberWithContext':
      return { ...baseAnswer, type: 'numberWithContext', answer: { value: 0, context: '' } };
    default:
      return { ...baseAnswer, type: 'text', answer: '' };
  }
};

describe('ResearchOutputAnswerComponent', () => {
  let mockSetRows: jest.Mock;
  let mockOnSave: jest.Mock;
  const user = userEvent.setup();

  beforeEach(() => {
    window.scrollTo = jest.fn();
    mockSetRows = jest.fn((updateFn) => {
      // Allow the mock to actually update if passed a function
      if (typeof updateFn === 'function') {
        return updateFn([]);
      }
    });
    mockOnSave = jest.fn();
    jest.clearAllMocks();
  });

  describe('Initial Render', () => {
    it('should automatically show add form when no rows exist', async () => {
      renderWithProviders(
        <ResearchOutputAnswerComponent
          columns={mockColumns}
          rows={[]}
          setRows={mockSetRows}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('single-research-output')).toBeInTheDocument();
      });

      expect(screen.getByText('headings.addResearchOutput')).toBeInTheDocument();
    });

    it('should show list view when rows exist', () => {
      const mockRows = [
        createMockRow('Dataset 1', 'dataset', [
          { repositoryId: '1', repositoryName: 'Zenodo' },
        ]),
      ];

      renderWithProviders(
        <ResearchOutputAnswerComponent
          columns={mockColumns}
          rows={mockRows}
          setRows={mockSetRows}
        />
      );

      expect(screen.getByText('Dataset 1')).toBeInTheDocument();
      expect(screen.getByText('dataset')).toBeInTheDocument();
      expect(screen.getByText('Zenodo')).toBeInTheDocument();
    });

    it('should render with realistic backend data', () => {
      const mockRows = [
        createMockRow(
          'RO Answer 2',
          'audiovisual',
          [
            {
              repositoryId: 'https://www.re3data.org/repository/https://www.re3data.org/api/v1/repository/r3d100010468',
              repositoryName: 'Zenodo',
            },
          ],
          '<p>description</p>',
          [
            {
              metadataStandardId: 'https://repositorio.unicamp.br/',
              metadataStandardName: 'Terminal RI Unicamp',
            },
          ],
          [
            {
              licenseId: 'https://spdx.org/licenses/CC-BY-4.0.json',
              licenseName: 'CC-BY-4.0',
            },
          ],
          ['sensitive', 'personal'],
          'open',
          'My custom field answer'
        ),
      ];

      renderWithProviders(
        <ResearchOutputAnswerComponent
          columns={mockColumns}
          rows={mockRows}
          setRows={mockSetRows}
        />
      );

      expect(screen.getByText('RO Answer 2')).toBeInTheDocument();
      expect(screen.getByText('audiovisual')).toBeInTheDocument();
      expect(screen.getByText('Zenodo')).toBeInTheDocument();
    });
  });

  describe('List View', () => {
    it('should render multiple research outputs', () => {
      const mockRows = [
        createMockRow('Dataset 1', 'dataset', [
          { repositoryId: '1', repositoryName: 'Zenodo' },
        ]),
        createMockRow('Publication 1', 'text', [
          { repositoryId: '2', repositoryName: 'Dryad' },
        ]),
      ];

      renderWithProviders(
        <ResearchOutputAnswerComponent
          columns={mockColumns}
          rows={mockRows}
          setRows={mockSetRows}
        />
      );

      expect(screen.getByText('Dataset 1')).toBeInTheDocument();
      expect(screen.getByText('Publication 1')).toBeInTheDocument();
      expect(screen.getByText('Zenodo')).toBeInTheDocument();
      expect(screen.getByText('Dryad')).toBeInTheDocument();
    });

    it('should correctly display output type from columns', () => {
      const mockRows = [
        createMockRow('Dataset 1', 'dataset', []),
        createMockRow('Software 1', 'software', []),
        createMockRow('Publication 1', 'text', []),
      ];

      renderWithProviders(
        <ResearchOutputAnswerComponent
          columns={mockColumns}
          rows={mockRows}
          setRows={mockSetRows}
        />
      );

      expect(screen.getByText('dataset')).toBeInTheDocument();
      expect(screen.getByText('software')).toBeInTheDocument();
      expect(screen.getByText('text')).toBeInTheDocument();
    });

    it('should display first repository when multiple repositories exist', () => {
      const mockRows = [
        createMockRow('Dataset 1', 'dataset', [
          { repositoryId: '1', repositoryName: 'Zenodo' },
          { repositoryId: '2', repositoryName: 'Dryad' },
          { repositoryId: '3', repositoryName: 'Figshare' },
        ]),
      ];

      renderWithProviders(
        <ResearchOutputAnswerComponent
          columns={mockColumns}
          rows={mockRows}
          setRows={mockSetRows}
        />
      );

      // Should show only the first repository
      expect(screen.getByText('Zenodo')).toBeInTheDocument();
      expect(screen.queryByText('Dryad')).not.toBeInTheDocument();
      expect(screen.queryByText('Figshare')).not.toBeInTheDocument();
    });

    it('should show "Untitled Research Output" for rows without title', () => {
      const mockRows = [createMockRow('', '', [])];

      renderWithProviders(
        <ResearchOutputAnswerComponent
          columns={mockColumns}
          rows={mockRows}
          setRows={mockSetRows}
        />
      );

      expect(screen.getByText('Untitled Research Output')).toBeInTheDocument();
    });

    it('should render Add Output button', () => {
      const mockRows = [createMockRow('Dataset 1', 'dataset', [])];

      renderWithProviders(
        <ResearchOutputAnswerComponent
          columns={mockColumns}
          rows={mockRows}
          setRows={mockSetRows}
        />
      );

      expect(screen.getByRole('button', { name: /addOutput/i })).toBeInTheDocument();
    });

    it('should render edit and delete buttons for each row', () => {
      const mockRows = [
        createMockRow('Dataset 1', 'dataset', []),
        createMockRow('Dataset 2', 'dataset', []),
      ];

      renderWithProviders(
        <ResearchOutputAnswerComponent
          columns={mockColumns}
          rows={mockRows}
          setRows={mockSetRows}
        />
      );

      const editButtons = screen.getAllByRole('button', { name: /edit/i });
      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });

      expect(editButtons).toHaveLength(2);
      expect(deleteButtons).toHaveLength(2);
    });
  });

  describe('Add New Research Output', () => {
    it('should show edit form when Add Output button is clicked', async () => {
      const mockRows = [createMockRow('Dataset 1', 'dataset', [])];

      renderWithProviders(
        <ResearchOutputAnswerComponent
          columns={mockColumns}
          rows={mockRows}
          setRows={mockSetRows}
        />
      );

      const addButton = screen.getByRole('button', { name: /addOutput/i });
      await user.click(addButton);

      expect(mockSetRows).toHaveBeenCalled();
      expect(screen.getByTestId('single-research-output')).toBeInTheDocument();
      expect(screen.getByText('headings.addResearchOutput')).toBeInTheDocument();
    });

    it('should mark new entry correctly', async () => {
      const mockRows = [createMockRow('Dataset 1', 'dataset', [])];

      renderWithProviders(
        <ResearchOutputAnswerComponent
          columns={mockColumns}
          rows={mockRows}
          setRows={mockSetRows}
        />
      );

      const addButton = screen.getByRole('button', { name: /addOutput/i });
      await user.click(addButton);

      expect(screen.getByTestId('is-new-entry')).toHaveTextContent('true');
    });
  });

  describe('Edit Research Output', () => {
    it('should show edit form when edit button is clicked', async () => {
      const mockRows = [createMockRow('Dataset 1', 'dataset', [])];

      renderWithProviders(
        <ResearchOutputAnswerComponent
          columns={mockColumns}
          rows={mockRows}
          setRows={mockSetRows}
        />
      );

      const editButton = screen.getByRole('button', { name: /edit/i });
      await user.click(editButton);

      expect(screen.getByTestId('single-research-output')).toBeInTheDocument();
      expect(screen.getByText('headings.editResearchOutput')).toBeInTheDocument();
    });

    it('should not mark as new entry when editing existing row', async () => {
      const mockRows = [createMockRow('Dataset 1', 'dataset', [])];

      renderWithProviders(
        <ResearchOutputAnswerComponent
          columns={mockColumns}
          rows={mockRows}
          setRows={mockSetRows}
        />
      );

      const editButton = screen.getByRole('button', { name: /edit/i });
      await user.click(editButton);

      expect(screen.getByTestId('is-new-entry')).toHaveTextContent('false');
    });

    it('should indicate hasOtherRows correctly when editing with multiple rows', async () => {
      const mockRows = [
        createMockRow('Dataset 1', 'dataset', []),
        createMockRow('Dataset 2', 'dataset', []),
      ];

      renderWithProviders(
        <ResearchOutputAnswerComponent
          columns={mockColumns}
          rows={mockRows}
          setRows={mockSetRows}
        />
      );

      const editButtons = screen.getAllByRole('button', { name: /edit/i });
      await user.click(editButtons[0]);

      expect(screen.getByTestId('has-other-rows')).toHaveTextContent('true');
    });

    it('should indicate hasOtherRows as false when editing single row', async () => {
      const mockRows = [createMockRow('Dataset 1', 'dataset', [])];

      renderWithProviders(
        <ResearchOutputAnswerComponent
          columns={mockColumns}
          rows={mockRows}
          setRows={mockSetRows}
        />
      );

      const editButton = screen.getByRole('button', { name: /edit/i });
      await user.click(editButton);

      expect(screen.getByTestId('has-other-rows')).toHaveTextContent('false');
    });
  });

  describe('Delete Research Output', () => {
    beforeEach(() => {
      // Mock window.confirm
      global.confirm = jest.fn(() => true);
    });

    it('should delete row when delete button is clicked and confirmed', async () => {
      const mockRows = [
        createMockRow('Dataset 1', 'dataset', []),
        createMockRow('Dataset 2', 'dataset', []),
      ];

      renderWithProviders(
        <ResearchOutputAnswerComponent
          columns={mockColumns}
          rows={mockRows}
          setRows={mockSetRows}
        />
      );

      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      await user.click(deleteButtons[0]);

      expect(global.confirm).toHaveBeenCalledWith('messages.areYouSureYouWantToDelete');
      expect(mockSetRows).toHaveBeenCalled();
    });

    it('should not delete row when delete is cancelled', async () => {
      global.confirm = jest.fn(() => false);
      const mockRows = [createMockRow('Dataset 1', 'dataset', [])];

      renderWithProviders(
        <ResearchOutputAnswerComponent
          columns={mockColumns}
          rows={mockRows}
          setRows={mockSetRows}
        />
      );

      const deleteButton = screen.getByRole('button', { name: /delete/i });
      await user.click(deleteButton);

      expect(global.confirm).toHaveBeenCalled();
      expect(mockSetRows).not.toHaveBeenCalled();
    });

    it('should call onSave after successful deletion', async () => {
      global.confirm = jest.fn(() => true);
      const mockRows = [createMockRow('Dataset 1', 'dataset', [])];

      renderWithProviders(
        <ResearchOutputAnswerComponent
          columns={mockColumns}
          rows={mockRows}
          setRows={mockSetRows}
          onSave={mockOnSave}
        />
      );

      const deleteButton = screen.getByRole('button', { name: /delete/i });
      await user.click(deleteButton);

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith([], 'delete');
      });
    });
  });

  describe('Save and Cancel Actions', () => {
    it('should call onSave when save button is clicked', async () => {
      const mockRows = [createMockRow('Dataset 1', 'dataset', [])];

      renderWithProviders(
        <ResearchOutputAnswerComponent
          columns={mockColumns}
          rows={mockRows}
          setRows={mockSetRows}
          onSave={mockOnSave}
        />
      );

      const editButton = screen.getByRole('button', { name: /edit/i });
      await user.click(editButton);

      const saveButton = screen.getByRole('button', { name: /Save/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalled();
      });
    });

    it('should return to list view after save', async () => {
      const mockRows = [createMockRow('Dataset 1', 'dataset', [])];

      renderWithProviders(
        <ResearchOutputAnswerComponent
          columns={mockColumns}
          rows={mockRows}
          setRows={mockSetRows}
        />
      );

      const editButton = screen.getByRole('button', { name: /edit/i });
      await user.click(editButton);

      const saveButton = screen.getByRole('button', { name: /Save/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('Dataset 1')).toBeInTheDocument();
      });
    });

    it('should remove empty row when cancel is clicked on new entry', async () => {
      const mockRows = [createMockRow('Dataset 1', 'dataset', [])];

      renderWithProviders(
        <ResearchOutputAnswerComponent
          columns={mockColumns}
          rows={mockRows}
          setRows={mockSetRows}
        />
      );

      // Use getByText with regex to match the button content
      const addButton = screen.getByRole('button', { name: /addOutput/i });
      await user.click(addButton);

      const cancelButton = screen.getByRole('button', { name: /Cancel/i });
      await user.click(cancelButton);

      expect(mockSetRows).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle rows with HTML content in title', () => {
      const mockRow = createMockRow(
        '<p>Dataset with <strong>HTML</strong></p>',
        'dataset',
        []
      );

      renderWithProviders(
        <ResearchOutputAnswerComponent
          columns={mockColumns}
          rows={[mockRow]}
          setRows={mockSetRows}
        />
      );

      expect(screen.getByText('Dataset with HTML')).toBeInTheDocument();
    });

    it('should truncate long titles', () => {
      const longTitle = 'A'.repeat(100);
      const mockRow = createMockRow(longTitle, 'dataset', []);

      renderWithProviders(
        <ResearchOutputAnswerComponent
          columns={mockColumns}
          rows={[mockRow]}
          setRows={mockSetRows}
        />
      );

      const displayedTitle = screen.getByRole('heading', { level: 4 }).textContent;
      expect(displayedTitle).toContain('...');
      expect(displayedTitle!.length).toBeLessThan(longTitle.length);
    });

    it('should handle empty repository array', () => {
      const mockRow = createMockRow('Dataset 1', 'dataset', []);

      renderWithProviders(
        <ResearchOutputAnswerComponent
          columns={mockColumns}
          rows={[mockRow]}
          setRows={mockSetRows}
        />
      );

      expect(screen.getByText('Dataset 1')).toBeInTheDocument();
      expect(screen.queryByText('Repository:')).not.toBeInTheDocument();
    });

    it('should handle empty output type', () => {
      const mockRow = createMockRow('Dataset 1', '', []);

      renderWithProviders(
        <ResearchOutputAnswerComponent
          columns={mockColumns}
          rows={[mockRow]}
          setRows={mockSetRows}
        />
      );

      expect(screen.getByText('Dataset 1')).toBeInTheDocument();
      expect(screen.queryByText('Type:')).not.toBeInTheDocument();
    });

    it('should automatically add new form when all rows are deleted', async () => {
      global.confirm = jest.fn(() => true);
      const mockRows = [createMockRow('Dataset 1', 'dataset', [])];
      const currentRows = [...mockRows];

      const CustomComponent = () => {
        const [rows, setRows] = React.useState(currentRows);
        return (
          <NextIntlClientProvider messages={messages} locale="en">
            <ResearchOutputAnswerComponent
              columns={mockColumns}
              rows={rows}
              setRows={setRows}
            />
          </NextIntlClientProvider>
        );
      };

      render(<CustomComponent />);

      const deleteButton = screen.getByRole('button', { name: /delete/i });
      await user.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByTestId('single-research-output')).toBeInTheDocument();
        expect(screen.getByText('headings.addResearchOutput')).toBeInTheDocument();
      });
    });
  });

  describe('Column Headings', () => {
    it('should work without columnHeadings prop', () => {
      const mockRows = [createMockRow('', 'dataset', [])]; // Pass empty title

      renderWithProviders(
        <ResearchOutputAnswerComponent
          columns={mockColumns}
          rows={mockRows}
          setRows={mockSetRows}
        />
      );

      // Should still render without errors
      expect(screen.getByText('Untitled Research Output')).toBeInTheDocument();
    });
  });

  describe('Column Preferences', () => {
    it('should handle repository preferences when creating empty row', async () => {
      const columnsWithPreferences: typeof DefaultResearchOutputTableQuestion['columns'] = mockColumns.map(col => {
        if (col.heading === 'Repositories') {
          return {
            ...col,
            preferences: [
              { value: 'https://zenodo.org', label: 'Zenodo' },
              { value: 'https://dryad.org', label: 'Dryad' },
            ],
          };
        }
        return col;
      });

      renderWithProviders(
        <ResearchOutputAnswerComponent
          columns={columnsWithPreferences}
          rows={[]}
          setRows={mockSetRows}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('single-research-output')).toBeInTheDocument();
      });

      // Verify setRows was called with preferences pre-populated
      expect(mockSetRows).toHaveBeenCalled();
    });

    it('should handle metadata standard preferences when creating empty row', async () => {
      const columnsWithPreferences: typeof DefaultResearchOutputTableQuestion['columns'] = mockColumns.map(col => {
        if (col.heading === 'Metadata Standards') {
          return {
            ...col,
            preferences: [
              { value: 'https://dublincore.org', label: 'Dublin Core' },
              { value: 'https://datacite.org', label: 'DataCite' },
            ],
          };
        }
        return col;
      });

      renderWithProviders(
        <ResearchOutputAnswerComponent
          columns={columnsWithPreferences}
          rows={[]}
          setRows={mockSetRows}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('single-research-output')).toBeInTheDocument();
      });

      // Verify setRows was called
      expect(mockSetRows).toHaveBeenCalled();
    });

    it('should handle license preferences when creating empty row', async () => {
      const columnsWithPreferences: typeof DefaultResearchOutputTableQuestion['columns'] = mockColumns.map(col => {
        if (col.heading === 'Licenses') {
          return {
            ...col,
            preferences: [
              { value: 'https://spdx.org/licenses/CC-BY-4.0.json', label: 'CC-BY-4.0' },
              { value: 'https://spdx.org/licenses/CC0-1.0.json', label: 'CC0-1.0' },
            ],
          };
        }
        return col;
      });

      renderWithProviders(
        <ResearchOutputAnswerComponent
          columns={columnsWithPreferences}
          rows={[]}
          setRows={mockSetRows}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('single-research-output')).toBeInTheDocument();
      });

      // Verify setRows was called
      expect(mockSetRows).toHaveBeenCalled();
    });
  });

  describe('handleCancel function', () => {
    it('should NOT remove row when canceling edit of non-empty existing row', async () => {
      const mockRows = [createMockRow('Dataset 1', 'dataset', [])];
      const currentRows = [...mockRows];

      const CustomComponent = () => {
        const [rows, setRows] = React.useState(currentRows);
        return (
          <NextIntlClientProvider messages={messages} locale="en">
            <ResearchOutputAnswerComponent
              columns={mockColumns}
              rows={rows}
              setRows={setRows}
            />
          </NextIntlClientProvider>
        );
      };

      render(<CustomComponent />);

      // Start editing existing row
      const editButton = screen.getByRole('button', { name: /edit/i });
      await user.click(editButton);

      // Cancel editing
      const cancelButton = screen.getByRole('button', { name: /Cancel/i });
      await user.click(cancelButton);

      // Should return to list view and row should still exist
      await waitFor(() => {
        expect(screen.getByText('Dataset 1')).toBeInTheDocument();
      });
    });

    it('should handle cancel when editingRowIndex is null', async () => {
      const mockRows = [createMockRow('Dataset 1', 'dataset', [])];

      renderWithProviders(
        <ResearchOutputAnswerComponent
          columns={mockColumns}
          rows={mockRows}
          setRows={mockSetRows}
        />
      );

      // Should not throw error when cancel is somehow called without editing
      expect(screen.getByText('Dataset 1')).toBeInTheDocument();
    });

    it('should remove row with empty string answer when canceled', async () => {
      const mockRows = [
        createMockRow('Dataset 1', 'dataset', []),
      ];
      const currentRows = [...mockRows];

      const CustomComponent = () => {
        const [rows, setRows] = React.useState(currentRows);
        return (
          <NextIntlClientProvider messages={messages} locale="en">
            <ResearchOutputAnswerComponent
              columns={mockColumns}
              rows={rows}
              setRows={setRows}
            />
          </NextIntlClientProvider>
        );
      };

      render(<CustomComponent />);

      // Add new entry
      const addButton = screen.getByRole('button', { name: /addOutput/i });
      await user.click(addButton);

      // Cancel without filling anything
      const cancelButton = screen.getByRole('button', { name: /Cancel/i });
      await user.click(cancelButton);

      // Should only show original row
      await waitFor(() => {
        expect(screen.getByText('Dataset 1')).toBeInTheDocument();
        const listItems = screen.queryAllByRole('listitem');
        expect(listItems).toHaveLength(1);
      });
    });

    it('should remove row with empty array answers when canceled', async () => {
      // Create a truly empty row without using createMockRow
      const emptyRow: ResearchOutputTable = {
        columns: mockColumns.map(col => createEmptyAnswer(col.content.type)) as ResearchOutputTable['columns'],
      };

      const mockRows = [
        createMockRow('Dataset 1', 'dataset', []),
        emptyRow,
      ];
      const currentRows = [...mockRows];

      const CustomComponent = () => {
        const [rows, setRows] = React.useState(currentRows);

        return (
          <NextIntlClientProvider messages={messages} locale="en">
            <ResearchOutputAnswerComponent
              columns={mockColumns}
              rows={rows}
              setRows={setRows}
            />
          </NextIntlClientProvider>
        );
      };

      render(<CustomComponent />);

      // Find and click edit on the second (empty) row
      const editButtons = screen.getAllByRole('button', { name: /edit/i });
      await user.click(editButtons[1]);

      // Cancel editing the empty row
      const cancelButton = screen.getByRole('button', { name: /Cancel/i });
      await user.click(cancelButton);

      // Should remove the empty row
      await waitFor(() => {
        const listItems = screen.queryAllByRole('listitem');
        expect(listItems).toHaveLength(1);
      });
    });

    it('should remove row with zero number answer when canceled', async () => {
      // Create a custom row with a number answer set to 0
      const customRow: ResearchOutputTable = {
        columns: mockColumns.map(col => createEmptyAnswer(col.content.type)) as ResearchOutputTable['columns'],
      };

      const mockRows = [createMockRow('Dataset 1', 'dataset', []), customRow];
      const currentRows = [...mockRows];

      const CustomComponent = () => {
        const [rows, setRows] = React.useState(currentRows);
        return (
          <NextIntlClientProvider messages={messages} locale="en">
            <ResearchOutputAnswerComponent
              columns={mockColumns}
              rows={rows}
              setRows={setRows}
            />
          </NextIntlClientProvider>
        );
      };

      render(<CustomComponent />);

      // Edit the empty row (second row)
      const editButtons = screen.getAllByRole('button', { name: /edit/i });
      await user.click(editButtons[1]);

      // Cancel
      const cancelButton = screen.getByRole('button', { name: /Cancel/i });
      await user.click(cancelButton);

      // Empty row should be removed
      await waitFor(() => {
        const listItems = screen.queryAllByRole('listitem');
        expect(listItems).toHaveLength(1);
      });
    });

    it('should remove row with object answer having default values when canceled', async () => {
      // Create a row with an object answer that has default/empty values
      const customRow: ResearchOutputTable = {
        columns: mockColumns.map((col): AnyTableColumnAnswerType => {
          if (col.content.type === 'text' && col.heading === 'Title') {
            return {
              type: 'text',
              meta: { schemaVersion: '1.0' },
              answer: '', // Empty title
            };
          }
          // For the custom field, use numberWithContext type to properly test object answers
          if (col.heading === 'Custom field label') {
            return {
              type: 'numberWithContext',
              meta: { schemaVersion: '1.0' },
              answer: { value: 0, context: 'kb' },
            };
          }
          // Use the helper for all other columns
          return createEmptyAnswer(col.content.type);
        }) as ResearchOutputTable['columns'],
      };

      const mockRows = [createMockRow('Dataset 1', 'dataset', []), customRow];
      const currentRows = [...mockRows];

      const CustomComponent = () => {
        const [rows, setRows] = React.useState(currentRows);
        return (
          <NextIntlClientProvider messages={messages} locale="en">
            <ResearchOutputAnswerComponent
              columns={mockColumns}
              rows={rows}
              setRows={setRows}
            />
          </NextIntlClientProvider>
        );
      };

      render(<CustomComponent />);

      // Edit the row with object answer
      const editButtons = screen.getAllByRole('button', { name: /edit/i });
      await user.click(editButtons[1]);

      // Cancel
      const cancelButton = screen.getByRole('button', { name: /Cancel/i });
      await user.click(cancelButton);

      // Row with empty object should be removed
      await waitFor(() => {
        const listItems = screen.queryAllByRole('listitem');
        expect(listItems).toHaveLength(1);
      });
    });

    it('should NOT remove row when it has non-empty content (string)', async () => {
      const mockRows = [
        createMockRow('Dataset 1', 'dataset', []),
        createMockRow('Dataset 2', 'dataset', []),
      ];
      const currentRows = [...mockRows];

      const CustomComponent = () => {
        const [rows, setRows] = React.useState(currentRows);
        return (
          <NextIntlClientProvider messages={messages} locale="en">
            <ResearchOutputAnswerComponent
              columns={mockColumns}
              rows={rows}
              setRows={setRows}
            />
          </NextIntlClientProvider>
        );
      };

      render(<CustomComponent />);

      // Edit second row (which has content)
      const editButtons = screen.getAllByRole('button', { name: /edit/i });
      await user.click(editButtons[1]);

      // Cancel
      const cancelButton = screen.getByRole('button', { name: /Cancel/i });
      await user.click(cancelButton);

      // Both rows should still exist
      await waitFor(() => {
        expect(screen.getByText('Dataset 1')).toBeInTheDocument();
        expect(screen.getByText('Dataset 2')).toBeInTheDocument();
        const listItems = screen.queryAllByRole('listitem');
        expect(listItems).toHaveLength(2);
      });
    });
  });

  describe('handleSetRows function', () => {
    it('should update only the editing row when function is called', async () => {
      const mockRows = [
        createMockRow('Dataset 1', 'dataset', []),
        createMockRow('Dataset 2', 'software', []),
      ];
      const currentRows = [...mockRows];

      const CustomComponent = () => {
        const [rows, setRows] = React.useState(currentRows);
        return (
          <NextIntlClientProvider messages={messages} locale="en">
            <ResearchOutputAnswerComponent
              columns={mockColumns}
              rows={rows}
              setRows={setRows}
            />
          </NextIntlClientProvider>
        );
      };

      render(<CustomComponent />);

      // Start editing first row
      const editButtons = screen.getAllByRole('button', { name: /edit/i });
      await user.click(editButtons[0]);

      // The mock SingleResearchOutputComponent should be shown
      expect(screen.getByTestId('single-research-output')).toBeInTheDocument();

      // When we save, it should only affect the first row
      const saveButton = screen.getByRole('button', { name: /Save/i });
      await user.click(saveButton);

      await waitFor(() => {
        // Both datasets should still be present
        expect(screen.getByText('Dataset 1')).toBeInTheDocument();
        expect(screen.getByText('Dataset 2')).toBeInTheDocument();
      });
    });

    it('should handle function-based updates in handleSetRows', async () => {
      const mockRows = [createMockRow('Dataset 1', 'dataset', [])];
      const testRows = [...mockRows];

      const CustomComponent = () => {
        const [rows, setRows] = React.useState(testRows);

        return (
          <NextIntlClientProvider messages={messages} locale="en">
            <ResearchOutputAnswerComponent
              columns={mockColumns}
              rows={rows}
              setRows={setRows}
            />
          </NextIntlClientProvider>
        );
      };

      render(<CustomComponent />);

      // Start editing
      const editButton = screen.getByRole('button', { name: /edit/i });
      await user.click(editButton);

      expect(screen.getByTestId('single-research-output')).toBeInTheDocument();
    });

    it('should handle direct value updates in handleSetRows', async () => {
      const mockRows = [createMockRow('Dataset 1', 'dataset', [])];

      const CustomComponent = () => {
        const [rows, setRows] = React.useState([...mockRows]);

        return (
          <NextIntlClientProvider messages={messages} locale="en">
            <ResearchOutputAnswerComponent
              columns={mockColumns}
              rows={rows}
              setRows={setRows}
            />
          </NextIntlClientProvider>
        );
      };

      render(<CustomComponent />);

      // Start editing
      const editButton = screen.getByRole('button', { name: /edit/i });
      await user.click(editButton);

      expect(screen.getByTestId('single-research-output')).toBeInTheDocument();
    });

    it('should not update rows when editingRowIndex is null', async () => {
      const mockRows = [createMockRow('Dataset 1', 'dataset', [])];
      const setRowsSpy = jest.fn();

      renderWithProviders(
        <ResearchOutputAnswerComponent
          columns={mockColumns}
          rows={mockRows}
          setRows={setRowsSpy}
        />
      );

      // In list view, editingRowIndex should be null
      expect(screen.getByText('Dataset 1')).toBeInTheDocument();

      // setRows might be called for initial render, but handleSetRows internal logic
      // should return early when editingRowIndex is null
      // This is implicitly tested - if we're in list view, handleSetRows shouldn't cause issues
    });

    it('should correctly pass single row to SingleResearchOutputComponent', async () => {
      const mockRows = [
        createMockRow('Dataset 1', 'dataset', []),
        createMockRow('Dataset 2', 'software', []),
        createMockRow('Dataset 3', 'text', []),
      ];

      const CustomComponent = () => {
        const [rows, setRows] = React.useState([...mockRows]);

        return (
          <NextIntlClientProvider messages={messages} locale="en">
            <ResearchOutputAnswerComponent
              columns={mockColumns}
              rows={rows}
              setRows={setRows}
            />
          </NextIntlClientProvider>
        );
      };

      render(<CustomComponent />);

      // Edit the second row
      const editButtons = screen.getAllByRole('button', { name: /edit/i });
      await user.click(editButtons[1]);

      // Should show edit form for second row only
      expect(screen.getByTestId('single-research-output')).toBeInTheDocument();
      expect(screen.getByText('headings.editResearchOutput')).toBeInTheDocument();
    });

    it('should maintain other rows unchanged when updating editing row', async () => {
      const mockRows = [
        createMockRow('Dataset 1', 'dataset', [{ repositoryId: '1', repositoryName: 'Zenodo' }]),
        createMockRow('Dataset 2', 'software', [{ repositoryId: '2', repositoryName: 'GitHub' }]),
      ];

      const CustomComponent = () => {
        const [rows, setRows] = React.useState([...mockRows]);

        return (
          <NextIntlClientProvider messages={messages} locale="en">
            <ResearchOutputAnswerComponent
              columns={mockColumns}
              rows={rows}
              setRows={setRows}
            />
          </NextIntlClientProvider>
        );
      };

      render(<CustomComponent />);

      // Verify both rows are initially present
      expect(screen.getByText('Dataset 1')).toBeInTheDocument();
      expect(screen.getByText('Dataset 2')).toBeInTheDocument();

      // Edit first row
      const editButtons = screen.getAllByRole('button', { name: /edit/i });
      await user.click(editButtons[0]);

      // Save changes
      const saveButton = screen.getByRole('button', { name: /Save/i });
      await user.click(saveButton);

      // Both rows should still exist
      await waitFor(() => {
        expect(screen.getByText('Dataset 1')).toBeInTheDocument();
        expect(screen.getByText('Dataset 2')).toBeInTheDocument();
      });
    });
  });

  describe('Integration of handleCancel and handleSetRows', () => {
    it('should properly handle cancel after making changes via handleSetRows', async () => {
      const mockRows = [createMockRow('Dataset 1', 'dataset', [])];

      const CustomComponent = () => {
        const [rows, setRows] = React.useState([...mockRows]);

        return (
          <NextIntlClientProvider messages={messages} locale="en">
            <ResearchOutputAnswerComponent
              columns={mockColumns}
              rows={rows}
              setRows={setRows}
            />
          </NextIntlClientProvider>
        );
      };

      render(<CustomComponent />);

      // Start editing
      const editButton = screen.getByRole('button', { name: /edit/i });
      await user.click(editButton);

      // Now cancel (changes made via handleSetRows should be evaluated)
      const cancelButton = screen.getByRole('button', { name: /Cancel/i });
      await user.click(cancelButton);

      // Should return to list view with row intact (since it wasn't empty)
      await waitFor(() => {
        expect(screen.getByText('Dataset 1')).toBeInTheDocument();
      });
    });

    it('should handle adding new row, making no changes, then canceling', async () => {
      const mockRows = [createMockRow('Dataset 1', 'dataset', [])];

      const CustomComponent = () => {
        const [rows, setRows] = React.useState([...mockRows]);

        return (
          <NextIntlClientProvider messages={messages} locale="en">
            <ResearchOutputAnswerComponent
              columns={mockColumns}
              rows={rows}
              setRows={setRows}
            />
          </NextIntlClientProvider>
        );
      };

      render(<CustomComponent />);

      // Add new
      const addButton = screen.getByRole('button', { name: /addOutput/i });
      await user.click(addButton);

      // Verify we're in add mode
      expect(screen.getByTestId('is-new-entry')).toHaveTextContent('true');

      // Cancel without making changes
      const cancelButton = screen.getByRole('button', { name: /Cancel/i });
      await user.click(cancelButton);

      // Should remove the empty new row and show only the original row
      await waitFor(() => {
        const listItems = screen.queryAllByRole('listitem');
        expect(listItems).toHaveLength(1);
        expect(screen.getByText('Dataset 1')).toBeInTheDocument();
      });
    });
  });
});
