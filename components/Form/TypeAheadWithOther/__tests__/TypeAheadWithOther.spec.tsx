import React from 'react';

import { render, screen, fireEvent, waitFor, act } from '@/utils/test-utils';
import { axe, toHaveNoViolations } from 'jest-axe';

import { TypeAheadWithOther } from '@/components/Form/TypeAheadWithOther';
import mocksAffiliations from '@/__mocks__/common/mockAffiliations.json';


expect.extend(toHaveNoViolations);

jest.mock('@/utils/clientLogger', () => ({
  __esModule: true,
  default: jest.fn(),
}));

const mockSetOtherField = jest.fn();
const mockOnSearch = jest.fn();


describe('TypeAheadWithOther', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    HTMLElement.prototype.scrollIntoView = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  })

  it('should render initial state correctly', () => {
    render(
      <TypeAheadWithOther
        label="Institution"
        helpText="Search for an institution"
        setOtherField={mockSetOtherField}
        fieldName="test"
        error=""
        updateFormData={() => true}
        value="text"
        suggestions={mocksAffiliations}
        onSearch={mockOnSearch}
      />
    );

    expect(screen.getByLabelText(/Institution/)).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Type to search...')).toBeInTheDocument();
    expect(screen.getByText('Search for an institution')).toBeInTheDocument();
  });

  it('should pass axe accessibility test', async () => {
    const { container } = render(
      <TypeAheadWithOther
        label="Institution"
        helpText="Search for an institution"
        setOtherField={mockSetOtherField}
        fieldName="test"
        error=""
        updateFormData={() => true}
        value="input value"
        suggestions={mocksAffiliations}
        onSearch={mockOnSearch}
      />
    );
    jest.useRealTimers();
    const results = await axe(container);
    jest.useFakeTimers();
    expect(results).toHaveNoViolations();
  })

  it('should fetch and display suggestions', async () => {
    render(
      <TypeAheadWithOther
        label="Institution"
        helpText="Search for an institution"
        setOtherField={mockSetOtherField}
        fieldName="test"
        error=""
        updateFormData={() => true}
        value="input value"
        suggestions={mocksAffiliations}
        onSearch={mockOnSearch}
      />
    );

    const input = screen.getByLabelText(/Institution/);

    act(() => { //make sure all updates related to React are completed
      fireEvent.change(input, { target: { value: 'Test' } });
      jest.advanceTimersByTime(1000);// This is to take the debounce into consideration
    })

    await waitFor(() => {
      expect(mockOnSearch).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(screen.getByText('Test University')).toBeInTheDocument();
      expect(screen.getByText('Test Institution')).toBeInTheDocument();
    })
  });

  it('should display error message when passed in', async () => {
    render(
      <TypeAheadWithOther
        label="Institution"
        helpText="Search for an institution"
        setOtherField={mockSetOtherField}
        fieldName="test"
        isRequired={true}
        error="Institution field is required"
        updateFormData={() => true}
        value="input value"
        suggestions={mocksAffiliations}
        onSearch={mockOnSearch}
      />
    );

    const input = screen.getByLabelText(/Institution/);

    act(() => { //make sure all updates related to React are completed
      fireEvent.change(input, { target: { value: '  ' } });
      jest.advanceTimersByTime(1000);// This is to take the debounce into consideration
    })

    await waitFor(() => {
      expect(screen.getByText('Institution field is required')).toBeInTheDocument();
    })
  });

  it('should preserve the input value and place the cursor at the end on focus', () => {
    const mockUpdateFormData = jest.fn();

    render(
      <TypeAheadWithOther
        label="Institution"
        helpText="Search for an institution"
        setOtherField={mockSetOtherField}
        fieldName="test"
        error=""
        updateFormData={mockUpdateFormData}
        value="Initial Value" // Start with a value
        suggestions={mocksAffiliations}
        onSearch={mockOnSearch}
      />
    );

    const input = screen.getByLabelText('Institution');

    // Verify initial value is set
    expect(input).toHaveValue('Initial Value');

    act(() => {
      input.focus();
    });

    expect(input).toHaveValue('Initial Value');
    expect(input).toHaveFocus();
    expect(input).toHaveProperty('selectionStart', 'Initial Value'.length);
    expect(input).toHaveProperty('selectionEnd', 'Initial Value'.length);
    expect(mockUpdateFormData).not.toHaveBeenCalled();
  });

  it('should clear the input and form data on focus when clearOnFocus is enabled', () => {
    const mockUpdateFormData = jest.fn();

    render(
      <TypeAheadWithOther
        label="Institution"
        helpText="Search for an institution"
        setOtherField={mockSetOtherField}
        fieldName="test"
        error=""
        updateFormData={mockUpdateFormData}
        value="Initial Value"
        suggestions={mocksAffiliations}
        onSearch={mockOnSearch}
        clearOnFocus
      />
    );

    const input = screen.getByLabelText('Institution');

    fireEvent.focus(input);

    expect(input).toHaveValue('');
    expect(mockUpdateFormData).toHaveBeenCalledWith('', '');
    expect(mockSetOtherField).toHaveBeenCalledWith(false);
  });


  it('should update input value and call updateFormData when user types', async () => {
    const mockUpdateFormData = jest.fn();

    render(
      <TypeAheadWithOther
        label="Institution"
        setOtherField={mockSetOtherField}
        fieldName="test"
        updateFormData={mockUpdateFormData}
        suggestions={mocksAffiliations}
        onSearch={mockOnSearch}
      />
    );

    const input = screen.getByLabelText('Institution');

    // Type in the input
    fireEvent.change(input, { target: { value: 'Test University' } });

    // Verify input value is updated
    expect(input).toHaveValue('Test University');

    // Verify updateFormData was called with correct arguments
    expect(mockUpdateFormData).toHaveBeenCalledWith('', 'Test University');
    expect(mockSetOtherField).toHaveBeenCalledWith(false);
  });

  it('should close the suggestions list when Escape is pressed', async () => {
    const mockUpdateFormData = jest.fn();

    render(
      <TypeAheadWithOther
        label="Institution"
        setOtherField={mockSetOtherField}
        fieldName="test"
        updateFormData={mockUpdateFormData}
        suggestions={mocksAffiliations}
        onSearch={mockOnSearch}
      />
    );

    const input = screen.getByLabelText('Institution');

    fireEvent.change(input, { target: { value: 'Test' } });

    act(() => {
      jest.advanceTimersByTime(350);
    });

    await waitFor(() => {
      expect(screen.getByRole('combobox')).toHaveAttribute('aria-expanded', 'true');
    });

    fireEvent.keyDown(input, { key: 'Escape' });

    expect(screen.getByRole('combobox')).toHaveAttribute('aria-expanded', 'false');
    expect(input).not.toHaveAttribute('aria-activedescendant');
  });

  it('should setOtherField(true) when "Other" option is selected', async () => {
    const mockUpdateFormData = jest.fn();

    render(
      <TypeAheadWithOther
        label="Institution"
        helpText="Search for an institution"
        setOtherField={mockSetOtherField}
        fieldName="test"
        error=""
        updateFormData={mockUpdateFormData}
        value="input value"
        suggestions={mocksAffiliations}
        onSearch={mockOnSearch}
        otherText="Other (organization not listed)"
      />
    );

    const input = screen.getByLabelText('Institution');

    // Type to show suggestions (forces dropdown open)
    fireEvent.change(input, { target: { value: 'x' } });

    await waitFor(() => {
      expect(screen.getByText('Other (organization not listed)')).toBeInTheDocument();
    });

    // Click the "Other" option
    fireEvent.click(screen.getByText('Other (organization not listed)'));

    // Check last call to updateFormData
    const lastCall = mockUpdateFormData.mock.calls.at(-1);
    expect(lastCall).toEqual(['other', 'Other (organization not listed)']);

    expect(mockSetOtherField).toHaveBeenCalledWith(true);
    expect(input).toHaveValue('Other (organization not listed)');
  });

  it('should handle keyboard navigation in suggestions list', async () => {

    render(
      <TypeAheadWithOther
        label="Institution"
        helpText="Search for an institution"
        setOtherField={mockSetOtherField}
        fieldName="test"
        error=""
        updateFormData={() => true}
        otherText="Other(organization not listed)"
        value="input value"
        suggestions={mocksAffiliations}
        onSearch={mockOnSearch}
      />
    );

    const input = screen.getByLabelText('Institution');

    act(() => {
      fireEvent.change(input, { target: { value: 'Test' } });
      jest.advanceTimersByTime(1000);
    });

    await waitFor(() => {
      expect(screen.getByText('Test University')).toBeInTheDocument();
    });

    act(() => {
      input.focus();
    });

    // Test arrow down: focus stays on the input, the first option ("Other") is highlighted
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    const otherOption = screen.getByText('Other(organization not listed)');
    await waitFor(() => {
      expect(otherOption).toHaveAttribute('aria-selected', 'true');
    });
    expect(input).toHaveFocus();
    expect(input).toHaveAttribute('aria-activedescendant', otherOption.id);

    // Test arrow down again: highlight moves to the first suggestion
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    const firstSuggestion = screen.getByText('Test University');
    await waitFor(() => {
      expect(firstSuggestion).toHaveAttribute('aria-selected', 'true');
    });
    expect(input).toHaveFocus();
    expect(input).toHaveAttribute('aria-activedescendant', firstSuggestion.id);
    expect(otherOption).toHaveAttribute('aria-selected', 'false');

    // Test arrow up back past the first option: highlight is cleared
    fireEvent.keyDown(input, { key: 'ArrowUp' });
    fireEvent.keyDown(input, { key: 'ArrowUp' });
    expect(input).toHaveFocus();
    expect(input).not.toHaveAttribute('aria-activedescendant');
    expect(otherOption).toHaveAttribute('aria-selected', 'false');
  });

  it('should correctly handle use of \'Enter\' key for selecting an item from the dropdown', async () => {
    await act(async () => {
      render(
        <TypeAheadWithOther
          label="Institution"
          helpText="Search for an institution"
          setOtherField={mockSetOtherField}
          fieldName="test"
          error=""
          updateFormData={() => true}
          value="input value"
          suggestions={mocksAffiliations}
          onSearch={mockOnSearch}
        />
      );
    });


    const input = screen.getByLabelText('Institution');

    await act(async () => {
      fireEvent.change(input, { target: { value: 'Test University' } });
      jest.advanceTimersByTime(1000);
    });

    await waitFor(() => {
      expect(screen.getByText('Test University')).toBeInTheDocument();
    });

    // Arrow down twice: past "Other" onto the first suggestion. Focus stays on the input.
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'ArrowDown' });

    const listItem = await screen.findByText('Test University');
    expect(listItem).toHaveAttribute('aria-selected', 'true');
    expect(input).toHaveAttribute('aria-activedescendant', listItem.id);

    await act(async () => {
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
    });

    expect(input).toHaveValue('Test University');
    expect(input).not.toHaveAttribute('aria-activedescendant');
  });

  it('should display "(required)" text when field is required', () => {
    render(
      <TypeAheadWithOther
        label="Institution"
        helpText="Search for an institution"
        setOtherField={mockSetOtherField}
        fieldName="test"
        error=""
        updateFormData={() => true}
        value="input value"
        suggestions={mocksAffiliations}
        onSearch={mockOnSearch}
        isRequired={true}
      />
    );

    expect(screen.getByText('Institution')).toBeInTheDocument();
    expect(screen.getByText(/required/)).toBeInTheDocument();
    expect(screen.getByText(/required/)).toHaveClass('is-required');
  });

  it('should allow for requiredVisualOnly', () => {
    render(
      <TypeAheadWithOther
        label="Institution"
        helpText="Search for an institution"
        setOtherField={mockSetOtherField}
        fieldName="test"
        error=""
        updateFormData={() => true}
        value="input value"
        suggestions={mocksAffiliations}
        onSearch={mockOnSearch}
        isRequiredVisualOnly={true}
      />
    );

    expect(screen.getByText('Institution')).toBeInTheDocument();
    expect(screen.queryByText(/required/)).toBeInTheDocument();
    expect(screen.getByText(/required/)).toHaveClass('is-required');
  });
});
