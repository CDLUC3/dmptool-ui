/**
 * @jest-environment jsdom
 */
import React from 'react';
import { act, render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useToast } from '@/context/ToastContext';
import { useLazyQuery } from '@apollo/client/react';
import {
  MetadataStandardsDocument
} from '@/generated/graphql';
import { axe, toHaveNoViolations } from 'jest-axe';
import { addMetaDataStandardsAction } from '@/app/actions';
import { useParams, useRouter } from 'next/navigation';

import MetaDataStandardsSelector from '../MetaDataStandards';
import mockMetaDataStandards from '../__mocks__/mockMetaDataStandards.json';
import { ResearchOutputTableColumnsEnum } from "@dmptool/types";

expect.extend(toHaveNoViolations);

jest.mock('@/components/Pagination', () => {
  const MockPagination = () => <div data-testid="pagination">Pagination</div>;
  MockPagination.displayName = 'Pagination';
  return MockPagination;
});

// Mock Next.js hooks
jest.mock('next/navigation', () => ({
  useParams: jest.fn(),
  useRouter: jest.fn(),
}));

// Mock useToast hook
jest.mock('@/context/ToastContext', () => ({
  useToast: jest.fn(),
}));

// Mock the addMetaDataStandardsAction
jest.mock('@/app/actions', () => ({
  addMetaDataStandardsAction: jest.fn(),
}));


// Mock Apollo Client hooks
jest.mock('@apollo/client/react', () => ({
  useLazyQuery: jest.fn(),
}));

// ---- Test data ----
const mockField = {
  id: "test-id",
  commonStandardId: ResearchOutputTableColumnsEnum.enum.metadata,
  label: "Test Label",
  enabled: true,
  metaDataConfig: {
    hasCustomStandards: true,
    customStandards: [],
  },
};

// Mock the query hook
jest.mock("@/generated/graphql", () => ({
  ...jest.requireActual("@/generated/graphql"),
  useMetadataStandardsLazyQuery: jest.fn(),
}));

const mockHandleToggle = jest.fn();
const mockOnChange = jest.fn();

// Cast with jest.mocked utility
const mockUseLazyQuery = jest.mocked(useLazyQuery);

const setupMocks = () => {
  // Lazy query mocks
  const mockFetchMetaDataStandards = jest.fn().mockResolvedValue({
    data: mockMetaDataStandards
  });

  const stableMetadataStandardsReturn = [
    mockFetchMetaDataStandards,
    {
      data: mockMetaDataStandards,
      loading: false,
      error: null
    }
  ];
  mockUseLazyQuery.mockImplementation((document) => {
    if (document === MetadataStandardsDocument) {
      /* eslint-disable-next-line @typescript-eslint/no-explicit-any*/
      return stableMetadataStandardsReturn as any;
    }

    return {
      data: null,
      loading: false,
      error: undefined
    };
  });

};
describe('MetaDataStandardsSelector', () => {
  beforeEach(() => {
    setupMocks();
    jest.clearAllMocks();

    // Mock Next.js useParams
    (useParams as jest.Mock).mockReturnValue({
      templateId: 'test-template-id'
    });

    // Mock Next.js useRouter
    (useRouter as jest.Mock).mockReturnValue({
      push: jest.fn(),
      replace: jest.fn(),
      refresh: jest.fn(),
    });

    // Mock useToast - the component calls toastState.add()
    (useToast as jest.Mock).mockReturnValue({
      add: jest.fn(),
    });

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

  describe('Rendering', () => {
    it('renders without crashing', () => {
      render(
        <MetaDataStandardsSelector
          field={mockField}
          handleToggleMetaDataStandards={mockHandleToggle}
          onMetaDataStandardsChange={mockOnChange}
        />
      );

      expect(screen.getByRole('checkbox')).toBeInTheDocument();
    });

    it('should pass axe accessibility test', async () => {
      const { container } = render(
        <MetaDataStandardsSelector
          field={mockField}
          handleToggleMetaDataStandards={mockHandleToggle}
          onMetaDataStandardsChange={mockOnChange}
        />
      );

      await act(async () => {
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });
    });
  });

  describe('Checkbox Toggle', () => {
    it('renders checkbox and calls handleToggleMetaDataStandards when clicked', () => {
      const mockFieldNoCustomStandards = {
        id: 'test-id',
        label: 'Test Label',
        enabled: true,
        metaDataConfig: {
          hasCustomStandards: false,
          customStandards: []
        },
      };

      render(
        <MetaDataStandardsSelector
          field={mockFieldNoCustomStandards}
          handleToggleMetaDataStandards={mockHandleToggle}
          onMetaDataStandardsChange={mockOnChange}
        />
      );

      const checkbox = screen.getByRole('checkbox');
      fireEvent.click(checkbox);

      expect(mockHandleToggle).toHaveBeenCalledWith(true);
    });

    it('displays selected items section when hasCustomStandards is true', () => {
      render(
        <MetaDataStandardsSelector
          field={mockField}
          handleToggleMetaDataStandards={mockHandleToggle}
          onMetaDataStandardsChange={mockOnChange}
        />
      );

      expect(screen.getByText(/researchOutput.metaDataStandards.labels.createStandards/i)).toBeInTheDocument();
    });

    it('does not display selected items section when hasCustomStandards is false', () => {
      const mockFieldNoCustomStandards = {
        id: 'test-id',
        label: 'Test Label',
        enabled: true,
        metaDataConfig: {
          hasCustomStandards: false,
          customStandards: []
        },
      };
      render(
        <MetaDataStandardsSelector
          field={mockFieldNoCustomStandards}
          handleToggleMetaDataStandards={mockHandleToggle}
          onMetaDataStandardsChange={mockOnChange}
        />
      );

      expect(screen.queryByText(/researchOutput.metaDataStandards.singleMetaData/i)).not.toBeInTheDocument();
    });
  });

  describe('Modal - Open/Close', () => {
    it('renders the modal when "Add" button is clicked and closes it via aria-label button', () => {
      render(
        <MetaDataStandardsSelector
          field={mockField}
          handleToggleMetaDataStandards={mockHandleToggle}
          onMetaDataStandardsChange={mockOnChange}
        />
      );

      // Initially, modal is not visible
      expect(screen.queryByTestId('modal')).not.toBeInTheDocument();

      // Click "Add" button to open modal
      const addButton = screen.getAllByRole('button', { name: /researchOutput.metaDataStandards.buttons.add/i });
      fireEvent.click(addButton[0]);

      // Modal should appear
      expect(screen.getByTestId('modal')).toBeInTheDocument();

      // Find the close button by its aria-label (translated key)
      const closeButton = screen.getByRole('button', {
        name: 'buttons.closeModal',
      });

      // Click the close button
      fireEvent.click(closeButton);

      // Modal should now be closed
      expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
    });

    it('closes modal when close button is clicked', async () => {
      render(
        <MetaDataStandardsSelector
          field={mockField}
          handleToggleMetaDataStandards={mockHandleToggle}
          onMetaDataStandardsChange={mockOnChange}
        />
      );

      const addButton = screen.getByRole('button', { name: /researchOutput.metaDataStandards.buttons.add/i });
      fireEvent.click(addButton);

      expect(screen.getByTestId('modal')).toBeInTheDocument();

      const closeButton = screen.getByRole('button', { name: 'buttons.closeModal' });
      fireEvent.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
      });

    });
  });

  describe('Standard Selection', () => {
    it('shows the "Remove all" button after a user selects a metadata standard', () => {
      render(
        <MetaDataStandardsSelector
          field={mockField}
          handleToggleMetaDataStandards={mockHandleToggle}
          onMetaDataStandardsChange={mockOnChange}
        />
      );

      // Open the modal
      const addButton = screen.getAllByRole('button', {
        name: /researchOutput.metaDataStandards.buttons.add/i,
      })[0];
      fireEvent.click(addButton);

      // There should be a list of standards displayed with "Select" buttons
      const selectButtons = screen.getAllByRole('button', {
        name: 'buttons.select',
      });
      expect(selectButtons.length).toBeGreaterThan(0);

      // Click the first "Select" button to add one
      fireEvent.click(selectButtons[0]);

      // Close the modal using the close button
      const closeButton = screen.getByRole('button', {
        name: 'buttons.closeModal',
      });
      fireEvent.click(closeButton);

      // After closing, the "Remove all" button should now appear
      const removeAllBtn = screen.getByRole('button', {
        name: 'buttons.removeAll',
      });
      expect(removeAllBtn).toBeInTheDocument();
    });

    it('changes button from "Select" to "Remove" when standard is selected', () => {
      render(
        <MetaDataStandardsSelector
          field={mockField}
          handleToggleMetaDataStandards={mockHandleToggle}
          onMetaDataStandardsChange={mockOnChange}
        />
      );

      const addButton = screen.getAllByRole('button', { name: /researchOutput.metaDataStandards.buttons.add/i })[0];
      fireEvent.click(addButton);

      const selectButton = screen.getAllByRole('button', { name: 'buttons.select' })[0];
      fireEvent.click(selectButton);

      // Button text should change to "Remove"
      const removeButton = screen.getAllByRole('button', { name: 'buttons.remove' })[0];
      expect(removeButton).toBeInTheDocument();
    });

    it('toggles selection state correctly when clicking select/remove buttons', () => {
      render(
        <MetaDataStandardsSelector
          field={mockField}
          handleToggleMetaDataStandards={mockHandleToggle}
          onMetaDataStandardsChange={mockOnChange}
        />
      );

      const addButton = screen.getAllByRole('button', { name: /researchOutput.metaDataStandards.buttons.add/i })[0];
      fireEvent.click(addButton);

      const selectButton = screen.getAllByRole('button', { name: 'buttons.select' })[0];
      fireEvent.click(selectButton);

      // Should change to Remove button
      expect(screen.getAllByRole('button', { name: 'buttons.remove' }).length).toBeGreaterThan(0);

      // Click again to deselect
      const removeButton = screen.getAllByRole('button', { name: 'buttons.remove' })[0];
      fireEvent.click(removeButton);

      // Should go back to Select button
      expect(screen.getAllByRole('button', { name: 'buttons.select' }).length).toBeGreaterThan(0);
    });

    it('displays selected count in modal heading', () => {
      render(
        <MetaDataStandardsSelector
          field={mockField}
          handleToggleMetaDataStandards={mockHandleToggle}
          onMetaDataStandardsChange={mockOnChange}
        />
      );

      const addButton = screen.getAllByRole('button', { name: /researchOutput.metaDataStandards.buttons.add/i })[0];
      fireEvent.click(addButton);

      const selectButtons = screen.getAllByRole('button', { name: 'buttons.select' });
      fireEvent.click(selectButtons[0]);
      fireEvent.click(selectButtons[1]);

      // Check that selected count tag is displayed
      expect(screen.getByText(/researchOutput.metaDataStandards.selectedCount/)).toBeInTheDocument();
    });
  });

  describe('Remove Standard', () => {
    it('removes a selected standard when remove button is clicked', () => {
      render(
        <MetaDataStandardsSelector
          field={mockField}
          handleToggleMetaDataStandards={mockHandleToggle}
          onMetaDataStandardsChange={mockOnChange}
        />
      );

      // Select a standard
      const addButton = screen.getAllByRole('button', { name: /researchOutput.metaDataStandards.buttons.add/i })[0];
      fireEvent.click(addButton);

      const selectButton = screen.getAllByRole('button', { name: 'buttons.select' })[0];
      fireEvent.click(selectButton);

      // Close modal
      const closeButton = screen.getByRole('button', { name: 'buttons.closeModal' });
      fireEvent.click(closeButton);

      // Remove the standard from the selected items list
      const removeButtons = screen.getAllByRole('button', { name: 'buttons.remove' });
      fireEvent.click(removeButtons[0]);

      // The standard should no longer be displayed
      expect(screen.queryByText('ABCD (Access to Biological Collection Data)')).not.toBeInTheDocument();
    });

    it('removes all standards when "Remove all" button is clicked with confirmation', () => {
      window.confirm = jest.fn(() => true);

      render(
        <MetaDataStandardsSelector
          field={mockField}
          handleToggleMetaDataStandards={mockHandleToggle}
          onMetaDataStandardsChange={mockOnChange}
        />
      );

      // Select standards
      const addButton = screen.getAllByRole('button', { name: /researchOutput.metaDataStandards.buttons.add/i })[0];
      fireEvent.click(addButton);

      const selectButtons = screen.getAllByRole('button', { name: 'buttons.select' });
      fireEvent.click(selectButtons[0]);

      const closeButton = screen.getByRole('button', { name: 'buttons.closeModal' });
      fireEvent.click(closeButton);

      // Click "Remove all" button
      const removeAllBtn = screen.getByRole('button', { name: 'buttons.removeAll' });
      fireEvent.click(removeAllBtn);

      // Confirmation dialog should appear
      expect(window.confirm).toHaveBeenCalled();

      // Selected items section should be empty
      expect(screen.queryByText('ABCD (Access to Biological Collection Data)')).not.toBeInTheDocument();
    });

    it('does not remove all standards when user cancels confirmation', () => {
      window.confirm = jest.fn(() => false);

      render(
        <MetaDataStandardsSelector
          field={mockField}
          handleToggleMetaDataStandards={mockHandleToggle}
          onMetaDataStandardsChange={mockOnChange}
        />
      );

      const addButton = screen.getAllByRole('button', { name: /researchOutput.metaDataStandards.buttons.add/i })[0];
      fireEvent.click(addButton);

      const selectButton = screen.getAllByRole('button', { name: 'buttons.select' })[0];
      fireEvent.click(selectButton);

      const closeButton = screen.getByRole('button', { name: 'buttons.closeModal' });
      fireEvent.click(closeButton);

      // Click "Remove all" button
      const removeAllBtn = screen.getByRole('button', { name: 'buttons.removeAll' });
      fireEvent.click(removeAllBtn);

      expect(window.confirm).toHaveBeenCalled();

      // Standard should still be in the list
      expect(screen.getByText('Terminal RI Unicamp')).toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    it('filters standards based on search term', () => {
      render(
        <MetaDataStandardsSelector
          field={mockField}
          handleToggleMetaDataStandards={mockHandleToggle}
          onMetaDataStandardsChange={mockOnChange}
        />
      );

      const addButton = screen.getByRole('button', { name: /researchOutput.metaDataStandards.buttons.add/i });
      fireEvent.click(addButton);

      // Search for a specific term
      const searchInput = screen.getByLabelText(/labels.searchTerm/i) as HTMLInputElement;
      fireEvent.change(searchInput, { target: { value: 'ABCD' } });

      const applyFilterBtn = screen.getByRole('button', { name: 'buttons.applyFilter' });
      fireEvent.click(applyFilterBtn);

      expect(screen.getByText('Terminal RI Unicamp')).toBeInTheDocument();
    });

    it('searches in both name and description fields', () => {
      render(
        <MetaDataStandardsSelector
          field={mockField}
          handleToggleMetaDataStandards={mockHandleToggle}
          onMetaDataStandardsChange={mockOnChange}
        />
      );

      const addButton = screen.getAllByRole('button', { name: /researchOutput.metaDataStandards.buttons.add/i })[0];
      fireEvent.click(addButton);

      const searchInput = screen.getByLabelText(/labels.searchTerm/i) as HTMLInputElement;
      fireEvent.change(searchInput, { target: { value: 'biological' } });

      const applyFilterBtn = screen.getByRole('button', { name: 'buttons.applyFilter' });
      fireEvent.click(applyFilterBtn);

      // Should find standards with "biological" in description
      expect(screen.getByText('Terminal RI Unicamp')).toBeInTheDocument();
    });

    it('clears search and resets to all standards', () => {
      render(
        <MetaDataStandardsSelector
          field={mockField}
          handleToggleMetaDataStandards={mockHandleToggle}
          onMetaDataStandardsChange={mockOnChange}
        />
      );

      const addButton = screen.getByRole('button', { name: /researchOutput.metaDataStandards.buttons.add/i });
      fireEvent.click(addButton);

      const searchInput = screen.getByLabelText(/labels.searchTerm/i) as HTMLInputElement;
      fireEvent.change(searchInput, { target: { value: 'ABCD' } });

      const applyFilterBtn = screen.getByRole('button', { name: 'buttons.applyFilter' });
      fireEvent.click(applyFilterBtn);

      // Clear search
      fireEvent.change(searchInput, { target: { value: '' } });
      fireEvent.click(applyFilterBtn);

      // All standards should be visible again
      expect(screen.getByText('Terminal RI Unicamp')).toBeInTheDocument();
      expect(screen.getByText('Sintomas osteomusculares')).toBeInTheDocument();
    });
  });

  describe('Custom Metadata Standard Form', () => {
    it('toggles custom form visibility when "Add" button in modal is clicked', () => {
      render(
        <MetaDataStandardsSelector
          field={mockField}
          handleToggleMetaDataStandards={mockHandleToggle}
          onMetaDataStandardsChange={mockOnChange}
        />
      );

      const addButton = screen.getByRole('button', { name: /researchOutput.metaDataStandards.buttons.add/i });
      fireEvent.click(addButton);

      // Form should not be visible initially
      expect(screen.queryByTestId('form-input-std-name')).not.toBeInTheDocument();

      // Click the secondary "Add" button to show custom form
      const secondaryAddButton = screen.getByRole('button', { name: /researchOutput.metaDataStandards.buttons.add/i });
      fireEvent.click(secondaryAddButton);


      // Form should now be visible
      expect(screen.getByTestId('form-input-std-name')).toBeInTheDocument();
      expect(screen.getByTestId('form-input-std-url')).toBeInTheDocument();
      expect(screen.getByTestId('form-input-std-description')).toBeInTheDocument();
    });

    it('adds a custom metadata standard when form is submitted with valid data', async () => {
      render(
        <MetaDataStandardsSelector
          field={mockField}
          handleToggleMetaDataStandards={mockHandleToggle}
          onMetaDataStandardsChange={mockOnChange}
        />
      );

      const addButton = screen.getByRole('button', { name: /researchOutput.metaDataStandards.buttons.add/i });
      fireEvent.click(addButton);

      const secondaryAddButton = screen.getByRole('button', { name: /researchOutput.metaDataStandards.buttons.add/i });
      fireEvent.click(secondaryAddButton);

      // Fill in the form
      fireEvent.change(screen.getByTestId('form-input-std-name'), { target: { value: 'Custom Standard' } });
      fireEvent.change(screen.getByTestId('form-input-std-url'), { target: { value: 'https://example.com' } });
      fireEvent.change(screen.getByTestId('form-input-std-description'), { target: { value: 'A custom standard' } });

      const submitButton = screen.getByTestId('add-custom-std-btn');
      fireEvent.click(submitButton);

      // Wait for the async action to complete and form to close
      await waitFor(() => {
        expect(screen.queryByTestId('form-input-std-name')).not.toBeInTheDocument();
      });

      expect(screen.getByText('Custom Standard')).toBeInTheDocument();
    });

    it('shows error when submitting form with empty fields', () => {
      render(
        <MetaDataStandardsSelector
          field={mockField}
          handleToggleMetaDataStandards={mockHandleToggle}
          onMetaDataStandardsChange={mockOnChange}
        />
      );

      const addButton = screen.getByRole('button', { name: /researchOutput.metaDataStandards.buttons.add/i });
      fireEvent.click(addButton);

      const secondaryAddButton = screen.getByRole('button', { name: /researchOutput.metaDataStandards.buttons.add/i });
      fireEvent.click(secondaryAddButton);

      // Try to submit without filling in fields
      const submitButton = screen.getByRole('button', { name: /researchOutput.metaDataStandards.buttons.addToTemplate/i });
      fireEvent.click(submitButton);

      // Form should still be visible since validation failed
      expect(screen.getByTestId('form-input-std-name')).toBeInTheDocument();
    });

    it('trims whitespace from custom form inputs', async () => {
      render(
        <MetaDataStandardsSelector
          field={mockField}
          handleToggleMetaDataStandards={mockHandleToggle}
          onMetaDataStandardsChange={mockOnChange}
        />
      );

      const addButton = screen.getByRole('button', { name: /researchOutput.metaDataStandards.buttons.add/i });
      fireEvent.click(addButton);

      const secondaryAddButton = screen.getByRole('button', { name: /researchOutput.metaDataStandards.buttons.add/i });
      fireEvent.click(secondaryAddButton);

      // Fill in the form with whitespace
      fireEvent.change(screen.getByTestId('form-input-std-name'), { target: { value: '   Custom Standard   ' } });
      fireEvent.change(screen.getByTestId('form-input-std-url'), { target: { value: '   https://example.com   ' } });
      fireEvent.change(screen.getByTestId('form-input-std-description'), { target: { value: '   A custom standard   ' } });

      const submitButton = screen.getByRole('button', { name: /researchOutput.metaDataStandards.buttons.addToTemplate/i });
      fireEvent.click(submitButton);

      // Wait for the async action to complete and modal to close
      await waitFor(() => {
        expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
      });

      // Standard should be displayed with trimmed whitespace
      expect(screen.getByText('Custom Standard')).toBeInTheDocument();
    });

    it('closes custom form when "Cancel" button is clicked', () => {
      render(
        <MetaDataStandardsSelector
          field={mockField}
          handleToggleMetaDataStandards={mockHandleToggle}
          onMetaDataStandardsChange={mockOnChange}
        />
      );

      const addButton = screen.getByRole('button', { name: /researchOutput.metaDataStandards.buttons.add/i });
      fireEvent.click(addButton);

      const secondaryAddButton = screen.getByRole('button', { name: /researchOutput.metaDataStandards.buttons.add/i });
      fireEvent.click(secondaryAddButton);

      expect(screen.getByTestId('form-input-std-name')).toBeInTheDocument();

      const cancelButton = screen.getByRole('button', { name: 'buttons.cancel' });
      fireEvent.click(cancelButton);

      expect(screen.queryByTestId('form-input-std-name')).not.toBeInTheDocument();
    });
  });

  describe('Selected Items Display', () => {
    it('displays selected count in the correct format (singular)', () => {
      render(
        <MetaDataStandardsSelector
          field={mockField}
          handleToggleMetaDataStandards={mockHandleToggle}
          onMetaDataStandardsChange={mockOnChange}
        />
      );

      const addButton = screen.getAllByRole('button', { name: /researchOutput.metaDataStandards.buttons.add/i })[0];
      fireEvent.click(addButton);

      const selectButton = screen.getAllByRole('button', { name: 'buttons.select' })[0];
      fireEvent.click(selectButton);

      const closeButton = screen.getByRole('button', { name: 'buttons.closeModal' });
      fireEvent.click(closeButton);

      expect(screen.getByText(/1.*researchOutput.metaDataStandards.singleMetaData/)).toBeInTheDocument();
    });

    it('displays selected count in the correct format (plural)', () => {
      render(
        <MetaDataStandardsSelector
          field={mockField}
          handleToggleMetaDataStandards={mockHandleToggle}
          onMetaDataStandardsChange={mockOnChange}
        />
      );

      const addButton = screen.getAllByRole('button', { name: /researchOutput.metaDataStandards.buttons.add/i })[0];
      fireEvent.click(addButton);

      const selectButtons = screen.getAllByRole('button', { name: 'buttons.select' });
      fireEvent.click(selectButtons[0]);
      fireEvent.click(selectButtons[1]);

      const closeButton = screen.getByRole('button', { name: 'buttons.closeModal' });
      fireEvent.click(closeButton);

      expect(screen.getByText(/2.*researchOutput.metaDataStandards.multipleMetaData/)).toBeInTheDocument();
    });
  });

  describe('Callback Functions', () => {
    it('calls onMetaDataStandardsChange when a standard is selected', () => {
      render(
        <MetaDataStandardsSelector
          field={mockField}
          handleToggleMetaDataStandards={mockHandleToggle}
          onMetaDataStandardsChange={mockOnChange}
        />
      );

      const addButton = screen.getAllByRole('button', { name: /researchOutput.metaDataStandards.buttons.add/i })[0];
      fireEvent.click(addButton);

      const selectButton = screen.getAllByRole('button', { name: 'buttons.select' })[0];
      fireEvent.click(selectButton);

      // onMetaDataStandardsChange should have been called
      expect(mockOnChange).toHaveBeenCalled();
    });

    it('calls onMetaDataStandardsChange with correct standard data', () => {
      render(
        <MetaDataStandardsSelector
          field={mockField}
          handleToggleMetaDataStandards={mockHandleToggle}
          onMetaDataStandardsChange={mockOnChange}
        />
      );

      const addButton = screen.getAllByRole('button', { name: /researchOutput.metaDataStandards.buttons.add/i })[0];
      fireEvent.click(addButton);

      const selectButton = screen.getAllByRole('button', { name: 'buttons.select' })[0];
      fireEvent.click(selectButton);

      // Check if the callback was called with data
      expect(mockOnChange).toHaveBeenCalledWith(expect.any(Array));
      expect(mockOnChange).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            name: expect.any(String),
            uri: expect.any(String),
            description: expect.any(String),
          })
        ])
      );
    });

    it('calls handleToggleMetaDataStandards when checkbox is clicked', () => {
      const mockFieldNoCustomStandards = {
        id: 'test-id',
        label: 'Test Label',
        enabled: true,
        metaDataConfig: {
          hasCustomStandards: false,
          customStandards: []
        },
      };
      render(
        <MetaDataStandardsSelector
          field={mockFieldNoCustomStandards}
          handleToggleMetaDataStandards={mockHandleToggle}
          onMetaDataStandardsChange={mockOnChange}
        />
      );

      const checkbox = screen.getByRole('checkbox');
      fireEvent.click(checkbox);

      expect(mockHandleToggle).toHaveBeenCalledWith(true);
    });
  });

  describe('Pagination', () => {
    it('renders pagination component in modal', () => {
      render(
        <MetaDataStandardsSelector
          field={mockField}
          handleToggleMetaDataStandards={mockHandleToggle}
          onMetaDataStandardsChange={mockOnChange}
        />
      );

      const addButton = screen.getAllByRole('button', { name: /researchOutput.metaDataStandards.buttons.add/i })[0];
      fireEvent.click(addButton);

      expect(screen.getByTestId('pagination')).toBeInTheDocument();
    });

    it('displays pagination info text', () => {
      render(
        <MetaDataStandardsSelector
          field={mockField}
          handleToggleMetaDataStandards={mockHandleToggle}
          onMetaDataStandardsChange={mockOnChange}
        />
      );

      const addButton = screen.getAllByRole('button', { name: /researchOutput.metaDataStandards.buttons.add/i })[0];
      fireEvent.click(addButton);
      expect(screen.getByText(/Displaying standards.*in total/)).toBeInTheDocument();
    });
  });

  describe('Standard List Display', () => {
    it('displays standard name and links in results', () => {
      render(
        <MetaDataStandardsSelector
          field={mockField}
          handleToggleMetaDataStandards={mockHandleToggle}
          onMetaDataStandardsChange={mockOnChange}
        />
      );

      const addButton = screen.getAllByRole('button', { name: /researchOutput.metaDataStandards.buttons.add/i })[0];
      fireEvent.click(addButton);

      expect(screen.getByText('Terminal RI Unicamp')).toBeInTheDocument();
      expect(screen.getByText('https://repositorio.unicamp.br/')).toBeInTheDocument();
    });
  });

  describe('Edge Cases & Error Handling', () => {

    it('disables "Remove all" button when no standards are selected', () => {
      render(
        <MetaDataStandardsSelector
          field={mockField}
          handleToggleMetaDataStandards={mockHandleToggle}
          onMetaDataStandardsChange={mockOnChange}
        />
      );

      // "Remove all" button should not be present initially (or be disabled)
      const removeAllBtn = screen.queryByRole('button', { name: 'buttons.removeAll' });
      expect(removeAllBtn).not.toBeInTheDocument();
    });

    it('handles rapid selection and deselection correctly', () => {
      render(
        <MetaDataStandardsSelector
          field={mockField}
          handleToggleMetaDataStandards={mockHandleToggle}
          onMetaDataStandardsChange={mockOnChange}
        />
      );

      const addButton = screen.getAllByRole('button', { name: /researchOutput.metaDataStandards.buttons.add/i })[0];
      fireEvent.click(addButton);

      const selectButton = screen.getAllByRole('button', { name: 'buttons.select' })[0];

      // Rapidly toggle selection
      fireEvent.click(selectButton);
      fireEvent.click(screen.getAllByRole('button', { name: 'buttons.remove' })[0]);
      fireEvent.click(screen.getAllByRole('button', { name: 'buttons.select' })[0]);

      // Should end up in selected state
      expect(screen.getAllByRole('button', { name: 'buttons.remove' }).length).toBeGreaterThan(0);
    });

    it('generates unique IDs for custom standards', async () => {
      render(
        <MetaDataStandardsSelector
          field={mockField}
          handleToggleMetaDataStandards={mockHandleToggle}
          onMetaDataStandardsChange={mockOnChange}
        />
      );

      // Add first custom standard
      const addButton = screen.getByRole('button', { name: /researchOutput.metaDataStandards.buttons.add/i });
      fireEvent.click(addButton);

      const secondaryAddButton = screen.getByRole('button', { name: /researchOutput.metaDataStandards.buttons.add/i });
      fireEvent.click(secondaryAddButton);

      fireEvent.change(screen.getByTestId('form-input-std-name'), { target: { value: 'Custom 1' } });
      fireEvent.change(screen.getByTestId('form-input-std-url'), { target: { value: 'https://example1.com' } });
      fireEvent.change(screen.getByTestId('form-input-std-description'), { target: { value: 'Description 1' } });

      const submitButton = screen.getByRole('button', { name: /researchOutput.metaDataStandards.buttons.addToTemplate/i });
      fireEvent.click(submitButton);

      // Wait for async action to complete
      await waitFor(() => {
        expect(screen.getByText('Custom 1')).toBeInTheDocument();
      });

      // Open modal again to add another custom standard
      const addButton2 = screen.getByRole('button', { name: /researchOutput.metaDataStandards.buttons.add/i });
      fireEvent.click(addButton2);

      const secondaryAddButton2 = screen.getByRole('button', { name: /researchOutput.metaDataStandards.buttons.add/i });
      fireEvent.click(secondaryAddButton2);

      fireEvent.change(screen.getByTestId('form-input-std-name'), { target: { value: 'Custom 2' } });
      fireEvent.change(screen.getByTestId('form-input-std-url'), { target: { value: 'https://example2.com' } });
      fireEvent.change(screen.getByTestId('form-input-std-description'), { target: { value: 'Description 2' } });

      fireEvent.click(screen.getByRole('button', { name: /researchOutput.metaDataStandards.buttons.addToTemplate/i }));

      // Wait for async action to complete
      await waitFor(() => {
        expect(screen.getByText('Custom 2')).toBeInTheDocument();
      });

      // Both should be displayed
      expect(screen.getByText('Custom 1')).toBeInTheDocument();
      expect(screen.getByText('Custom 2')).toBeInTheDocument();
    });

    it('handles empty search results gracefully', () => {
      render(
        <MetaDataStandardsSelector
          field={mockField}
          handleToggleMetaDataStandards={mockHandleToggle}
          onMetaDataStandardsChange={mockOnChange}
        />
      );

      const addButton = screen.getByRole('button', { name: /researchOutput.metaDataStandards.buttons.add/i });
      fireEvent.click(addButton);

      const searchInput = screen.getByLabelText(/labels.searchTerm/i) as HTMLInputElement;
      fireEvent.change(searchInput, { target: { value: 'nonexistent-standard-xyz' } });

      const applyFilterBtn = screen.getByRole('button', { name: 'buttons.applyFilter' });
      fireEvent.click(applyFilterBtn);

      // Search results section should still be visible
      expect(screen.getByText(/Displaying standards/)).toBeInTheDocument();
    });

    it('case-insensitive search works correctly', () => {
      render(
        <MetaDataStandardsSelector
          field={mockField}
          handleToggleMetaDataStandards={mockHandleToggle}
          onMetaDataStandardsChange={mockOnChange}
        />
      );

      const addButton = screen.getByRole('button', { name: /researchOutput.metaDataStandards.buttons.add/i });
      fireEvent.click(addButton);

      const searchInput = screen.getByLabelText(/labels.searchTerm/i) as HTMLInputElement;
      fireEvent.change(searchInput, { target: { value: 'abcd' } });

      const applyFilterBtn = screen.getByRole('button', { name: 'buttons.applyFilter' });
      fireEvent.click(applyFilterBtn);

      // Should find results even with lowercase search
      expect(screen.getByText('Terminal RI Unicamp')).toBeInTheDocument();
    });

    it('handles very long standard names and descriptions', async () => {
      render(
        <MetaDataStandardsSelector
          field={mockField}
          handleToggleMetaDataStandards={mockHandleToggle}
          onMetaDataStandardsChange={mockOnChange}
        />
      );

      const addButton = screen.getByRole('button', { name: /researchOutput.metaDataStandards.buttons.add/i });
      fireEvent.click(addButton);

      const secondaryAddButton = screen.getByRole('button', { name: /researchOutput.metaDataStandards.buttons.add/i });
      fireEvent.click(secondaryAddButton);

      const longName = 'A'.repeat(500);
      const longDescription = 'B'.repeat(1000);

      fireEvent.change(screen.getByTestId('form-input-std-name'), { target: { value: longName } });
      fireEvent.change(screen.getByTestId('form-input-std-url'), { target: { value: 'https://example.com' } });
      fireEvent.change(screen.getByTestId('form-input-std-description'), { target: { value: longDescription } });

      const submitButton = screen.getByRole('button', { name: /researchOutput.metaDataStandards.buttons.addToTemplate/i });
      fireEvent.click(submitButton);

      // Should display the long name
      await waitFor(() => {
        expect(screen.getByText(longName)).toBeInTheDocument();

      })
    });

    it('validates URL format in custom form', () => {
      render(
        <MetaDataStandardsSelector
          field={mockField}
          handleToggleMetaDataStandards={mockHandleToggle}
          onMetaDataStandardsChange={mockOnChange}
        />
      );

      const addButton = screen.getByRole('button', { name: /researchOutput.metaDataStandards.buttons.add/i });
      fireEvent.click(addButton);

      const secondaryAddButton = screen.getByRole('button', { name: /researchOutput.metaDataStandards.buttons.add/i });
      fireEvent.click(secondaryAddButton);

      // The input type is "url" which provides browser validation
      const urlInput = screen.getByTestId('form-input-std-url') as HTMLInputElement;
      expect(urlInput.type).toBe('url');
    });
  });

  describe('State Management', () => {
    it('maintains selected standards across modal open/close cycles', () => {
      render(
        <MetaDataStandardsSelector
          field={mockField}
          handleToggleMetaDataStandards={mockHandleToggle}
          onMetaDataStandardsChange={mockOnChange}
        />
      );

      // Select a standard
      let addButton = screen.getAllByRole('button', { name: /researchOutput.metaDataStandards.buttons.add/i })[0];
      fireEvent.click(addButton);

      const selectButton = screen.getAllByRole('button', { name: 'buttons.select' })[0];
      fireEvent.click(selectButton);

      // Close modal
      let closeButton = screen.getByRole('button', { name: 'buttons.closeModal' });
      fireEvent.click(closeButton);

      expect(screen.getByText('Terminal RI Unicamp')).toBeInTheDocument();

      // Open modal again
      addButton = screen.getAllByRole('button', { name: /researchOutput.metaDataStandards.buttons.add/i })[0];
      fireEvent.click(addButton);

      // Standard should still be marked as selected
      expect(screen.getAllByRole('button', { name: 'buttons.remove' }).length).toBeGreaterThan(0);

      closeButton = screen.getByRole('button', { name: 'buttons.closeModal' });
      fireEvent.click(closeButton);

      // Standard should still appear in selected items
      expect(screen.getByText('Terminal RI Unicamp')).toBeInTheDocument();
    });

    it('clears custom form fields after successful submission', async () => {
      render(
        <MetaDataStandardsSelector
          field={mockField}
          handleToggleMetaDataStandards={mockHandleToggle}
          onMetaDataStandardsChange={mockOnChange}
        />
      );

      const addButton = screen.getByRole('button', { name: /researchOutput.metaDataStandards.buttons.add/i });
      fireEvent.click(addButton);

      await waitFor(() => {
        const secondaryAddButton = screen.getByRole('button', { name: /researchOutput.metaDataStandards.buttons.add/i });
        fireEvent.click(secondaryAddButton);
      })


      fireEvent.change(screen.getByTestId('form-input-std-name'), { target: { value: 'Test Standard' } });
      fireEvent.change(screen.getByTestId('form-input-std-url'), { target: { value: 'https://example.com' } });
      fireEvent.change(screen.getByTestId('form-input-std-description'), { target: { value: 'Test Description' } });

      const submitButton = screen.getByTestId('add-custom-std-btn');
      fireEvent.click(submitButton);

      // Form should be hidden
      await waitFor(() => {
        expect(screen.queryByTestId('form-input-std-name')).not.toBeInTheDocument();
      })

      // Open form again
      const addButton2 = screen.getAllByRole('button', { name: /researchOutput.metaDataStandards.buttons.add/i })[0];
      fireEvent.click(addButton2);

      await waitFor(() => {
        const secondaryAddButton2 = screen.getAllByRole('button', { name: /researchOutput.metaDataStandards.buttons.add/i })[0];
        fireEvent.click(secondaryAddButton2);
      })


      // Form fields should be empty
      expect((screen.getByTestId('form-input-std-name') as HTMLInputElement).value).toBe('');
      expect((screen.getByTestId('form-input-std-url') as HTMLInputElement).value).toBe('');
      expect((screen.getByTestId('form-input-std-description') as HTMLInputElement).value).toBe('');
    });
  });
});
