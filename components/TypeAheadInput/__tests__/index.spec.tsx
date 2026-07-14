import React from 'react';
import "@testing-library/jest-dom";
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import TypeAheadInput from '..';
import mocksAffiliations from '@/__mocks__/common/mockAffiliations.json';

jest.mock('@/utils/clientLogger', () => ({
  __esModule: true,
  default: jest.fn(),
}));

expect.extend(toHaveNoViolations);

jest.mock('next-intl', () => ({
  useTranslations: jest.fn(() => jest.fn((key) => key)), // Mock `useTranslations`,
}));

const mockOnSearch = jest.fn();

describe('TypeAheadInput', () => {

  beforeEach(() => {
    jest.useFakeTimers();
    HTMLElement.prototype.scrollIntoView = jest.fn();
  });


  afterEach(() => {
    jest.resetAllMocks();
    jest.useRealTimers();
  })

  it('should render initial state correctly', () => {
    render(
      <TypeAheadInput
        label="Institution"
        helpText="Search for an institution"
        fieldName="test"
        required={false}
        error=""
        updateFormData={() => true}
        value="text"
        suggestions={mocksAffiliations}
        onSearch={mockOnSearch}
      />
    );

    expect(screen.getByLabelText('Institution')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Type to search...')).toBeInTheDocument();
    expect(screen.getByText('Search for an institution')).toBeInTheDocument();
  });

  it('should pass axe accessibility test', async () => {
    const { container } = render(
      <TypeAheadInput
        label="Institution"
        helpText="Search for an institution"
        fieldName="test"
        required={false}
        error=""
        updateFormData={() => true}
        value="text"
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
      <TypeAheadInput
        label="Institution"
        helpText="Search for an institution"
        fieldName="test"
        required={false}
        error=""
        updateFormData={() => true}
        value="text"
        suggestions={mocksAffiliations}
        onSearch={mockOnSearch}
      />
    );

    const input = screen.getByLabelText('Institution');

    act(() => { //make sure all updates related to React are completed
      fireEvent.change(input, { target: { value: 'Test' } });
      jest.advanceTimersByTime(1000);// This is to take the debounce into consideration
    })

    await waitFor(() => {
      expect(screen.getByText('Test University')).toBeInTheDocument();
      expect(screen.getByText('Test Institution')).toBeInTheDocument();
    })
  });

  it('should not display suggestions when there are no matching results', async () => {
    render(
      <TypeAheadInput
        label="Institution"
        helpText="Search for an institution"
        fieldName="test"
        required={false}
        error=""
        updateFormData={() => true}
        value="text"
        suggestions={[]}
        onSearch={mockOnSearch}
      />
    )

    const input = screen.getByLabelText('Institution');

    act(() => { //make sure all updates related to React are completed
      fireEvent.change(input, { target: { value: 'Test' } });
      jest.advanceTimersByTime(1000);// This is to take the debounce into consideration
    })

    await waitFor(() => {
      expect(screen.queryByText('Test University')).not.toBeInTheDocument();
    });
  });


  it('should handle keyboard navigation in suggestions list', async () => {

    render(
      <TypeAheadInput
        label="Institution"
        helpText="Search for an institution"
        fieldName="test"
        required={false}
        error=""
        updateFormData={() => true}
        value="text"
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

    // Test arrow down: focus stays on the input, the first suggestion is highlighted
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    const firstSuggestion = screen.getByText('Test University');
    await waitFor(() => {
      expect(firstSuggestion).toHaveAttribute('aria-selected', 'true');
    });
    expect(input).toHaveFocus();
    expect(input).toHaveAttribute('aria-activedescendant', firstSuggestion.id);

    // Test arrow up past the first suggestion: highlight is cleared
    fireEvent.keyDown(input, { key: 'ArrowUp' });
    expect(input).toHaveFocus();
    expect(input).not.toHaveAttribute('aria-activedescendant');
    expect(firstSuggestion).toHaveAttribute('aria-selected', 'false');
  });

  it('should correctly handle use of \'Enter\' key for selecting an item from the dropdown', async () => {

    render(
      <TypeAheadInput
        label="Institution"
        helpText="Search for an institution"
        fieldName="test"
        required={false}
        error=""
        updateFormData={() => true}
        value="text"
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

    fireEvent.keyDown(input, { key: 'ArrowDown' });

    const listItem = await screen.findByText('Test University');

    expect(listItem).toHaveAttribute('aria-selected', 'true');
    expect(input).toHaveAttribute('aria-activedescendant', listItem.id);

    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    expect(input).toHaveValue('Test University');
    expect(input).not.toHaveAttribute('aria-activedescendant');
  });

  it('should preserve the input value and place the cursor at the end on focus', () => {
    const mockUpdateFormData = jest.fn();

    render(
      <TypeAheadInput
        label="Institution"
        helpText="Search for an institution"
        fieldName="test"
        required={false}
        error=""
        updateFormData={mockUpdateFormData}
        value="text"
        suggestions={mocksAffiliations}
        onSearch={mockOnSearch}
      />
    );

    const input = screen.getByLabelText('Institution');

    act(() => {
      input.focus();
    });

    expect(input).toHaveValue('text');
    expect(input).toHaveFocus();
    expect(input).toHaveProperty('selectionStart', 'text'.length);
    expect(input).toHaveProperty('selectionEnd', 'text'.length);
    expect(mockUpdateFormData).not.toHaveBeenCalled();
  });

  it('should clear the input and form data on focus when clearOnFocus is enabled', () => {
    const mockUpdateFormData = jest.fn();

    render(
      <TypeAheadInput
        label="Institution"
        helpText="Search for an institution"
        fieldName="test"
        required={false}
        error=""
        updateFormData={mockUpdateFormData}
        value="text"
        suggestions={mocksAffiliations}
        onSearch={mockOnSearch}
        clearOnFocus
      />
    );

    const input = screen.getByLabelText('Institution');

    fireEvent.focus(input);

    expect(input).toHaveValue('');
    expect(mockUpdateFormData).toHaveBeenCalledWith('', '');
  });

  it('should reset search when user clicks outside of the input and dropdown', async () => {
    const mockOnSearch = jest.fn();
    const mockUpdateFormData = jest.fn();

    render(
      <div>
        <TypeAheadInput
          label="Institution"
          helpText="Search for an institution"
          fieldName="test"
          required={false}
          error=""
          updateFormData={mockUpdateFormData}
          value="text"
          suggestions={mocksAffiliations}
          onSearch={mockOnSearch}
        />
        <div data-testid="outside-element">Click me</div>
      </div>
    );

    const input = screen.getByLabelText('Institution');

    act(() => {
      fireEvent.change(input, { target: { value: 'Test' } });
      jest.advanceTimersByTime(1000);
    });

    await waitFor(() => {
      expect(screen.getByText('Test University')).toBeInTheDocument();
      const combobox = screen.getByRole('combobox');
      expect(combobox).toHaveAttribute('aria-expanded', 'true');
    });

    // Click outside
    fireEvent.click(screen.getByTestId('outside-element'));

    // Verify dropdown is closed
    await waitFor(() => {
      const combobox = screen.getByRole('combobox');
      expect(combobox).toHaveAttribute('aria-expanded', 'false');

    })
  })

  it('should close the suggestions list when Escape is pressed', async () => {
    render(
      <TypeAheadInput
        label="Institution"
        helpText="Search for an institution"
        fieldName="test"
        required={false}
        error=""
        updateFormData={() => true}
        value="text"
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
      expect(screen.getByRole('combobox')).toHaveAttribute('aria-expanded', 'true');
    });

    fireEvent.keyDown(input, { key: 'Escape' });

    expect(screen.getByRole('combobox')).toHaveAttribute('aria-expanded', 'false');
    expect(input).not.toHaveAttribute('aria-activedescendant');
  });

  it('should stay highlighted on last item if ArrowDown button continues to be clicked', async () => {
    render(
      <TypeAheadInput
        label="Institution"
        helpText="Search for an institution"
        fieldName="test"
        required={false}
        error=""
        updateFormData={() => true}
        value="text"
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

    fireEvent.keyDown(input, { key: 'ArrowDown' });

    const listItem = await screen.findByText('Test University');

    expect(listItem).toHaveAttribute('aria-selected', 'true');

    fireEvent.keyDown(input, { key: 'ArrowDown' });

    const listItem2 = await screen.findByText('Test Institution');

    expect(listItem2).toHaveAttribute('aria-selected', 'true');
    fireEvent.keyDown(input, { key: 'ArrowDown' });

    expect(listItem2).toHaveAttribute('aria-selected', 'true');
    expect(input).toHaveAttribute('aria-activedescendant', listItem2.id);
  });

  it('should highlight the correct item if user clicks ArrowDown twice and then ArrowUp', async () => {
    render(
      <TypeAheadInput
        label="Institution"
        helpText="Search for an institution"
        fieldName="test"
        required={false}
        error=""
        updateFormData={() => true}
        value="text"
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

    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'ArrowDown' });

    fireEvent.keyDown(input, { key: 'ArrowUp' });

    const listItem = await screen.findByText('Test University');

    expect(listItem).toHaveAttribute('aria-selected', 'true');
    expect(input).toHaveAttribute('aria-activedescendant', listItem.id);
  });
});