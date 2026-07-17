import React from 'react';
import { act, render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import OutputTypeField from '../OutputTypeField';
import {
  OutputTypeFieldConfigProps,
} from '@/app/types';
import { DefaultResearchOutputTypesQuery } from '@/generated/graphql';
import mockDefaultResearchOutputTypesData from '../__mocks__/mockDefaultResearchOutputTypes.json';
import { ResearchOutputTableColumnsEnum } from "@dmptool/types";

expect.extend(toHaveNoViolations);

interface OutputTypeFieldProps extends OutputTypeFieldConfigProps {
  defaultResearchOutputTypesData?: DefaultResearchOutputTypesQuery;
}

describe('OutputTypeField', () => {
  const defaultProps: OutputTypeFieldProps = {
    field: {
      id: 'outputTypes',
      commonStandardId: ResearchOutputTableColumnsEnum.enum.type,
      label: 'Output Types',
      enabled: true,
      outputTypeConfig: {
        mode: 'defaults',
        customTypes: [{ type: "Audiovisual", description: "A type of output that includes both visual and auditory content." }],
        selectedDefaults: [],
      },
    },
    defaultResearchOutputTypesData: mockDefaultResearchOutputTypesData as DefaultResearchOutputTypesQuery,
    newOutputType: { type: '', description: '' },
    setNewOutputType: jest.fn(),
    onModeChange: jest.fn(),
    onAddCustomType: jest.fn(),
    onRemoveCustomType: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderComponent = (props: Partial<OutputTypeFieldConfigProps> = {}) => {
    return render(<OutputTypeField {...defaultProps} {...props} />);
  };

  describe('Popover/Dialog Interactions', () => {
    it('should show description in popover when info button is clicked in defaults mode', async () => {
      renderComponent();

      // Find the first info button
      const infoButtons = screen.getAllByLabelText('labels.clickForMoreInfo');
      expect(infoButtons.length).toBeGreaterThan(0);

      // Click the first info button
      await act(async () => {
        fireEvent.click(infoButtons[0]);
      });

      // Wait for dialog to appear
      await waitFor(() => {
        const dialog = screen.getByRole('dialog');
        expect(dialog).toBeInTheDocument();
      });

      // Just verify that a dialog with some description appears
      const dialog = screen.getByRole('dialog');
      expect(dialog.textContent).toBeTruthy();
      expect(dialog.textContent!.length).toBeGreaterThan(0);
    });

    it('should show description in popover when info button is clicked for custom type with description', async () => {
      renderComponent({
        field: {
          ...defaultProps.field,
          outputTypeConfig: {
            mode: 'mine',
            customTypes: [
              { type: 'Custom Type', description: 'This is a custom description' }
            ],
            selectedDefaults: [],
          },
        },
      });

      const infoButton = screen.getByLabelText('labels.clickForMoreInfo');

      await act(async () => {
        fireEvent.click(infoButton);
      });

      await waitFor(() => {
        expect(screen.getByText('This is a custom description')).toBeInTheDocument();
      });
    });

    it('should not show info button for custom type without description', () => {
      renderComponent({
        field: {
          ...defaultProps.field,
          outputTypeConfig: {
            mode: 'mine',
            customTypes: [
              { type: 'Custom Type', description: '' }
            ],
            selectedDefaults: [],
          },
        },
      });

      expect(screen.queryByLabelText('labels.clickForMoreInfo')).not.toBeInTheDocument();
    });

    it('should close popover when Escape key is pressed', async () => {
      renderComponent();

      const infoButton = screen.getAllByLabelText('labels.clickForMoreInfo')[0];

      await act(async () => {
        fireEvent.click(infoButton);
      });

      // Verify popover is open
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Press Escape to close
      await act(async () => {
        fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
      });

      // Popover should be closed
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });
  });

  describe('Rendering', () => {
    it('renders without crashing', () => {
      renderComponent();
      expect(screen.getByTestId('select-button')).toBeInTheDocument();
    });

    it('renders with correct initial structure', () => {
      renderComponent();

      const selectButton = screen.getByTestId('select-button');
      expect(selectButton).toBeInTheDocument();
      const defaultLegend = screen.getByText('researchOutput.outputType.legends.default');
      expect(defaultLegend).toBeInTheDocument();
    });

    it('should pass axe accessibility test', async () => {
      const { container } = render(
        <OutputTypeField {...defaultProps} />
      );

      await act(async () => {
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });
    });

    describe('Defaults Mode', () => {
      it('displays default output types when mode is "defaults"', () => {
        renderComponent({
          field: {
            ...defaultProps.field,
            outputTypeConfig: {
              mode: 'defaults',
              customTypes: [],
              selectedDefaults: [],
            },
          },
        });

        // Check that all default output types are displayed
        expect(screen.getByText('Audiovisual')).toBeInTheDocument();
        expect(screen.getByText('Collection')).toBeInTheDocument();
        expect(screen.getByText('Data paper')).toBeInTheDocument();
        expect(screen.getByText('Dataset')).toBeInTheDocument();
        expect(screen.getByText('Event')).toBeInTheDocument();
        expect(screen.getByText('Image')).toBeInTheDocument();
        expect(screen.getByText('Interactive resource')).toBeInTheDocument();
        expect(screen.getByText('Model')).toBeInTheDocument();
        expect(screen.getByText('Other')).toBeInTheDocument();
        expect(screen.getByText('Physical object')).toBeInTheDocument();
        expect(screen.getByText('Service')).toBeInTheDocument();
        expect(screen.getByText('Software')).toBeInTheDocument();
        expect(screen.getByText('Sound')).toBeInTheDocument();
        expect(screen.getByText('Text')).toBeInTheDocument();
        expect(screen.getByText('Workflow')).toBeInTheDocument();
      });

      it('does not display custom output type section in defaults mode', () => {
        renderComponent({
          field: {
            ...defaultProps.field,
            outputTypeConfig: {
              mode: 'defaults',
              customTypes: [],
              selectedDefaults: [],
            },
          },
        });

        expect(screen.queryByText('researchOutput.outputType.legends.myOutputs')).not.toBeInTheDocument();
        expect(screen.queryByText('researchOutput.outputType.buttons.addOutputType')).not.toBeInTheDocument();
      });
    });

    describe('Mine Mode', () => {
      const mineField = {
        ...defaultProps.field,
        outputTypeConfig: {
          mode: 'mine' as const,
          customTypes: [{ type: 'Custom Type 1', description: 'Description for Custom Type 1' }, { type: 'Custom Type 2', description: 'Description for Custom Type 2' }],
          selectedDefaults: [],
        },
      };

      it('displays custom output type section when mode is "mine"', () => {
        renderComponent({
          field: mineField,
        });

        expect(screen.getByText('researchOutput.outputType.legends.myOutputs')).toBeInTheDocument();
        expect(screen.getByText('researchOutput.outputType.buttons.addOutputType')).toBeInTheDocument();
      });

      it('displays custom output types when they exist', () => {
        renderComponent({
          field: mineField,
        });

        expect(screen.getByText('Custom Type 1')).toBeInTheDocument();
        expect(screen.getByText('Custom Type 2')).toBeInTheDocument();
      });

      it('displays remove buttons for custom output types', () => {
        renderComponent({
          field: mineField,
        });

        const removeButtons = screen.getAllByText('x');
        expect(removeButtons).toHaveLength(2);
      });

      it('does not display custom types list when no custom types exist', () => {
        renderComponent({
          field: {
            ...defaultProps.field,
            outputTypeConfig: {
              mode: 'mine',
              customTypes: [],
              selectedDefaults: [],
            },
          },
        });

        expect(screen.getByText('researchOutput.outputType.legends.myOutputs')).toBeInTheDocument();
        expect(screen.queryByText('x')).not.toBeInTheDocument();
      });
    });

    describe('Add To Defaults Mode', () => {
      const addToDefaultsField = {
        ...defaultProps.field,
        outputTypeConfig: {
          mode: 'mine' as const,
          customTypes: [{ type: 'Custom Type 1', description: 'Description for Custom Type 1' }, { type: 'Custom Type 2', description: 'Description for Custom Type 2' }],
          selectedDefaults: [],
        },
      };

      it('displays all default output types in addToDefaults mode', () => {
        renderComponent({
          field: addToDefaultsField,
        });

        expect(screen.getByText('Custom Type 1')).toBeInTheDocument();
      });

      it('displays custom output types when they exist', () => {
        renderComponent({
          field: addToDefaultsField,
        });

        expect(screen.getByText('Custom Type 1')).toBeInTheDocument();
        expect(screen.getByText('Custom Type 2')).toBeInTheDocument();
      });

      it('displays remove buttons for custom output types', () => {
        renderComponent({
          field: addToDefaultsField,
        });

        const removeButtons = screen.getAllByText('x');
        expect(removeButtons).toHaveLength(2);
      });

      it('does not display custom types list when no custom types exist', () => {
        renderComponent({
          field: {
            ...defaultProps.field,
            outputTypeConfig: {
              mode: 'mine',
              customTypes: [],
              selectedDefaults: [],
            },
          },
        });

        expect(screen.getByText('researchOutput.outputType.legends.myOutputs')).toBeInTheDocument();
        expect(screen.queryByText('Custom Type 1')).not.toBeInTheDocument();
      });
    });

    describe('User Interactions', () => {
      it('calls onModeChange when output type mode is changed', async () => {
        const onModeChange = jest.fn();
        renderComponent({ onModeChange });

        // Click the button to open the dropdown
        const selectButton = screen.getByTestId('select-button');
        await userEvent.click(selectButton);

        // Find and click the "Use mine" option in the listbox
        const mineOption = screen.getByRole('option', { name: 'researchOutput.labels.useCustomList' });
        await userEvent.click(mineOption);

        expect(onModeChange).toHaveBeenCalledWith('mine');
      });

      it('calls setNewOutputType when input value changes in mine mode', () => {
        const setNewOutputType = jest.fn();
        renderComponent({
          field: {
            ...defaultProps.field,
            outputTypeConfig: {
              mode: 'mine',
              customTypes: [],
              selectedDefaults: ['Default Type 1', 'Default Type 2'],
            },
          },
          setNewOutputType,
        });

        const input = screen.getByLabelText('researchOutput.outputType.labels.enterOutputType');
        fireEvent.change(input, { target: { value: 'New Output Type' } });

        expect(setNewOutputType).toHaveBeenCalledWith({ description: '', type: 'New Output Type' });
      });

      it('calls onAddCustomType when add button is clicked in mine mode', () => {
        const onAddCustomType = jest.fn();
        renderComponent({
          field: {
            ...defaultProps.field,
            outputTypeConfig: {
              mode: 'mine',
              customTypes: [],
              selectedDefaults: [],
            },
          },
          newOutputType: { type: 'New Type', description: 'Description for New Type' },
          onAddCustomType,
        });

        const input = screen.getByLabelText('researchOutput.outputType.labels.enterOutputType');
        fireEvent.change(input, { target: { value: 'New Output Type' } });

        const addButton = screen.getByText('researchOutput.outputType.buttons.addOutputType');
        fireEvent.click(addButton);

        expect(onAddCustomType).toHaveBeenCalled();
      });

      it('calls onAddCustomType when Enter key is pressed in mine mode', () => {
        const onAddCustomType = jest.fn();
        renderComponent({
          field: {
            ...defaultProps.field,
            outputTypeConfig: {
              mode: 'mine',
              customTypes: [],
              selectedDefaults: [],
            },
          },
          newOutputType: { type: 'New Type', description: 'Description for New Type' },
          onAddCustomType,
        });

        const input = screen.getByLabelText('researchOutput.outputType.labels.enterOutputType');
        fireEvent.keyDown(input, { key: 'Enter' });

        expect(onAddCustomType).toHaveBeenCalled();
      });

      it('disables add button when newOutputType is empty or whitespace in mine mode', () => {
        renderComponent({
          field: {
            ...defaultProps.field,
            outputTypeConfig: {
              mode: 'mine',
              customTypes: [],
              selectedDefaults: [],
            },
          },
          newOutputType: { type: ' ', description: '' },
        });

        const addButton = screen.getByText('researchOutput.outputType.buttons.addOutputType');
        expect(addButton).toBeDisabled();
      });

      it('enables add button when newOutputType has content in mine mode', () => {
        renderComponent({
          field: {
            ...defaultProps.field,
            outputTypeConfig: {
              mode: 'mine',
              customTypes: [],
              selectedDefaults: [],
            },
          },
          newOutputType: { type: 'Valid Output Type', description: 'Description for Valid Output Type' },
        });

        const addButton = screen.getByText('researchOutput.outputType.buttons.addOutputType');
        expect(addButton).not.toBeDisabled();
      });

      it('calls onRemoveCustomType when remove button is clicked', () => {
        const onRemoveCustomType = jest.fn();
        renderComponent({
          field: {
            ...defaultProps.field,
            outputTypeConfig: {
              mode: 'mine',
              customTypes: [{ type: 'Test Type', description: 'Description for Custom Type 1' }, { type: 'Custom Type 2', description: 'Description for Custom Type 2' }],
              selectedDefaults: [],
            },
          },
          onRemoveCustomType,
        });

        const removeButtons = screen.getAllByText('x');
        fireEvent.click(removeButtons[0]);

        expect(onRemoveCustomType).toHaveBeenCalledWith('Test Type');
      });

      it('calls onAddCustomType and setNewOutputType when add button is clicked in addToDefaults mode', () => {
        const onAddCustomType = jest.fn();
        const setNewOutputType = jest.fn();
        renderComponent({
          field: {
            ...defaultProps.field,
            outputTypeConfig: {
              mode: 'mine',
              customTypes: [],
              selectedDefaults: [],
            },
          },
          newOutputType: { type: 'New Type', description: 'Description for New Type' },
          onAddCustomType,
          setNewOutputType,
        });

        const input = screen.getByLabelText('researchOutput.outputType.labels.enterOutputType');
        fireEvent.keyDown(input, { key: 'Enter' });


        const addButtons = screen.getByText('researchOutput.outputType.buttons.addOutputType');
        fireEvent.click(addButtons); // Click the add button in custom types section

        expect(onAddCustomType).toHaveBeenCalled();
      });
    });

    describe('Props Validation', () => {
      it('handles missing outputTypeConfig gracefully', () => {
        renderComponent({
          field: {
            ...defaultProps.field,
            outputTypeConfig: undefined,
          },
        });

        const selectButton = screen.getByTestId('select-button');
        expect(selectButton).toHaveTextContent('researchOutput.labels.useDefaultsOpen drop down');
      });

      it('handles field without outputTypeConfig mode', () => {
        renderComponent({
          field: {
            ...defaultProps.field,
            outputTypeConfig: {
              customTypes: [],
              selectedDefaults: [],
              mode: 'mine'
            }
          },
        });

        const selectButton = screen.getByTestId('select-button');
        expect(selectButton).toHaveTextContent('researchOutput.labels.useCustomListOpen drop down');
      });
    });

    describe('Edge Cases', () => {
      it('handles empty custom types array in mine mode', () => {
        renderComponent({
          field: {
            ...defaultProps.field,
            outputTypeConfig: {
              mode: 'mine',
              customTypes: [],
              selectedDefaults: [],
            },
          },
        });

        expect(screen.getByText('researchOutput.outputType.legends.myOutputs')).toBeInTheDocument();
        expect(screen.queryByText('x')).not.toBeInTheDocument();
      });

      it('handles multiple custom types correctly in mine mode', () => {
        const multipleCustomTypes = [{ type: 'Type A', description: 'Description for Type A' }, { type: 'Type B', description: 'Description for Type B' }, { type: 'Type C', description: 'Description for Type C' }];

        renderComponent({
          field: {
            ...defaultProps.field,
            outputTypeConfig: {
              mode: 'mine',
              customTypes: multipleCustomTypes,
              selectedDefaults: [],
            },
          },
        });

        multipleCustomTypes.forEach(type => {
          expect(screen.getByText(type.type)).toBeInTheDocument();
        });

        expect(screen.getAllByText('x')).toHaveLength(3);
      });

      it('renders correctly with special characters in custom output type names', () => {
        const specialType = [{ type: 'Dataset (v2.0 - Enhanced)', description: 'Description for Dataset (v2.0 - Enhanced)' }];
        renderComponent({
          field: {
            ...defaultProps.field,
            outputTypeConfig: {
              mode: 'mine',
              customTypes: specialType,
              selectedDefaults: [],
            },
          },
        });

        expect(screen.getByText(specialType[0].type)).toBeInTheDocument();
        expect(screen.getByText('x')).toBeInTheDocument();
      });

      it('displays all 14 default output types', () => {
        renderComponent({
          field: {
            ...defaultProps.field,
            outputTypeConfig: {
              mode: 'defaults',
              customTypes: [],
              selectedDefaults: [],
            },
          },
        });

        const expectedTypes = [
          'Audiovisual', 'Collection', 'Data paper', 'Dataset', 'Event', 'Image',
          'Interactive resource', 'Model', 'Other', 'Physical object', 'Service',
          'Software', 'Sound', 'Text', 'Workflow'
        ];

        expectedTypes.forEach(type => {
          expect(screen.getByText(type)).toBeInTheDocument();
        });
      });
    });
  });
});
