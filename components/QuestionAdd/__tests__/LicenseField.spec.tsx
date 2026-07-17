import React from 'react';
import { act, render, screen, fireEvent } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import LicenseField from '../LicenseField';
import { LicenseFieldProps } from '@/app/types';
import { LicensesQuery } from '@/generated/graphql';

import mockLicensesData from '../__mocks__/mockLicensesData.json';
import { ResearchOutputTableColumnsEnum } from "@dmptool/types";
expect.extend(toHaveNoViolations);

const mockLicensesQuery = mockLicensesData as LicensesQuery;

// Mock the FormSelect component
jest.mock('@/components/Form', () => ({
  FormSelect: ({
    label,
    items,
    onChange,
    selectedKey,
    'data-testid': dataTestId
  }: { label: string; items: []; onChange: (value: string) => void; selectedKey: string | undefined; 'data-testid': string }) => (
    <div data-testid={dataTestId || 'form-select'}>
      <label>{label}</label>
      <select
        value={selectedKey || 'defaults'}
        onChange={(e) => onChange && onChange(e.target.value)}
        data-testid="select-input"
        aria-label={label}
      >
        {items.map((item: { id: string, name: string }) => (
          <option key={item.id} value={item.id}>
            {item.name}
          </option>
        ))}
      </select>
    </div>
  ),
}));

describe('LicenseField', () => {
  const defaultProps: LicenseFieldProps = {
    field: {
      id: 'licenses',
      commonStandardId: ResearchOutputTableColumnsEnum.enum.license_ref,
      label: 'Licenses',
      enabled: true,
      licensesConfig: {
        mode: 'defaults',
        selectedDefaults: [],
        customTypes: [],
      },
    },
    licensesData: mockLicensesQuery,
    newLicenseType: '',
    setNewLicenseType: jest.fn(),
    onModeChange: jest.fn(),
    onAddCustomType: jest.fn(),
    onRemoveCustomType: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderComponent = (props: Partial<LicenseFieldProps> = {}) => {
    return render(<LicenseField {...defaultProps} {...props} />);
  };

  describe('Rendering', () => {
    it('renders without crashing', () => {
      renderComponent();
      expect(screen.getByText('researchOutput.licenses.labels.define')).toBeInTheDocument();
    });

    it('renders with correct initial structure', () => {
      renderComponent();

      expect(screen.getByTestId('form-select')).toBeInTheDocument();
      const select = screen.getByTestId('select-input');
      expect(select).toHaveValue('defaults');
    });

    it('should pass axe accessibility test', async () => {
      const { container } = render(
        <LicenseField {...defaultProps} />
      );

      await act(async () => {
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });

    });

    describe('Defaults Mode', () => {
      it('displays default licenses when mode is "defaults"', () => {
        renderComponent({
          field: {
            ...defaultProps.field,
            licensesConfig: {
              mode: 'defaults',
              selectedDefaults: [],
              customTypes: [],
            },
          },
        });

        expect(screen.getByText('researchOutput.licenses.labels.defaultPreferred')).toBeInTheDocument();

        // Check that recommended licenses from mock data are displayed
        expect(screen.getByText('CC-BY-4.0')).toBeInTheDocument();
        expect(screen.getByText('CC0-1.0')).toBeInTheDocument();
      });

      it('does not display custom license section in defaults mode', () => {
        renderComponent({
          field: {
            ...defaultProps.field,
            licensesConfig: {
              mode: 'defaults',
              selectedDefaults: [],
              customTypes: [],
            },
          },
        });

        expect(screen.queryByText('My Licenses')).not.toBeInTheDocument();
        expect(screen.queryByText('Add license')).not.toBeInTheDocument();
      });
    });

    describe('Add To Defaults Mode', () => {
      const addToDefaultsField = {
        ...defaultProps.field,
        licensesConfig: {
          mode: 'addToDefaults' as const,
          selectedDefaults: [],
          customTypes: [
            { name: 'Custom License 1', uri: 'https://example.com/license1' },
            { name: 'Custom License 2', uri: 'https://example.com/license2' }
          ],
        },
      };

      it('displays custom license section when mode is "addToDefaults"', () => {
        renderComponent({
          field: addToDefaultsField,
        });
        expect(screen.getByText('researchOutput.licenses.labels.myLicenses')).toBeInTheDocument();
        expect(screen.getByText('researchOutput.licenses.labels.addLicense')).toBeInTheDocument();
        expect(screen.getByText('researchOutput.licenses.buttons.addLicenseType')).toBeInTheDocument();
      });

      it('displays custom licenses when they exist', () => {
        renderComponent({
          field: addToDefaultsField,
        });

        expect(screen.getByText('Custom License 1')).toBeInTheDocument();
        expect(screen.getByText('Custom License 2')).toBeInTheDocument();
      });

      it('displays remove buttons for custom licenses', () => {
        renderComponent({
          field: addToDefaultsField,
        });

        const removeButtons = screen.getAllByText('x');
        expect(removeButtons).toHaveLength(2);

        // Check aria-labels
        const removeButton = screen.getAllByLabelText('researchOutput.licenses.buttons.removeLicenseType');
        expect(removeButton).toHaveLength(2);
      });

      it('does not display custom licenses list when no custom licenses exist', () => {
        renderComponent({
          field: {
            ...defaultProps.field,
            licensesConfig: {
              mode: 'addToDefaults',
              selectedDefaults: [],
              customTypes: [],
            },
          },
        });

        expect(screen.getByText('researchOutput.licenses.labels.myLicenses')).toBeInTheDocument();
        expect(screen.queryByText('Custom License 1')).not.toBeInTheDocument();
      });

      it('displays license selector with other licenses options', () => {
        renderComponent({
          field: {
            ...defaultProps.field,
            licensesConfig: {
              mode: 'addToDefaults',
              selectedDefaults: [],
              customTypes: [],
            },
          },
        });

        // The FormSelect should be rendered with other licenses
        expect(screen.getByText('researchOutput.licenses.labels.addLicense')).toBeInTheDocument();
      });
    });

    describe('User Interactions', () => {
      it('calls onModeChange when license mode is changed', async () => {
        const onModeChange = jest.fn();
        renderComponent({ onModeChange });

        const select = screen.getByTestId('select-input');
        fireEvent.change(select, { target: { value: 'addToDefaults' } });

        expect(onModeChange).toHaveBeenCalledWith('addToDefaults');
      });

      it('calls setNewLicenseType when license selector changes in addToDefaults mode', async () => {
        const setNewLicenseType = jest.fn();
        renderComponent({
          field: {
            ...defaultProps.field,
            licensesConfig: {
              mode: 'addToDefaults',
              selectedDefaults: [],
              customTypes: [],
            },
          },
          setNewLicenseType,
        });

        // Since we're mocking FormSelect, we need to trigger the onChange directly
        // In a real test, this would be more complex with react-aria-components
        const selects = screen.getAllByTestId('select-input');
        const licenseSelect = selects[1]; // Second select is for licenses

        // Use a valid URI from the mock data (non-recommended license)
        const validUri = 'https://spdx.org/licenses/any-OSI-perl-modules.json';
        fireEvent.change(licenseSelect, { target: { value: validUri } });

        expect(setNewLicenseType).toHaveBeenCalledWith(validUri);
      });

      it('calls onAddCustomType when add button is clicked', () => {
        const onAddCustomType = jest.fn();
        renderComponent({
          field: {
            ...defaultProps.field,
            licensesConfig: {
              mode: 'addToDefaults',
              selectedDefaults: [],
              customTypes: [],
            },
          },
          newLicenseType: 'New License',
          onAddCustomType,
        });

        const addButton = screen.getByText('researchOutput.licenses.buttons.addLicenseType');
        fireEvent.click(addButton);

        expect(onAddCustomType).toHaveBeenCalled();
      });

      it('disables add button when newLicenseType is empty or whitespace', () => {
        renderComponent({
          field: {
            ...defaultProps.field,
            licensesConfig: {
              mode: 'addToDefaults',
              selectedDefaults: [],
              customTypes: [],
            },
          },
          newLicenseType: '   ', // whitespace only
        });

        const addButton = screen.getByText('researchOutput.licenses.buttons.addLicenseType');
        expect(addButton).toBeDisabled();
      });

      it('enables add button when newLicenseType has content', () => {
        renderComponent({
          field: {
            ...defaultProps.field,
            licensesConfig: {
              mode: 'addToDefaults',
              selectedDefaults: [],
              customTypes: [],
            },
          },
          newLicenseType: 'Valid License',
        });

        const addButton = screen.getByText('researchOutput.licenses.buttons.addLicenseType');
        expect(addButton).not.toBeDisabled();
      });

      it('calls onRemoveCustomType when remove button is clicked', () => {
        const onRemoveCustomType = jest.fn();
        renderComponent({
          field: {
            ...defaultProps.field,
            licensesConfig: {
              mode: 'addToDefaults',
              selectedDefaults: [],
              customTypes: [{ name: 'Test License', uri: 'https://example.com/test' }],
            },
          },
          onRemoveCustomType,
        });

        const removeButton = screen.getByLabelText('researchOutput.licenses.buttons.removeLicenseType');
        fireEvent.click(removeButton);

        expect(onRemoveCustomType).toHaveBeenCalledWith('Test License');
      });
    });

    describe('Props Validation', () => {
      it('handles missing licensesConfig gracefully', () => {
        renderComponent({
          field: {
            ...defaultProps.field,
            licensesConfig: undefined,
          },
        });

        // Should default to 'defaults' mode
        const select = screen.getByTestId('select-input');
        expect(select).toHaveValue('defaults');
      });

      it('handles field without licensesConfig mode', () => {
        renderComponent({
          field: {
            ...defaultProps.field,
            licensesConfig: {
              selectedDefaults: [],
              customTypes: [],
              mode: 'defaults' as const
            }
          },
        });

        // Should default to 'defaults'
        const select = screen.getByTestId('select-input');
        expect(select).toHaveValue('defaults');
      });
    });

    describe('Edge Cases', () => {
      it('handles empty custom types array', () => {
        renderComponent({
          field: {
            ...defaultProps.field,
            licensesConfig: {
              mode: 'addToDefaults',
              selectedDefaults: [],
              customTypes: [],
            },
          },
        });

        expect(screen.getByText('researchOutput.licenses.labels.myLicenses')).toBeInTheDocument();
        expect(screen.queryByText('x')).not.toBeInTheDocument();
      });

      it('handles multiple custom types correctly', () => {
        const multipleCustomTypes = [
          { name: 'License A', uri: 'https://example.com/a' },
          { name: 'License B', uri: 'https://example.com/b' },
          { name: 'License C', uri: 'https://example.com/c' }
        ];
        renderComponent({
          field: {
            ...defaultProps.field,
            licensesConfig: {
              mode: 'addToDefaults',
              selectedDefaults: [],
              customTypes: multipleCustomTypes,
            },
          },
        });

        multipleCustomTypes.forEach(license => {
          expect(screen.getByText(license.name)).toBeInTheDocument();
          const removeButtons = screen.getAllByLabelText('researchOutput.licenses.buttons.removeLicenseType');
          expect(removeButtons).toHaveLength(multipleCustomTypes.length);
        });

        // Should have 3 remove buttons
        expect(screen.getAllByText('x')).toHaveLength(3);
      });

      it('renders correctly with special characters in custom license names', () => {
        const specialLicense = { name: 'CC-BY-4.0 (Modified)', uri: 'https://example.com/modified' };
        renderComponent({
          field: {
            ...defaultProps.field,
            licensesConfig: {
              mode: 'addToDefaults',
              selectedDefaults: [],
              customTypes: [specialLicense],
            },
          },
        });

        expect(screen.getByText(specialLicense.name)).toBeInTheDocument();
        const removeButtons = screen.getAllByLabelText('researchOutput.licenses.buttons.removeLicenseType');
        expect(removeButtons).toHaveLength(1);
      });
    });

    describe('License Data Integration', () => {
      it('renders default licenses from licensesData', () => {
        renderComponent({
          field: {
            ...defaultProps.field,
            licensesConfig: {
              mode: 'defaults',
              selectedDefaults: [],
              customTypes: [],
            },
          },
        });

        // Should display licenses marked as recommended in mock data
        const recommendedLicenses = mockLicensesQuery.licenses?.filter(
          (license) => license?.recommended
        );
        expect(recommendedLicenses?.length).toBeGreaterThan(0);
      });

      it('provides non-recommended licenses as options in addToDefaults mode', () => {
        renderComponent({
          field: {
            ...defaultProps.field,
            licensesConfig: {
              mode: 'addToDefaults',
              selectedDefaults: [],
              customTypes: [],
            },
          },
        });

        // The FormSelect should have non-recommended licenses available
        expect(screen.getByText('researchOutput.licenses.labels.addLicense')).toBeInTheDocument();
      });

      it('handles missing licensesData gracefully', () => {
        renderComponent({
          licensesData: undefined,
          field: {
            ...defaultProps.field,
            licensesConfig: {
              mode: 'defaults',
              selectedDefaults: [],
              customTypes: [],
            },
          },
        });

        // Should not crash and should render the mode selector
        expect(screen.getByText('researchOutput.licenses.labels.define')).toBeInTheDocument();
      });
    });
  });
});
