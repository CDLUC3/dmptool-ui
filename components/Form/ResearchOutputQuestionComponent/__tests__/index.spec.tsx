import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { useParams } from 'next/navigation';
import { axe, toHaveNoViolations } from 'jest-axe';
import ResearchOutputComponent from '@/components/Form/ResearchOutputQuestionComponent';
import {
  StandardField,
  AccessLevelInterface,
  OutputTypeInterface,
  AdditionalFieldsType
} from '@/app/types';
import mockStandardFields from '../__mocks__/mockStandardFields.json';
import rawAdditionalFields from '../__mocks__/mockAdditionalFields.json';

const mockAdditionalFields: AdditionalFieldsType[] = rawAdditionalFields.map(field => ({
  ...field,
  content: {
    ...field.content,
    type: field.content.type as "text", // Typecast to literal
    meta: {
      ...field.content.meta,
      title: field.content.meta.title ?? undefined,
      usageDescription: field.content.meta.usageDescription ?? undefined
    }
  }
}));

// Mock the child components that use Apollo Client
jest.mock('@/components/QuestionAdd/MetaDataStandards', () => ({
  __esModule: true,
  default: () => <div data-testid="metadata-standards-mock">MetaDataStandards Mock</div>
}));

jest.mock('@/components/QuestionAdd/ReposSelector', () => ({
  __esModule: true,
  default: () => <div data-testid="repo-selector-mock">RepositorySelectionSystem Mock</div>
}));

jest.mock('@/components/QuestionAdd/OutputTypeField', () => ({
  __esModule: true,
  default: () => <div data-testid="output-type-field-mock">OutputTypeField Mock</div>
}));

jest.mock('@/components/QuestionAdd/LicenseField', () => ({
  __esModule: true,
  default: () => <div data-testid="license-field-mock">LicenseField Mock</div>
}));

jest.mock('@/components/QuestionAdd/InitialAccessLevel', () => ({
  __esModule: true,
  default: () => <div data-testid="initial-access-level-mock">InitialAccessLevel Mock</div>
}));

expect.extend(toHaveNoViolations);

const expandedFields = ['title', 'outputType'];
const nonCustomizableFieldIds = ['accessLevels'];

const mockOutputType: OutputTypeInterface = {
  type: '',
  description: '',
};

const mockAccessLevel: AccessLevelInterface = {
  label: '',
  value: '',
  description: '',
  selected: false,
};

const mockParams = useParams as jest.Mock;

const defaultProps = {
  standardFields: mockStandardFields as StandardField[],
  additionalFields: mockAdditionalFields,
  expandedFields: expandedFields as string[],
  nonCustomizableFieldIds: nonCustomizableFieldIds as string[],
  newOutputType: mockOutputType,
  setNewOutputType: jest.fn(),
  newLicenseType: '',
  setNewLicenseType: jest.fn(),
  newAccessLevel: mockAccessLevel,
  setNewAccessLevel: jest.fn(),
  defaultResearchOutputTypesData: undefined,
  licensesData: undefined,
  defaultAccessLevels: [
    { label: 'Unrestricted Access', value: 'open', description: 'Allows open access' },
    { label: 'Controlled Access', value: 'restricted', description: 'Restricts access' },
    { label: 'Other', value: 'closed', description: 'Other access' },
  ],
  onStandardFieldChange: jest.fn(),
  onCustomizeField: jest.fn(),
  onUpdateStandardFieldProperty: jest.fn(),
  onTogglePreferredRepositories: jest.fn(),
  onRepositoriesChange: jest.fn(),
  onToggleMetaDataStandards: jest.fn(),
  onMetaDataStandardsChange: jest.fn(),
  onOutputTypeModeChange: jest.fn(),
  onAddCustomOutputType: jest.fn(),
  onRemoveCustomOutputType: jest.fn(),
  onLicenseModeChange: jest.fn(),
  onAddCustomLicenseType: jest.fn(),
  onRemoveCustomLicenseType: jest.fn(),
  onAccessLevelModeChange: jest.fn(),
  onAddCustomAccessLevel: jest.fn(),
  onRemoveCustomAccessLevels: jest.fn(),
  onDeleteAdditionalField: jest.fn(),
  onUpdateAdditionalField: jest.fn(),
  onAddAdditionalField: jest.fn(),
};

describe('ResearchOutputComponent', () => {

  beforeEach(() => {
    mockParams.mockReturnValue({
      templateId: '1',
    });
  })
  it('should render the component correctly', () => {
    render(
      <ResearchOutputComponent {...defaultProps} />
    );

    expect(screen.getByRole('heading', { name: 'researchOutput.headings.enableStandardFields' })).toBeInTheDocument();
    expect(screen.getByText('researchOutput.description')).toBeInTheDocument();
  });

  describe('Standard Fields', () => {
    it('should render all standard fields with correct labels', () => {
      render(<ResearchOutputComponent {...defaultProps} />);

      expect(screen.getByText('Title')).toBeInTheDocument();
      expect(screen.getByText('Description')).toBeInTheDocument();
      expect(screen.getByText('Output Type')).toBeInTheDocument();
      expect(screen.getByText('Data Flags')).toBeInTheDocument();
      expect(screen.getByText('Repositories')).toBeInTheDocument();
      expect(screen.getByText('Metadata Standards')).toBeInTheDocument();
      expect(screen.getByText('Licenses')).toBeInTheDocument();
      expect(screen.getByText('Initial Access Levels')).toBeInTheDocument();
    });

    it('should disable the checkbox for required fields', () => {
      render(<ResearchOutputComponent {...defaultProps} />);

      const checkboxes = screen.getAllByRole('checkbox');
      const titleCheckbox = checkboxes.find(cb => cb.closest('label')?.textContent?.includes('Title'));
      const outputTypeCheckbox = checkboxes.find(cb => cb.closest('label')?.textContent?.includes('Output Type'));

      expect(titleCheckbox).toBeDisabled();
      expect(outputTypeCheckbox).not.toBeDisabled();
    });

    it('should show tooltip for required fields', () => {
      render(<ResearchOutputComponent {...defaultProps} />);

      const tooltips = screen.getAllByText('researchOutput.tooltip.requiredFields');
      expect(tooltips).toHaveLength(2); // Title and Output Type
    });

    it('should call onStandardFieldChange when checkbox is toggled', () => {
      const mockOnChange = jest.fn();
      render(<ResearchOutputComponent {...defaultProps} onStandardFieldChange={mockOnChange} />);

      const descriptionCheckbox = screen.getByLabelText('Description');
      fireEvent.click(descriptionCheckbox);

      expect(mockOnChange).toHaveBeenCalledWith('description', expect.any(Boolean));
    });
  });

  describe('Field Expansion', () => {
    it('should show "customize" button for non-expanded fields', () => {
      const props = { ...defaultProps, expandedFields: [] };
      render(<ResearchOutputComponent {...props} />);

      const customizeButtons = screen.getAllByText('buttons.customize');
      expect(customizeButtons.length).toBeGreaterThan(0);
    });

    it('should show "close" button for expanded fields', () => {
      render(<ResearchOutputComponent {...defaultProps} />);

      expect(screen.getByText('buttons.close')).toBeInTheDocument(); // Output Type is expanded
    });

    it('should show "expand" button for non-customizable fields', () => {
      render(<ResearchOutputComponent {...defaultProps} />);

      expect(screen.getByText('links.expand')).toBeInTheDocument(); // Access Levels
    });

    it('should call onCustomizeField when customize button is clicked', () => {
      const mockOnCustomize = jest.fn();
      render(<ResearchOutputComponent {...defaultProps} onCustomizeField={mockOnCustomize} />);

      const customizeButton = screen.getAllByText('buttons.customize')[0];
      fireEvent.click(customizeButton);

      expect(mockOnCustomize).toHaveBeenCalled();
    });

    it('should render field panel when field is expanded', () => {
      const { container } = render(<ResearchOutputComponent {...defaultProps} />);

      // Since outputType is in expandedFields, check that the field panel div exists
      const fieldPanels = container.querySelectorAll('.fieldPanel');
      expect(fieldPanels.length).toBeGreaterThan(0);

      // Also verify the mocked OutputTypeField is rendered
      expect(screen.getByTestId('output-type-field-mock')).toBeInTheDocument();
    });

    it('should call onUpdateStandardFieldProperty when description help text is changed', () => {
      const mockOnUpdate = jest.fn();
      const propsWithDescriptionExpanded = {
        ...defaultProps,
        expandedFields: ['description'],
        onUpdateStandardFieldProperty: mockOnUpdate
      };
      render(<ResearchOutputComponent {...propsWithDescriptionExpanded} />);

      // Find the description help text input
      const helpTextInput = screen.getByLabelText(/labels\.helpText/);
      fireEvent.change(helpTextInput, { target: { value: 'New description help text' } });

      expect(mockOnUpdate).toHaveBeenCalledWith('description', 'helpText', 'New description help text');
    });

    it('should call onUpdateStandardFieldProperty when dataFlags checkbox is toggled', async () => {
      const mockOnUpdate = jest.fn();

      // Mock standard fields with dataFlags having options
      const fieldsWithDataFlags = mockStandardFields.map(field => {
        if (field.id === 'dataFlags') {
          return {
            ...field,
            content: {
              type: 'checkBoxes' as const,
              options: [
                { label: 'May contain sensitive data?', value: 'sensitive', checked: false },
                { label: 'May contain personally identifiable information?', value: 'personal', checked: false }
              ]
            }
          };
        }
        return field;
      }) as StandardField[];

      const propsWithDataFlagsExpanded = {
        ...defaultProps,
        standardFields: fieldsWithDataFlags,
        expandedFields: ['dataFlags'],
        onUpdateStandardFieldProperty: mockOnUpdate
      };

      render(<ResearchOutputComponent {...propsWithDataFlagsExpanded} />);

      // Find the sensitive data checkbox within the data flags section
      const sensitiveCheckbox = screen.getByLabelText('May contain sensitive data?');

      await act(async () => {
        fireEvent.click(sensitiveCheckbox);
      });

      // Verify the callback was called with updated content
      expect(mockOnUpdate).toHaveBeenCalledWith('dataFlags', 'content',
        expect.objectContaining({
          options: expect.arrayContaining([
            expect.objectContaining({ value: 'sensitive', selected: true })
          ])
        })
      );
    });

    it('should call onUpdateStandardFieldProperty when repoSelector help text is changed', () => {
      const mockOnUpdate = jest.fn();
      const propsWithRepoSelectorExpanded = {
        ...defaultProps,
        expandedFields: ['repoSelector'],
        onUpdateStandardFieldProperty: mockOnUpdate
      };
      render(<ResearchOutputComponent {...propsWithRepoSelectorExpanded} />);

      // Find the repositories help text input (look for the input with name "repositoriesHelpText")
      const helpTextInput = screen.getByLabelText(/labels\.helpText/i);
      fireEvent.change(helpTextInput, { target: { value: 'New repositories help text' } });

      expect(mockOnUpdate).toHaveBeenCalledWith('repoSelector', 'helpText', 'New repositories help text');
    });

    it('should call onUpdateStandardFieldProperty when metadataStandards help text is changed', () => {
      const mockOnUpdate = jest.fn();
      const propsWithMetadataExpanded = {
        ...defaultProps,
        expandedFields: ['metadataStandards'],
        onUpdateStandardFieldProperty: mockOnUpdate
      };
      render(<ResearchOutputComponent {...propsWithMetadataExpanded} />);

      // Find the metadata standards help text input by name attribute
      const helpTextInput = screen.getByRole('textbox', { name: /labels\.helpText/i });
      fireEvent.change(helpTextInput, { target: { value: 'New metadata standards help text' } });

      expect(mockOnUpdate).toHaveBeenCalledWith('metadataStandards', 'helpText', 'New metadata standards help text');
    });

    it('should call onUpdateStandardFieldProperty when licenses help text is changed', () => {
      const mockOnUpdate = jest.fn();
      const propsWithLicensesExpanded = {
        ...defaultProps,
        expandedFields: ['licenses'],
        onUpdateStandardFieldProperty: mockOnUpdate
      };
      render(<ResearchOutputComponent {...propsWithLicensesExpanded} />);

      // Find the licenses help text input
      const helpTextInput = screen.getByLabelText(/labels\.helpText/i);
      fireEvent.change(helpTextInput, { target: { value: 'New licenses help text' } });

      expect(mockOnUpdate).toHaveBeenCalledWith('licenses', 'helpText', 'New licenses help text');
    });

    it('should call onUpdateStandardFieldProperty when accessLevels help text is changed', () => {
      const mockOnUpdate = jest.fn();
      const propsWithAccessLevelsExpanded = {
        ...defaultProps,
        expandedFields: ['accessLevels'],
        onUpdateStandardFieldProperty: mockOnUpdate
      };
      render(<ResearchOutputComponent {...propsWithAccessLevelsExpanded} />);

      // Find the access levels help text input
      const helpTextInput = screen.getByLabelText(/labels.helpText/i);
      fireEvent.change(helpTextInput, { target: { value: 'New access levels help text' } });

      expect(mockOnUpdate).toHaveBeenCalledWith('accessLevels', 'helpText', 'New access levels help text');
    });
  });

  describe('Additional Fields', () => {
    it('should render additional fields section', () => {
      render(<ResearchOutputComponent {...defaultProps} />);

      expect(screen.getByText('researchOutput.headings.additionalTextFields')).toBeInTheDocument();
    });

    it('should render additional field with correct label', () => {
      render(<ResearchOutputComponent {...defaultProps} />);

      expect(screen.getByText('Coverage')).toBeInTheDocument();
    });

    it('should show delete button for additional fields', () => {
      render(<ResearchOutputComponent {...defaultProps} />);

      const deleteButton = screen.getByLabelText('buttons.delete');
      expect(deleteButton).toBeInTheDocument();
    });

    it('should call onDeleteAdditionalField when delete button is clicked', () => {
      const mockOnDelete = jest.fn();
      render(<ResearchOutputComponent {...defaultProps} onDeleteAdditionalField={mockOnDelete} />);

      const deleteButton = screen.getByLabelText('buttons.delete');
      fireEvent.click(deleteButton);

      expect(mockOnDelete).toHaveBeenCalledWith(expect.any(String));
    });

    it('should render add field button', () => {
      render(<ResearchOutputComponent {...defaultProps} />);

      expect(screen.getByText(/\+\s*researchOutput.additionalFields.addFieldBtn/)).toBeInTheDocument();
    });

    it('should call onAddAdditionalField when add button is clicked', () => {
      const mockOnAdd = jest.fn();
      render(<ResearchOutputComponent {...defaultProps} onAddAdditionalField={mockOnAdd} />);

      const addButton = screen.getByText(/\+\s*researchOutput.additionalFields.addFieldBtn/);
      fireEvent.click(addButton);

      expect(mockOnAdd).toHaveBeenCalled();
    });

    it('should call onCustomizeField when customize button is clicked on additional field', () => {
      const mockOnCustomize = jest.fn();
      const propsWithAdditionalField = {
        ...defaultProps,
        expandedFields: [],
        onCustomizeField: mockOnCustomize
      };
      render(<ResearchOutputComponent {...propsWithAdditionalField} />);

      // Find customize button in additional fields section (not in standard fields)
      const additionalFieldsSection = screen.getByText('researchOutput.headings.additionalTextFields').closest('.fieldsContainer');
      const customizeButton = additionalFieldsSection?.querySelector('.buttonLink.link');

      if (customizeButton) {
        fireEvent.click(customizeButton);
        expect(mockOnCustomize).toHaveBeenCalled();
      }
    });

    it('should call onUpdateAdditionalField when field label is changed', () => {
      const mockOnUpdate = jest.fn();
      const propsWithExpandedAdditional = {
        ...defaultProps,
        expandedFields: ['coverage'],
        onUpdateAdditionalField: mockOnUpdate
      };
      render(<ResearchOutputComponent {...propsWithExpandedAdditional} />);

      // Find the field label input
      const labelInput = screen.getByLabelText('researchOutput.additionalFields.fieldLabel.label');
      fireEvent.change(labelInput, { target: { value: 'New Coverage Label' } });

      expect(mockOnUpdate).toHaveBeenCalledWith('coverage', 'customLabel', 'New Coverage Label');
    });

    it('should call onUpdateAdditionalField when help text is changed', () => {
      const mockOnUpdate = jest.fn();
      const propsWithExpandedAdditional = {
        ...defaultProps,
        expandedFields: ['coverage'],
        onUpdateAdditionalField: mockOnUpdate
      };
      render(<ResearchOutputComponent {...propsWithExpandedAdditional} />);

      // Find the help text input
      const helpTextInputs = screen.getAllByLabelText(/labels\.helpText/);
      const additionalFieldHelpText = helpTextInputs[helpTextInputs.length - 1]; // Last one should be for additional field

      fireEvent.change(additionalFieldHelpText, { target: { value: 'New help text' } });

      expect(mockOnUpdate).toHaveBeenCalledWith('coverage', 'helpText', 'New help text');
    });

    it('should call onUpdateAdditionalField when max length is changed', () => {
      const mockOnUpdate = jest.fn();
      const propsWithExpandedAdditional = {
        ...defaultProps,
        expandedFields: ['coverage'],
        onUpdateAdditionalField: mockOnUpdate
      };
      render(<ResearchOutputComponent {...propsWithExpandedAdditional} />);

      // Find the max length input
      const maxLengthInput = screen.getByLabelText('researchOutput.additionalFields.maxLength.label');
      fireEvent.change(maxLengthInput, { target: { value: '120' } });

      expect(mockOnUpdate).toHaveBeenCalledWith('coverage', 'maxLength', '120');
    });

    it('should call onUpdateAdditionalField when default value is changed', () => {
      const mockOnUpdate = jest.fn();
      const propsWithExpandedAdditional = {
        ...defaultProps,
        expandedFields: ['coverage'],
        onUpdateAdditionalField: mockOnUpdate
      };
      render(<ResearchOutputComponent {...propsWithExpandedAdditional} />);

      // Find the default value input
      const defaultValueInput = screen.getByLabelText('researchOutput.additionalFields.defaultValue.label');
      fireEvent.change(defaultValueInput, { target: { value: 'Default coverage value' } });

      expect(mockOnUpdate).toHaveBeenCalledWith('coverage', 'defaultValue', 'Default coverage value');
    });

    it('should call onUpdateAdditionalField when additional field checkbox is toggled', () => {
      const mockOnChange = jest.fn();
      render(<ResearchOutputComponent {...defaultProps} onUpdateAdditionalField={mockOnChange} />);

      const coverageCheckbox = screen.getByLabelText('Coverage');
      fireEvent.click(coverageCheckbox);

      expect(mockOnChange).toHaveBeenCalledWith('coverage', 'enabled', expect.any(Boolean));
    });
  });

  describe('Output Type Field Panel', () => {
    it('should render OutputTypeField component when outputType field is expanded', () => {
      render(<ResearchOutputComponent {...defaultProps} />);

      // Verify the mocked OutputTypeField is rendered since outputType is in expandedFields
      expect(screen.getByTestId('output-type-field-mock')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should pass axe accessibility test', async () => {
      const { container } = render(
        <ResearchOutputComponent {...defaultProps} />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
