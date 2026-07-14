import React from 'react';
import type { CurrencyQuestionType } from '@dmptool/types';
import { act, render, screen } from '@/utils/test-utils';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { CurrencyQuestionComponent } from '@/components/Form/QuestionComponents';

expect.extend(toHaveNoViolations);


describe('Currency Question Component', () => {
  let user: ReturnType<typeof userEvent.setup>;
  beforeEach(() => {
    user = userEvent.setup();
  });

  const mockHandleCurrencyChange = jest.fn();
  const mockParsedQuestion: CurrencyQuestionType = {
    type: "currency",
    meta: {
      schemaVersion: "1.0",
    },
    attributes: {
      min: 0,
      max: 10000,
      step: 0.01,
      denomination: "USD",
      labelTranslationKey: "questions.cost_estimate",
    }
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render currency field with a label and no stepper buttons by default', () => {
    render(
      <CurrencyQuestionComponent
        parsedQuestion={mockParsedQuestion}
        inputCurrencyValue={12.00}
        currencyLabel="Currency Amount"
        placeholder='Enter amount'
        handleCurrencyChange={mockHandleCurrencyChange}
      />
    );
    expect(screen.getByText('Currency Amount')).toBeInTheDocument();
    expect(screen.getByText('$')).toBeInTheDocument();
    expect(screen.queryByLabelText('Decrease')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Increase')).not.toBeInTheDocument();

    const currencyInput = screen.getByPlaceholderText('Enter amount') as HTMLInputElement
    expect(currencyInput.value).toBe('12');
  });

  it('should include an accessible currency description', () => {
    render(
      <CurrencyQuestionComponent
        parsedQuestion={mockParsedQuestion}
        inputCurrencyValue={12.00}
        handleCurrencyChange={mockHandleCurrencyChange}
      />
    );

    expect(screen.getByText('Amount in US Dollar')).toBeInTheDocument();
  });

  it('should fallback to default empty string for label and placeholder when none provided', () => {
    render(
      <CurrencyQuestionComponent
        parsedQuestion={mockParsedQuestion}
        inputCurrencyValue={12.00}
        handleCurrencyChange={mockHandleCurrencyChange}
      />
    );

    expect(document.querySelector('label.react-aria-Label')).not.toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Amount in US Dollar' })).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toHaveAttribute('placeholder', '');
  });

  it('should fallback to \'USD\' if no denomination is present in parsedQuestion', () => {
    const mockCurrencyQuestion: CurrencyQuestionType = {
      type: "currency",
      meta: {
        schemaVersion: "1.0",
      },
      attributes: {
        min: 0,
        max: 10000,
        step: 0.01,
        denomination: '',
        labelTranslationKey: "questions.cost_estimate",
      }
    };
    render(
      <CurrencyQuestionComponent
        parsedQuestion={mockCurrencyQuestion}
        inputCurrencyValue={12.00}
        placeholder={'Enter amount'}
        handleCurrencyChange={mockHandleCurrencyChange}
      />
    );

    // Should see correct currency symbol
    const currencyInput = screen.getByPlaceholderText('Enter amount') as HTMLInputElement
    expect(screen.getByText('$')).toBeInTheDocument();
    expect(currencyInput.value).toBe('12');
  });

  it('should call setCurrencyInputValue when input values change', async () => {
    render(
      <CurrencyQuestionComponent
        parsedQuestion={mockParsedQuestion}
        inputCurrencyValue={12.00}
        placeholder='Enter amount'
        handleCurrencyChange={mockHandleCurrencyChange}
      />
    );

    const currencyInput = screen.getByPlaceholderText('Enter amount') as HTMLInputElement

    await userEvent.clear(currencyInput);
    await userEvent.type(currencyInput, '15');
    await userEvent.tab(); // 👈 React Aria Component NumberField requires this to be able to register an input change

    expect(mockHandleCurrencyChange).toHaveBeenCalledWith(15.00);
  });

  it('should increment and decrement when showSteppers is enabled', async () => {
    render(
      <CurrencyQuestionComponent
        parsedQuestion={mockParsedQuestion}
        inputCurrencyValue={12.00}
        placeholder='Enter amount'
        handleCurrencyChange={mockHandleCurrencyChange}
        showSteppers
        showMinorUnits
      />
    );

    const decreaseButton = screen.getByRole('button', { name: /decrease/i });
    const increaseButton = screen.getByRole('button', { name: /increase/i });
    expect(screen.getByText('$')).toBeInTheDocument();

    await user.click(increaseButton);
    expect(mockHandleCurrencyChange).toHaveBeenCalledWith(12.01);
    await user.click(decreaseButton);
    expect(mockHandleCurrencyChange).toHaveBeenCalledWith(11.99);
  });

  it('should format and parse amounts using the configured locale', async () => {
    render(
      <CurrencyQuestionComponent
        parsedQuestion={{
          ...mockParsedQuestion,
          attributes: {
            ...mockParsedQuestion.attributes,
            denomination: 'EUR',
          max: 1000000,
          },
        }}
        inputCurrencyValue={250000}
        placeholder="Enter amount"
        handleCurrencyChange={mockHandleCurrencyChange}
        locale="de-DE"
        symbolPosition="suffix"
        showMinorUnits
      />
    );

    const currencyInput = screen.getByPlaceholderText('Enter amount') as HTMLInputElement;
    expect(currencyInput.value).toBe('250.000,00');

    await user.clear(currencyInput);
    await user.type(currencyInput, '250.000,50');
    await user.tab();

    expect(mockHandleCurrencyChange).toHaveBeenLastCalledWith(250000.5);
  });

  it('should pass axe accessibility test', async () => {
    const { container } = render(
      <CurrencyQuestionComponent
        parsedQuestion={mockParsedQuestion}
        inputCurrencyValue={12.00}
        placeholder='Enter amount'
        handleCurrencyChange={mockHandleCurrencyChange}
      />
    );
    await act(async () => {
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    })
  })
});