import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import SingleResearchOutputComponent from '../index';
import { ResearchOutputTable } from '@/app/types';
import { DefaultResearchOutputTableQuestion } from '@dmptool/types';
import { RecommendedLicensesDocument, DefaultResearchOutputTypesDocument } from '@/generated/graphql';
// Mock Apollo Client's useQuery hook
jest.mock('@apollo/client/react', () => ({
  useQuery: jest.fn((document) => {
    // Mock RecommendedLicensesDocument query
    if (document === RecommendedLicensesDocument) {
      return {
        data: {
          recommendedLicenses: [
            {
              __typename: 'License',
              name: 'CC0-1.0',
              id: 54,
              uri: 'https://spdx.org/licenses/CC0-1.0.json',
            },
            {
              __typename: 'License',
              name: 'CC-BY-4.0',
              id: 55,
              uri: 'https://spdx.org/licenses/CC-BY-4.0.json',
            },
            {
              __typename: 'License',
              name: 'MIT',
              id: 56,
              uri: 'https://spdx.org/licenses/MIT.json',
            },
          ],
        },
        loading: false,
        error: undefined,
      };
    }

    // Mock DefaultResearchOutputTypesDocument query
    if (document === DefaultResearchOutputTypesDocument) {
      return {
        data: {
          defaultResearchOutputTypes: [
            {
              __typename: 'ResearchOutputType',
              id: 1,
              name: 'Audiovisual',
              value: 'audiovisual',
              description: 'A series of visual representations...',
            },
            {
              __typename: 'ResearchOutputType',
              id: 4,
              name: 'Dataset',
              value: 'dataset',
              description: 'Data encoded in a defined structure.',
            },
            {
              __typename: 'ResearchOutputType',
              id: 12,
              name: 'Software',
              value: 'software',
              description: 'A computer program...',
            },
            {
              __typename: 'ResearchOutputType',
              id: 14,
              name: 'Text',
              value: 'text',
              description: 'A resource consisting primarily of words...',
            },
          ],
        },
        loading: false,
        error: undefined,
      };
    }

    // Default return for any other queries
    return {
      data: undefined,
      loading: false,
      error: undefined,
    };
  }),
}));

// Mock the generated GraphQL documents (these are imported by the component)
jest.mock('@/generated/graphql', () => ({
  ...jest.requireActual('@/generated/graphql'),
  RecommendedLicensesDocument: 'RecommendedLicensesDocument',
  DefaultResearchOutputTypesDocument: 'DefaultResearchOutputTypesDocument',
}));
// Mock child components
jest.mock('@/components/RepoSelectorForAnswer', () => {
  /* eslint-disable @typescript-eslint/no-explicit-any */
  return function MockRepoSelectorForAnswer({ value, onRepositoriesChange }: any) {
    return (
      <div data-testid="repo-selector">
        <button
          onClick={() =>
            onRepositoriesChange([
              { id: 'repo1', uri: 'https://zenodo.org', name: 'Zenodo' },
            ])
          }
        >
          Add Repository
        </button>
        <div data-testid="repo-value">{JSON.stringify(value)}</div>
      </div>
    );
  };
});

jest.mock('@/components/MetaDataStandardForAnswer', () => {
  return function MockMetaDataStandardsForAnswer({
    value,
    onMetaDataStandardsChange,
    /* eslint-disable @typescript-eslint/no-explicit-any */
  }: any) {
    return (
      <div data-testid="metadata-selector">
        <button
          onClick={() =>
            onMetaDataStandardsChange([
              { id: 'std1', name: 'Dublin Core', uri: 'https://dublincore.org' },
            ])
          }
        >
          Add Metadata Standard
        </button>
        <div data-testid="metadata-value">{JSON.stringify(value)}</div>
      </div>
    );
  };
});

jest.mock('@/components/Form', () => ({
  /* eslint-disable @typescript-eslint/no-explicit-any */
  FormInput: ({ label, value, onChange, isInvalid, errorMessage, isRequired, helpMessage, maxLength, minLength, ...props }: any) => {
    const { defaultValue, ...restProps } = props;
    // Use value if provided, otherwise use defaultValue
    const inputValue = value !== undefined ? value : undefined;
    const inputDefaultValue = value === undefined ? defaultValue : undefined;

    return (
      <div data-testid={`form-input-${props.name}`}>
        <label>{label}</label>
        <input
          {...(inputValue !== undefined ? { value: inputValue } : {})}
          {...(inputDefaultValue !== undefined ? { defaultValue: inputDefaultValue } : {})}
          onChange={onChange}
          data-invalid={isInvalid}
          aria-label={label}
          maxLength={maxLength}
          minLength={minLength}
          required={isRequired}
          {...restProps}
        />
        {helpMessage && <span className="help-text">{helpMessage}</span>}
        {errorMessage && <span data-testid="error">{errorMessage}</span>}
      </div>
    );

  },
  FormTextArea: ({ label, value, onChange, richText, isInvalid, errorMessage, isRequired, helpMessage, maxLength, minLength, isDisabled, disabled, ...props }: any) => {
    // Simulate rich text editor initialization
    React.useEffect(() => {
      if (richText && onChange) {
        // Rich text editors typically fire onChange on mount with initial value
        onChange(value || '');
      }
    }, []); // Only on mount

    return (
      <div data-testid={`form-textarea-${props.name}`}>
        <label>{label}</label>
        <textarea
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          data-invalid={isInvalid}
          aria-label={label}
          maxLength={maxLength}
          minLength={minLength}
          required={isRequired}
          disabled={isDisabled || disabled}
          {...props}
        />
        {helpMessage && <span className="help-text">{helpMessage}</span>}
        {errorMessage && <span data-testid="error">{errorMessage}</span>}
      </div>
    );
  },
  FormSelect: ({ label, items, selectedKey, onChange, isInvalid, errorMessage, selectClasses, ariaLabel, isRequired, helpMessage, isDisabled, disabled, ...props }: any) => (
    <div data-testid={`form-select-${props.name}`} className={selectClasses}>
      <label>{label}</label>
      <select
        value={selectedKey || ''}
        onChange={(e) => onChange(e.target.value)}
        data-invalid={isInvalid}
        aria-label={ariaLabel || label}
        required={isRequired}
        disabled={isDisabled || disabled}
        {...props}
      >
        <option value="">Select...</option>
        {items?.map((item: any) => (
          <option key={item.id} value={item.id}>
            {item.name}
          </option>
        ))}
      </select>
      {helpMessage && <span className="help-text">{helpMessage}</span>}
      {errorMessage && <span data-testid="error">{errorMessage}</span>}
    </div>
  ),
  CheckboxGroupComponent: ({ children, checkboxGroupLabel, checkboxGroupDescription, ...props }: any) => (
    <div data-testid={`checkbox-group-${props.name}`}>
      <label>{checkboxGroupLabel}</label>
      {checkboxGroupDescription && <p className="help-text">{checkboxGroupDescription}</p>}
      <div>{children}</div>
    </div>
  ),
  DateComponent: ({ label, value, onChange, isRequired, helpMessage, ...props }: any) => (
    <div data-testid={`date-component-${props.name}`}>
      <label>{label}</label>
      <input
        type="date"
        value={value?.toString() || ''}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
        required={isRequired}
      />
      {helpMessage && <span className="help-text">{helpMessage}</span>}
    </div>
  ),
}));

jest.mock('@/components/ErrorMessages', () => {
  const MockErrorMessages = React.forwardRef(({ errors }: any, ref: any) => {
    const errorList = Object.values(errors || {});
    if (errorList.length === 0) return null;
    return (
      <div data-testid="error-messages" ref={ref}>
        {errorList.map((error: any, index: number) => (
          <div key={index} data-testid="error-message">
            {error}
          </div>
        ))}
      </div>
    );
  });
  MockErrorMessages.displayName = 'MockErrorMessages';
  return MockErrorMessages;
});

// Mock translations
const messages = {
  Global: {
    buttons: {
      save: 'Save',
      update: 'Update',
      backToList: 'Back to List',
    },
    labels: {
      title: 'Title',
      description: 'Description',
      outputType: 'Output Type',
      dataFlags: 'Data Flags',
      repositories: 'Repositories',
      metadataStandards: 'Metadata Standards',
      licenses: 'Licenses',
      initialAccessLevels: 'Initial Access Levels',
      anticipatedReleaseDate: 'Anticipated Release Date',
      anticipatedFileSize: 'Anticipated File Size',
      fileSizeUnit: 'File Size Unit',
      unit: 'Unit',
      mayContainSensitiveData: 'May contain sensitive data',
      mayContainPersonalData: 'May contain personal data',
    },
    helpText: {
      dataFlags: 'Mark all statements that are true about the dataset',
    },
    messaging: {
      errors: {
        requiredField: '{field} is required',
      },
      unsavedChangesWarning: 'You have unsaved changes. Are you sure you want to leave?',
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

// Mock columns
const mockColumns: typeof DefaultResearchOutputTableQuestion['columns'] = [
  {
    heading: 'Title',
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
    help: 'Enter a brief description',
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
        labelTranslationKey: 'labels.description',
      },
    },
  },
  {
    heading: 'Output Type',
    help: 'Select the type',
    required: true,
    enabled: true,
    content: {
      type: 'selectBox',
      meta: { schemaVersion: '1.0' },
      options: [],
      attributes: {
        labelTranslationKey: 'labels.outputType',
        multiple: false,
      },
    },
  },
  {
    heading: 'Data Flags',
    help: 'Mark statements that are true',
    required: false,
    enabled: true,
    content: {
      type: 'checkBoxes',
      meta: { schemaVersion: '1.0' },
      options: [
        { label: 'May contain sensitive data?', value: 'sensitive', selected: true },
        { label: 'May contain personal data?', value: 'personal', selected: true },
      ],
      attributes: {
        labelTranslationKey: 'labels.dataFlags',
      },
    },
  },
  {
    heading: 'Repositories',
    help: 'Select repositories',
    required: false,
    enabled: true,
    content: {
      type: 'repositorySearch',
      meta: { schemaVersion: '1.0' },
      graphQL: {
        query: 'query Repositories...',
        queryId: 'useRepositoriesQuery',
        variables: [],
        answerField: 'uri',
        displayFields: [],
        responseField: 'repositories.items',
      },
      attributes: {
        labelTranslationKey: 'labels.repositories',
      },
    },
  },
  {
    heading: 'Metadata Standards',
    help: 'Select metadata standards',
    required: false,
    enabled: true,
    content: {
      type: 'metadataStandardSearch',
      meta: { schemaVersion: '1.0' },
      graphQL: {
        query: 'query MetadataStandards...',
        queryId: 'useMetadataStandardsQuery',
        variables: [],
        answerField: 'uri',
        displayFields: [],
        responseField: 'metadataStandards.items',
      },
      attributes: {
        labelTranslationKey: 'labels.metadataStandards',
      },
    },
  },
  {
    heading: 'Licenses',
    help: 'Select license',
    required: false,
    enabled: true,
    content: {
      type: 'licenseSearch',
      meta: { schemaVersion: '1.0' },
      graphQL: {
        query: 'query Licenses...',
        queryId: 'useLicensesQuery',
        variables: [],
        answerField: 'uri',
        displayFields: [],
        responseField: 'licenses',
      },
      attributes: {
        labelTranslationKey: 'labels.licenses',
      },
    },
  },
  {
    heading: 'Initial Access Levels',
    help: 'Select access level',
    required: false,
    enabled: true,
    content: {
      type: 'radioButtons',
      meta: { schemaVersion: '1.0' },
      options: [],
      attributes: {
        labelTranslationKey: 'labels.initialAccessLevels',
      },
    },
  },
] as any as typeof DefaultResearchOutputTableQuestion['columns'];

const createMockRow = (
  title: string = '',
  description: string = '',
  outputType: string = '',
  dataFlags: string[] = [],
  repositories: any[] = [],
  metadataStandards: any[] = [],
  licenses: any[] = [],
  accessLevel: string = '',
  releaseDate: string = '',
  byteSize: string = ''
): ResearchOutputTable => ({
  columns: [
    { type: 'text', meta: { schemaVersion: '1.0' }, answer: title },
    { type: 'textArea', meta: { schemaVersion: '1.0' }, answer: description },
    { type: 'selectBox', meta: { schemaVersion: '1.0' }, answer: outputType },
    { type: 'checkBoxes', meta: { schemaVersion: '1.0' }, answer: dataFlags },
    { type: 'repositorySearch', meta: { schemaVersion: '1.0' }, answer: repositories },
    {
      type: 'metadataStandardSearch',
      meta: { schemaVersion: '1.0' },
      answer: metadataStandards,
    },
    { type: 'licenseSearch', meta: { schemaVersion: '1.0' }, answer: licenses },
    { type: 'radioButtons', meta: { schemaVersion: '1.0' }, answer: accessLevel },
    { type: 'text', meta: { schemaVersion: '1.0' }, answer: releaseDate },
    { type: 'text', meta: { schemaVersion: '1.0' }, answer: byteSize },
  ],
});

describe('SingleResearchOutputComponent', () => {
  let mockSetRows: jest.Mock;
  let mockOnSave: jest.Mock;
  let mockOnCancel: jest.Mock;
  const user = userEvent.setup();

  beforeEach(() => {
    window.confirm = jest.fn(() => true);
    window.scrollTo = jest.fn();
    mockSetRows = jest.fn();
    mockOnSave = jest.fn();
    mockOnCancel = jest.fn();
    jest.clearAllMocks();
  });

  describe('Initial Render', () => {
    it('should render all form fields', () => {
      const mockRow = createMockRow();

      renderWithProviders(
        <SingleResearchOutputComponent
          columns={mockColumns}
          rows={[mockRow]}
          setRows={mockSetRows}
        />
      );

      expect(screen.getByLabelText('labels.title')).toBeInTheDocument();
      expect(screen.getByLabelText('labels.description')).toBeInTheDocument();
      expect(screen.getByLabelText('labels.outputType')).toBeInTheDocument();
      expect(screen.getByText('labels.dataFlags')).toBeInTheDocument();
      expect(screen.getByText('labels.repositories')).toBeInTheDocument();
      expect(screen.getByText('labels.metadataStandards')).toBeInTheDocument();
      expect(screen.getByLabelText('labels.licenses')).toBeInTheDocument();
      expect(screen.getByLabelText('labels.initialAccessLevels')).toBeInTheDocument();
      expect(screen.getByLabelText('labels.anticipatedReleaseDate')).toBeInTheDocument();
      expect(screen.getByLabelText('labels.anticipatedFileSize')).toBeInTheDocument();
    });

    it('should render with existing data', () => {
      const mockRow = createMockRow(
        'Test Dataset',
        'Test Description',
        'dataset',
        ['sensitive'],
        [{ repositoryId: 'repo1', repositoryName: 'Zenodo' }],
        [{ metadataStandardId: 'std1', metadataStandardName: 'Dublin Core' }],
        [{ licenseId: 'https://spdx.org/licenses/CC0-1.0.json', licenseName: 'CC0-1.0' }],
        'open',
        '2025-12-31',
        '100 mb'
      );

      renderWithProviders(
        <SingleResearchOutputComponent
          columns={mockColumns}
          rows={[mockRow]}
          setRows={mockSetRows}
        />
      );

      expect(screen.getByLabelText('labels.title')).toHaveValue('Test Dataset');
      expect(screen.getByLabelText('labels.description')).toHaveValue('Test Description');
      expect(screen.getByLabelText('labels.outputType')).toHaveValue('dataset');
    });

    it('should not show buttons when showButtons is false', () => {
      const mockRow = createMockRow();

      renderWithProviders(
        <SingleResearchOutputComponent
          columns={mockColumns}
          rows={[mockRow]}
          setRows={mockSetRows}
          showButtons={false}
        />
      );

      expect(screen.queryByText('Save')).not.toBeInTheDocument();
      expect(screen.queryByText('Update')).not.toBeInTheDocument();
      expect(screen.queryByText('Back to List')).not.toBeInTheDocument();
    });

    it('should show Save button when isNewEntry is true', () => {
      const mockRow = createMockRow();

      renderWithProviders(
        <SingleResearchOutputComponent
          columns={mockColumns}
          rows={[mockRow]}
          setRows={mockSetRows}
          showButtons={true}
          isNewEntry={true}
        />
      );

      expect(screen.getByText('buttons.save')).toBeInTheDocument();
      expect(screen.queryByText('buttons.update')).not.toBeInTheDocument();
    });

    it('should show Update button when isNewEntry is false', () => {
      const mockRow = createMockRow();

      renderWithProviders(
        <SingleResearchOutputComponent
          columns={mockColumns}
          rows={[mockRow]}
          setRows={mockSetRows}
          showButtons={true}
          isNewEntry={false}
        />
      );

      expect(screen.getByText('buttons.update')).toBeInTheDocument();
      expect(screen.queryByText('buttons.save')).not.toBeInTheDocument();
    });

    it('should show Back to List button when hasOtherRows is true', () => {
      const mockRow = createMockRow();

      renderWithProviders(
        <SingleResearchOutputComponent
          columns={mockColumns}
          rows={[mockRow]}
          setRows={mockSetRows}
          showButtons={true}
          hasOtherRows={true}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText(/buttons.backToList/i)).toBeInTheDocument();
    });

    it('should not show Back to List button when isNewEntry and no other rows', () => {
      const mockRow = createMockRow();

      renderWithProviders(
        <SingleResearchOutputComponent
          columns={mockColumns}
          rows={[mockRow]}
          setRows={mockSetRows}
          showButtons={true}
          isNewEntry={true}
          hasOtherRows={false}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.queryByText('< Back to List')).not.toBeInTheDocument();
    });
  });

  describe('Field Interactions', () => {
    it('should update text field value', async () => {
      const mockRow = createMockRow();

      const CustomComponent = () => {
        const [rows, setRows] = React.useState([mockRow]);
        return (
          <NextIntlClientProvider messages={messages} locale="en">
            <SingleResearchOutputComponent
              columns={mockColumns}
              rows={rows}
              setRows={setRows}
            />
          </NextIntlClientProvider>
        );
      };

      render(<CustomComponent />);

      const titleInput = screen.getByLabelText('labels.title');
      await user.type(titleInput, 'New Title');

      expect(titleInput).toHaveValue('New Title');
    });

    it('should update textarea value', async () => {
      const mockRow = createMockRow();

      const CustomComponent = () => {
        const [rows, setRows] = React.useState([mockRow]);
        return (
          <NextIntlClientProvider messages={messages} locale="en">
            <SingleResearchOutputComponent
              columns={mockColumns}
              rows={rows}
              setRows={setRows}
            />
          </NextIntlClientProvider>
        );
      };

      render(<CustomComponent />);

      const descriptionTextarea = screen.getByLabelText('labels.description');
      await user.type(descriptionTextarea, 'New Description');

      expect(descriptionTextarea).toHaveValue('New Description');
    });

    it('should update select field value', async () => {
      const mockRow = createMockRow();

      const CustomComponent = () => {
        const [rows, setRows] = React.useState([mockRow]);
        return (
          <NextIntlClientProvider messages={messages} locale="en">
            <SingleResearchOutputComponent
              columns={mockColumns}
              rows={rows}
              setRows={setRows}
            />
          </NextIntlClientProvider>
        );
      };

      render(<CustomComponent />);

      const outputTypeSelect = screen.getByLabelText('labels.outputType');
      await user.selectOptions(outputTypeSelect, 'dataset');

      expect(outputTypeSelect).toHaveValue('dataset');
    });

    it('should handle repository selection', async () => {
      const mockRow = createMockRow();

      const CustomComponent = () => {
        const [rows, setRows] = React.useState([mockRow]);
        return (
          <NextIntlClientProvider messages={messages} locale="en">
            <SingleResearchOutputComponent
              columns={mockColumns}
              rows={rows}
              setRows={setRows}
            />
          </NextIntlClientProvider>
        );
      };

      render(<CustomComponent />);

      const addRepoButton = screen.getByText('Add Repository');
      await user.click(addRepoButton);

      // Check that setRows was called
      await waitFor(() => {
        const repoValue = screen.getByTestId('repo-value');
        expect(repoValue.textContent).toContain('[]');
      });
    });

    it('should handle metadata standard selection', async () => {
      const mockRow = createMockRow();

      const CustomComponent = () => {
        const [rows, setRows] = React.useState([mockRow]);
        return (
          <NextIntlClientProvider messages={messages} locale="en">
            <SingleResearchOutputComponent
              columns={mockColumns}
              rows={rows}
              setRows={setRows}
            />
          </NextIntlClientProvider>
        );
      };

      render(<CustomComponent />);

      const addMetadataButton = screen.getByText('Add Metadata Standard');
      await user.click(addMetadataButton);

      await waitFor(() => {
        const metadataValue = screen.getByTestId('metadata-value');
        expect(metadataValue.textContent).toContain("[{\"id\":\"https://dublincore.org\",\"name\":\"Dublin Core\",\"uri\":\"https://dublincore.org\"}]");
      });
    });

    it('should handle license selection', async () => {
      const mockRow = createMockRow(
        '', '', '', [], [], [],
        [{ licenseId: 'https://spdx.org/licenses/CC0-1.0.json', licenseName: 'CC0-1.0' }]
      );

      const CustomComponent = () => {
        const [rows, setRows] = React.useState([mockRow]);
        return (
          <NextIntlClientProvider messages={messages} locale="en">
            <SingleResearchOutputComponent
              columns={mockColumns}
              rows={rows}
              setRows={setRows}
            />
          </NextIntlClientProvider>
        );
      };

      render(<CustomComponent />);

      const licenseSelect = screen.getByLabelText('labels.licenses');

      // Verify initial selection
      expect(licenseSelect).toHaveValue('https://spdx.org/licenses/CC0-1.0.json');

      // Test changing selection
      await user.selectOptions(licenseSelect, 'https://spdx.org/licenses/MIT.json');

      await waitFor(() => {
        expect(licenseSelect).toHaveValue('https://spdx.org/licenses/MIT.json');
      });
    });

    it('should handle file size input', async () => {
      const mockRow = createMockRow();

      const CustomComponent = () => {
        const [rows, setRows] = React.useState([mockRow]);
        return (
          <NextIntlClientProvider messages={messages} locale="en">
            <SingleResearchOutputComponent
              columns={mockColumns}
              rows={rows}
              setRows={setRows}
            />
          </NextIntlClientProvider>
        );
      };

      render(<CustomComponent />);

      const fileSizeInput = screen.getByLabelText('labels.anticipatedFileSize');
      await user.type(fileSizeInput, '100');

      expect(fileSizeInput).toHaveValue(100);
    });

    it('should handle file size unit selection', async () => {
      const mockRow = createMockRow();

      const CustomComponent = () => {
        const [rows, setRows] = React.useState([mockRow]);
        return (
          <NextIntlClientProvider messages={messages} locale="en">
            <SingleResearchOutputComponent
              columns={mockColumns}
              rows={rows}
              setRows={setRows}
            />
          </NextIntlClientProvider>
        );
      };

      render(<CustomComponent />);

      // First enter a file size value
      const fileSizeInput = screen.getByLabelText('labels.anticipatedFileSize');
      await user.type(fileSizeInput, '100');

      // Then change the unit
      const unitSelect = screen.getByLabelText('labels.fileSizeUnit');
      await user.selectOptions(unitSelect, 'mb');

      expect(unitSelect).toHaveValue('mb');
      expect(fileSizeInput).toHaveValue(100);
    });
  });

  describe('Form Validation', () => {
    it('should show error for required empty title field', async () => {
      const mockRow = createMockRow();

      renderWithProviders(
        <SingleResearchOutputComponent
          columns={mockColumns}
          rows={[mockRow]}
          setRows={mockSetRows}
          showButtons={true}
          onSave={mockOnSave}
        />
      );

      const saveButton = screen.getByText('buttons.update');
      await user.click(saveButton);

      await waitFor(() => {
        const fieldErrorMessage = screen.getAllByText('messaging.errors.requiredField');
        expect(fieldErrorMessage.length).toBeGreaterThan(0);
      });

      expect(mockOnSave).not.toHaveBeenCalled();
    });

    it('should clear field error when user types', async () => {
      const mockRow = createMockRow();

      const CustomComponent = () => {
        const [rows, setRows] = React.useState([mockRow]);
        return (
          <NextIntlClientProvider messages={messages} locale="en">
            <SingleResearchOutputComponent
              columns={mockColumns}
              rows={rows}
              setRows={setRows}
              showButtons={true}
              onSave={mockOnSave}
            />
          </NextIntlClientProvider>
        );
      };

      render(<CustomComponent />);

      // Trigger validation error
      const saveButton = screen.getByText('buttons.update');
      await user.click(saveButton);

      await waitFor(() => {
        const fieldErrorMessage = screen.getAllByText('messaging.errors.requiredField');
        expect(fieldErrorMessage.length).toBeGreaterThan(0);
      });

      // Type in the field
      const titleInput = screen.getByLabelText('labels.title');
      await user.type(titleInput, 'New Title');

      // Error should be cleared
      await waitFor(() => {
        expect(screen.queryByText('Title is required')).not.toBeInTheDocument();
      });
    });

    it('should allow save with all required fields filled', async () => {
      const mockRow = createMockRow('Test Title', 'Test Description', 'dataset');

      renderWithProviders(
        <SingleResearchOutputComponent
          columns={mockColumns}
          rows={[mockRow]}
          setRows={mockSetRows}
          showButtons={true}
          onSave={mockOnSave}
        />
      );

      const saveButton = screen.getByText('buttons.update');
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalled();
      });
    });
  });

  describe('Save, Cancel, and Delete Actions', () => {
    it('should call onSave when save button is clicked with valid form', async () => {
      const mockRow = createMockRow('Title', 'Description', 'dataset');

      renderWithProviders(
        <SingleResearchOutputComponent
          columns={mockColumns}
          rows={[mockRow]}
          setRows={mockSetRows}
          showButtons={true}
          onSave={mockOnSave}
        />
      );

      const saveButton = screen.getByText('buttons.update');
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalled();
      });
    });

    it('should call onCancel when cancel button is clicked without changes', async () => {
      const mockRow = createMockRow('Title', 'Description', 'dataset');

      renderWithProviders(
        <SingleResearchOutputComponent
          columns={mockColumns}
          rows={[mockRow]}
          setRows={mockSetRows}
          showButtons={true}
          hasOtherRows={true}
          onCancel={mockOnCancel}
        />
      );

      const cancelButton = screen.getByRole('button', { name: /buttons.backToList/i });
      await user.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalled();
    });

    it('should show confirmation dialog when canceling with unsaved changes', async () => {
      const mockRow = createMockRow('Title', 'Description', 'dataset');

      const CustomComponent = () => {
        const [rows, setRows] = React.useState([mockRow]);
        return (
          <NextIntlClientProvider messages={messages} locale="en">
            <SingleResearchOutputComponent
              columns={mockColumns}
              rows={rows}
              setRows={setRows}
              showButtons={true}
              hasOtherRows={true}
              onCancel={mockOnCancel}
            />
          </NextIntlClientProvider>
        );
      };

      render(<CustomComponent />);

      // Make a change
      const titleInput = screen.getByLabelText('labels.title');
      await user.clear(titleInput);
      await user.type(titleInput, 'Modified Title');

      // Try to cancel
      const cancelButton = screen.getByRole('button', { name: /buttons.backToList/i });
      await user.click(cancelButton);

      // Confirmation dialog should appear
      expect(window.confirm).toHaveBeenCalledWith(
        'messaging.unsavedChangesWarning'
      );
    });

    it('should not cancel if user declines confirmation', async () => {
      window.confirm = jest.fn(() => false);
      const mockRow = createMockRow('Title', 'Description', 'dataset');

      const CustomComponent = () => {
        const [rows, setRows] = React.useState([mockRow]);
        return (
          <NextIntlClientProvider messages={messages} locale="en">
            <SingleResearchOutputComponent
              columns={mockColumns}
              rows={rows}
              setRows={setRows}
              showButtons={true}
              hasOtherRows={true}
              onCancel={mockOnCancel}
            />
          </NextIntlClientProvider>
        );
      };

      render(<CustomComponent />);

      // Make a change
      const titleInput = screen.getByLabelText('labels.title');
      await user.type(titleInput, 'X');

      // Try to cancel
      const cancelButton = screen.getByRole('button', { name: /buttons.backToList/i });
      await user.click(cancelButton);

      expect(mockOnCancel).not.toHaveBeenCalled();
    });

    it('should clear unsaved changes flag after successful save', async () => {
      const mockRow = createMockRow('Title', 'Description', 'dataset');

      const CustomComponent = () => {
        const [rows, setRows] = React.useState([mockRow]);
        return (
          <NextIntlClientProvider messages={messages} locale="en">
            <SingleResearchOutputComponent
              columns={mockColumns}
              rows={rows}
              setRows={setRows}
              showButtons={true}
              hasOtherRows={true}
              onSave={mockOnSave}
              onCancel={mockOnCancel}
            />
          </NextIntlClientProvider>
        );
      };

      render(<CustomComponent />);

      // Make a change
      const titleInput = screen.getByLabelText('labels.title');
      await user.type(titleInput, 'X');

      // Save
      const saveButton = screen.getByText('buttons.update');
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalled();
      });

      // Now cancel should not show confirmation
      window.confirm = jest.fn(() => true);
      const cancelButton = screen.getByRole('button', { name: /buttons.backToList/i });
      await user.click(cancelButton);

      expect(window.confirm).not.toHaveBeenCalled();
      expect(mockOnCancel).toHaveBeenCalled();
    });
  });

  describe('Default Research Output Types', () => {
    it('should render default research output types when no options provided', () => {
      const mockRow = createMockRow();

      renderWithProviders(
        <SingleResearchOutputComponent
          columns={mockColumns}
          rows={[mockRow]}
          setRows={mockSetRows}
        />
      );

      const outputTypeSelect = screen.getByLabelText('labels.outputType');
      const options = within(outputTypeSelect).getAllByRole('option');

      // Should include the default "Select..." option plus the 4 types
      expect(options).toHaveLength(5);
      expect(within(outputTypeSelect).getByText('Audiovisual')).toBeInTheDocument();
      expect(within(outputTypeSelect).getByText('Dataset')).toBeInTheDocument();
      expect(within(outputTypeSelect).getByText('Software')).toBeInTheDocument();
      expect(within(outputTypeSelect).getByText('Text')).toBeInTheDocument();
    });
  });

  describe('Recommended Licenses', () => {
    it('should render recommended licenses', () => {
      const mockRow = createMockRow();

      renderWithProviders(
        <SingleResearchOutputComponent
          columns={mockColumns}
          rows={[mockRow]}
          setRows={mockSetRows}
        />
      );

      const licenseSelect = screen.getByLabelText('labels.licenses');
      const options = within(licenseSelect).getAllByRole('option');

      expect(options).toHaveLength(4); // Select... + 3 licenses
      expect(within(licenseSelect).getByText('CC0-1.0')).toBeInTheDocument();
      expect(within(licenseSelect).getByText('CC-BY-4.0')).toBeInTheDocument();
      expect(within(licenseSelect).getByText('MIT')).toBeInTheDocument();
    });
  });

  describe('Column Preferences', () => {
    it('should use repository preferences when provided', () => {
      const columnsWithPreferences = [...mockColumns];
      columnsWithPreferences[4] = {
        ...columnsWithPreferences[4],
        preferences: [
          { value: 'https://zenodo.org', label: 'Zenodo' },
          { value: 'https://figshare.com', label: 'Figshare' },
        ],
      };

      // Create a row where repository answer is undefined/null, not an empty array
      const mockRow: ResearchOutputTable = {
        columns: [
          { type: 'text', meta: { schemaVersion: '1.0' }, answer: '' },
          { type: 'textArea', meta: { schemaVersion: '1.0' }, answer: '' },
          { type: 'selectBox', meta: { schemaVersion: '1.0' }, answer: '' },
          { type: 'checkBoxes', meta: { schemaVersion: '1.0' }, answer: [] },
          { type: 'repositorySearch', meta: { schemaVersion: '1.0' }, answer: undefined as any }, // Not an array!
          { type: 'metadataStandardSearch', meta: { schemaVersion: '1.0' }, answer: [] },
          { type: 'licenseSearch', meta: { schemaVersion: '1.0' }, answer: [] },
          { type: 'radioButtons', meta: { schemaVersion: '1.0' }, answer: '' },
          { type: 'text', meta: { schemaVersion: '1.0' }, answer: '' },
          { type: 'text', meta: { schemaVersion: '1.0' }, answer: '' },
        ],
      };

      renderWithProviders(
        <SingleResearchOutputComponent
          columns={columnsWithPreferences as any}
          rows={[mockRow]}
          setRows={mockSetRows}
        />
      );

      const repoValue = screen.getByTestId('repo-value');
      expect(repoValue.textContent).toContain('Zenodo');
      expect(repoValue.textContent).toContain('Figshare');
    });

    it('should use metadata standard preferences when provided', () => {
      const columnsWithPreferences = [...mockColumns];
      columnsWithPreferences[5] = {
        ...columnsWithPreferences[5],
        preferences: [
          { value: 'https://dublincore.org', label: 'Dublin Core' },
          { value: 'https://datacite.org', label: 'DataCite' },
        ],
      };

      // Create a row where metadata standard answer is undefined/null, not an empty array
      const mockRow: ResearchOutputTable = {
        columns: [
          { type: 'text', meta: { schemaVersion: '1.0' }, answer: '' },
          { type: 'textArea', meta: { schemaVersion: '1.0' }, answer: '' },
          { type: 'selectBox', meta: { schemaVersion: '1.0' }, answer: '' },
          { type: 'checkBoxes', meta: { schemaVersion: '1.0' }, answer: [] },
          { type: 'repositorySearch', meta: { schemaVersion: '1.0' }, answer: [] },
          { type: 'metadataStandardSearch', meta: { schemaVersion: '1.0' }, answer: undefined as any }, // Not an array!
          { type: 'licenseSearch', meta: { schemaVersion: '1.0' }, answer: [] },
          { type: 'radioButtons', meta: { schemaVersion: '1.0' }, answer: '' },
          { type: 'text', meta: { schemaVersion: '1.0' }, answer: '' },
          { type: 'text', meta: { schemaVersion: '1.0' }, answer: '' },
        ],
      };

      renderWithProviders(
        <SingleResearchOutputComponent
          columns={columnsWithPreferences as any}
          rows={[mockRow]}
          setRows={mockSetRows}
        />
      );

      const metadataValue = screen.getByTestId('metadata-value');
      expect(metadataValue.textContent).toContain('Dublin Core');
      expect(metadataValue.textContent).toContain('DataCite');
    });

    it('should use license preferences over recommended licenses', () => {
      const columnsWithPreferences = [...mockColumns];
      columnsWithPreferences[6] = {
        ...columnsWithPreferences[6],
        preferences: [
          { value: 'https://spdx.org/licenses/GPL-3.0.json', label: 'GPL-3.0' },
          { value: 'https://spdx.org/licenses/Apache-2.0.json', label: 'Apache-2.0' },
        ],
      };

      const mockRow = createMockRow();

      renderWithProviders(
        <SingleResearchOutputComponent
          columns={columnsWithPreferences as any}
          rows={[mockRow]}
          setRows={mockSetRows}
        />
      );

      const licenseSelect = screen.getByLabelText('labels.licenses');

      expect(within(licenseSelect).getByText('GPL-3.0')).toBeInTheDocument();
      expect(within(licenseSelect).getByText('Apache-2.0')).toBeInTheDocument();
      // Should not show recommended licenses
      expect(within(licenseSelect).queryByText('CC0-1.0')).not.toBeInTheDocument();
    });
  });

  describe('Byte Size Parsing', () => {
    it('should parse existing byte size answer correctly', () => {
      const mockRow = createMockRow('', '', '', [], [], [], [], '', '', '100 mb');

      renderWithProviders(
        <SingleResearchOutputComponent
          columns={mockColumns}
          rows={[mockRow]}
          setRows={mockSetRows}
        />
      );

      const fileSizeInput = screen.getByLabelText('labels.anticipatedFileSize');
      const unitSelect = screen.getByLabelText('labels.fileSizeUnit');

      expect(fileSizeInput).toHaveValue(100);
      expect(unitSelect).toHaveValue('mb');
    });

    it('should handle empty byte size answer', () => {
      const mockRow = createMockRow();

      renderWithProviders(
        <SingleResearchOutputComponent
          columns={mockColumns}
          rows={[mockRow]}
          setRows={mockSetRows}
        />
      );

      const fileSizeInput = screen.getByLabelText('labels.anticipatedFileSize');
      const unitSelect = screen.getByLabelText('labels.fileSizeUnit');

      expect(fileSizeInput).toHaveValue(null);
      expect(unitSelect).toHaveValue('kb'); // Default
    });
  });

  describe('Data Flags Checkbox', () => {
    it('should render only checked data flags options', () => {
      const mockRow = createMockRow();

      renderWithProviders(
        <SingleResearchOutputComponent
          columns={mockColumns}
          rows={[mockRow]}
          setRows={mockSetRows}
        />
      );

      // Both options have checked: true in mockColumns
      expect(screen.getByText('labels.mayContainSensitiveData')).toBeInTheDocument();
      expect(screen.getByText('labels.mayContainPersonalData')).toBeInTheDocument();
    });
  });

  describe('Error Messages Display', () => {
    it('should display error messages component when errors exist', async () => {
      const mockRow = createMockRow();

      renderWithProviders(
        <SingleResearchOutputComponent
          columns={mockColumns}
          rows={[mockRow]}
          setRows={mockSetRows}
          showButtons={true}
          onSave={mockOnSave}
        />
      );

      const saveButton = screen.getByText('buttons.update');
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByTestId('error-messages')).toBeInTheDocument();
        const errorMessages = screen.getAllByTestId('error-message');
        expect(errorMessages.length).toBeGreaterThan(0);
      });
    });

    it('should not display error messages when no errors', () => {
      const mockRow = createMockRow('Title', 'Description', 'dataset');

      renderWithProviders(
        <SingleResearchOutputComponent
          columns={mockColumns}
          rows={[mockRow]}
          setRows={mockSetRows}
        />
      );

      expect(screen.queryByTestId('error-messages')).not.toBeInTheDocument();
    });
  });
});
