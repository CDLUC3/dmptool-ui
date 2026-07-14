import React from 'react';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import NumberComponent from '../index';

expect.extend(toHaveNoViolations);

describe('NumberComponent', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
  });

  it('should render label and input with initial value', () => {
    render(
      <NumberComponent
        label="Quantity"
        value={5}
      />
    );
    expect(screen.getByText('Quantity')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toHaveValue('5');
  });

  it('should call onChange with incremented value when + button is clicked', async () => {
    const handleChange = jest.fn();
    render(
      <NumberComponent
        label="Qty"
        value={2}
        onChange={handleChange}
      />
    );
    const incrementButton = screen.getByRole('button', { name: /increase/i });
    await user.click(incrementButton);
    expect(handleChange).toHaveBeenCalledWith(3);
  });

  it('should call onChange with decremented value when - button is clicked', async () => {
    const handleChange = jest.fn();
    render(
      <NumberComponent
        label="Qty"
        value={2}
        onChange={handleChange}
      />
    );
    const decrementButton = screen.getByRole('button', { name: /decrease/i });
    await user.click(decrementButton);
    expect(handleChange).toHaveBeenCalledWith(1);
  });

  it('should render placeholder in input', () => {
    render(
      <NumberComponent
        label="Qty"
        placeholder="Enter number"
      />
    );
    expect(screen.getByPlaceholderText('Enter number')).toBeInTheDocument();
  });

  it('should not render stepper buttons when showSteppers is false', () => {
    render(
      <NumberComponent
        label="Qty"
        value={5}
        showSteppers={false}
      />
    );
    expect(screen.getByRole('textbox')).toHaveValue('5');
    expect(screen.queryByRole('button', { name: /increase/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /decrease/i })).not.toBeInTheDocument();
  });

  it('should render prefix badge when prefix prop is set', () => {
    render(
      <NumberComponent
        label="Budget"
        value={100}
        prefix="$"
        affixAriaLabel="Amount in US dollars"
        showSteppers={false}
      />
    );
    expect(screen.getByText('$')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toHaveValue('100');
    expect(screen.getByText('Amount in US dollars')).toHaveClass('hidden-accessibly');
  });

  it('should use aria-label when label is empty and affixAriaLabel is set', () => {
    render(
      <NumberComponent
        label=""
        value={100}
        prefix="$"
        affixAriaLabel="Amount in US dollars"
        showSteppers={false}
      />
    );
    expect(screen.getByRole('textbox', { name: 'Amount in US dollars' })).toBeInTheDocument();
  });

  it('should render a suffix after the input', () => {
    render(
      <NumberComponent
        label="Budget"
        value={100}
        suffix="€"
        affixAriaLabel="Amount in euros"
        showSteppers={false}
      />
    );

    const input = screen.getByRole('textbox');
    expect(input.nextSibling).toHaveTextContent('€');
  });

  it('should disable input and buttons when disabled prop is true', () => {
    render(
      <NumberComponent
        label="Qty"
        disabled={true}
      />
    );
    // Confirm input is disabled
    const input = screen.getByRole('textbox');
    expect(input).toBeDisabled();

    // Confirmed decrement and increment buttons are disabled
    const decrementButton = screen.getByRole('button', { name: /decrease/i });
    expect(decrementButton).toBeDisabled();
    const incrementButton = screen.getByRole('button', { name: /increase/i });
    expect(incrementButton).toBeDisabled();
  });

  it('should not decrement below minValue', async () => {
    const handleChange = jest.fn();
    render(
      <NumberComponent
        label="Qty"
        value={1}
        minValue={1}
        onChange={handleChange}
      />
    );
    const decrementButton = screen.getByRole('button', { name: /decrease/i });
    await user.click(decrementButton);
    expect(handleChange).not.toHaveBeenCalled();
  });

  it('should not increment above maxValue', async () => {
    const handleChange = jest.fn();
    render(
      <NumberComponent
        label="Qty"
        value={10}
        maxValue={10}
        onChange={handleChange}
      />
    );
    const incrementButton = screen.getByRole('button', { name: /increase/i });
    await user.click(incrementButton);
    expect(handleChange).not.toHaveBeenCalled();
  });

  it('should use step prop when incrementing and decrementing', async () => {
    const handleChange = jest.fn();
    render(
      <NumberComponent
        label="Qty"
        value={2}
        step={2}
        onChange={handleChange}
      />
    );
    const incrementButton = screen.getByRole('button', { name: /increase/i });
    const decrementButton = screen.getByRole('button', { name: /decrease/i });
    await user.click(incrementButton);
    expect(handleChange).toHaveBeenCalledWith(4);
    await user.click(decrementButton);
    expect(handleChange).toHaveBeenCalledWith(0);
  });

  it('should pass axe accessibility test', async () => {
    const { container } = render(
      <NumberComponent
        label="Qty"
        value={2}
        onChange={jest.fn()}
      />
    );
    await act(async () => {
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    })
  })
});