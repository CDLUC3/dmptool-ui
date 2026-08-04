import React from 'react';
import { CurrencyQuestionType } from '@dmptool/types';
import { NumberComponent } from '@/components/Form';
import {
  CURRENCY_DEFAULT_DENOMINATION,
  CURRENCY_DEFAULT_LOCALE,
  CURRENCY_DEFAULT_MIN,
} from '@/lib/constants';

export type CurrencySymbolPosition = 'prefix' | 'suffix';

interface CurrencyQuestionProps {
  parsedQuestion: CurrencyQuestionType;
  inputCurrencyValue: number | null;
  currencyLabel?: string;
  placeholder?: string;
  isDisabled?: boolean;
  handleCurrencyChange: (value: number | null) => void;
  /** +/- steppers are off by default for currency; pass true to enable them. */
  showSteppers?: boolean;
  /** Show cents/pence using two decimal places. Defaults to false. */
  showMinorUnits?: boolean;
  /** Place the currency symbol before or after the amount. Defaults to prefix. */
  symbolPosition?: CurrencySymbolPosition;
  /** BCP 47 locale used for number formatting and currency names. Defaults to en-US. */
  locale?: string;
}

function getCurrencySymbol(denomination: string, locale: string): string {
  const parts = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: denomination,
    currencyDisplay: 'narrowSymbol',
  }).formatToParts(0);

  return parts.find(part => part.type === 'currency')?.value ?? '$';
}

function getCurrencyAccessibleName(denomination: string, locale: string): string {
  try {
    const name = new Intl.DisplayNames([locale], { type: 'currency' }).of(denomination);
    if (name) {
      return `Amount in ${name}`;
    }
  } catch {
    // Intl.DisplayNames may be unavailable in some environments
  }

  return `Amount in ${denomination}`;
}

const CurrencyQuestionComponent: React.FC<CurrencyQuestionProps> = ({
  parsedQuestion,
  inputCurrencyValue,
  currencyLabel,
  placeholder,
  isDisabled = false,
  handleCurrencyChange,
  showSteppers = false,
  showMinorUnits = false,
  symbolPosition = 'prefix',
  locale = CURRENCY_DEFAULT_LOCALE,
}) => {
  const denomination =
    parsedQuestion?.attributes?.denomination?.trim().toUpperCase() ||
    CURRENCY_DEFAULT_DENOMINATION;
  const minValue = parsedQuestion?.attributes?.min ?? CURRENCY_DEFAULT_MIN;
  const maxValue = parsedQuestion?.attributes?.max;
  const step = showSteppers ? parsedQuestion?.attributes?.step : undefined;
  const currencySymbol = getCurrencySymbol(denomination, locale);
  const currencyAriaLabel = getCurrencyAccessibleName(denomination, locale);
  const fractionDigits = showMinorUnits ? 2 : 0;

  return (
    <NumberComponent
      label={currencyLabel || ""}
      value={inputCurrencyValue}
      onChange={value => handleCurrencyChange(value)}
      placeholder={placeholder || ''}
      minValue={minValue}
      maxValue={maxValue ?? undefined}
      step={step}
      showSteppers={showSteppers}
      variant="currency"
      prefix={symbolPosition === 'prefix' ? currencySymbol : undefined}
      suffix={symbolPosition === 'suffix' ? currencySymbol : undefined}
      affixAriaLabel={currencyAriaLabel}
      locale={locale}
      formatOptions={{
        style: 'decimal',
        minimumFractionDigits: fractionDigits,
        maximumFractionDigits: fractionDigits,
      }}
      disabled={isDisabled}
    />
  );
};

export default CurrencyQuestionComponent;
