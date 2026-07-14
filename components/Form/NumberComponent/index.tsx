import React from 'react';
import {
  NumberField,
  Label,
  Group,
  Button,
  Input,
  Text,
  I18nProvider,
  type NumberFieldProps as AriaNumberFieldProps,
} from 'react-aria-components';
import styles from './numberComponent.module.scss';

export type NumberComponentVariant = 'default' | 'currency';

export interface NumberComponentProps {
  label: string;
  value?: number | null;
  minValue?: number;
  maxValue?: number;
  step?: number;
  onChange?: (value: number) => void;
  placeholder?: string;
  disabled?: boolean;
  formatOptions?: Intl.NumberFormatOptions;
  /** BCP 47 locale for number/currency formatting (e.g. `en-US`). */
  locale?: string;
  /** When false, renders a plain input without +/- stepper buttons. Defaults to true. */
  showSteppers?: boolean;
  /** Applies layout styling. Use `currency` for wider formatted currency inputs. */
  variant?: NumberComponentVariant;
  /** Optional prefix shown beside the input (e.g. currency symbol in a badge). */
  prefix?: string;
  /** Optional suffix shown beside the input (e.g. a trailing currency symbol). */
  suffix?: string;
  /** Screen reader description when using a visual prefix or suffix. */
  affixAriaLabel?: string;
}

const NumberComponent: React.FC<NumberComponentProps & Omit<AriaNumberFieldProps, keyof NumberComponentProps>> = ({
  label,
  value = 0,
  minValue,
  maxValue,
  step,
  onChange,
  placeholder,
  disabled,
  formatOptions,
  locale,
  showSteppers = true,
  variant = 'default',
  prefix,
  suffix,
  affixAriaLabel,
  ...props
}) => {
  const hasVisibleLabel = Boolean(label?.trim());
  const inputClassName = [
    styles.numberInput,
    'react-aria-Input',
    prefix && !showSteppers ? styles.numberInputWithPrefix : '',
    suffix && !showSteppers ? styles.numberInputWithSuffix : '',
  ].filter(Boolean).join(' ');
  const variantProps = variant !== 'default' ? { 'data-variant': variant } : {};

  const renderInput = () => (
    <Input placeholder={placeholder} className={inputClassName} />
  );

  const numberField = (
    <NumberField
      value={Number(value)}
      minValue={minValue}
      maxValue={maxValue}
      step={step}
      onChange={onChange}
      isDisabled={disabled}
      formatOptions={formatOptions}
      aria-label={!hasVisibleLabel ? affixAriaLabel : undefined}
      {...variantProps}
      {...props}
    >
      {hasVisibleLabel ? <Label>{label}</Label> : null}
      {(prefix || suffix) && affixAriaLabel ? (
        <Text slot="description" className="hidden-accessibly">
          {affixAriaLabel}
        </Text>
      ) : null}
      {showSteppers || prefix || suffix ? (
        <Group className={`${prefix || suffix ? styles.numberFieldWithAffix : styles.numberWrapper} react-aria-Group`}>
          {prefix ? (
            <span className={styles.currencyPrefix} aria-hidden="true">
              {prefix}
            </span>
          ) : null}
          {showSteppers ? (
            <Button slot="decrement" className={`${styles.leftButton} ${styles.numberButton} react-aria-Button`}>-</Button>
          ) : null}
          {renderInput()}
          {showSteppers ? (
            <Button slot="increment" className={`${styles.rightButton} ${styles.numberButton} react-aria-Button`}>+</Button>
          ) : null}
          {suffix ? (
            <span className={styles.currencySuffix} aria-hidden="true">
              {suffix}
            </span>
          ) : null}
        </Group>
      ) : (
        renderInput()
      )}
    </NumberField>
  );

  return locale ? (
    <I18nProvider locale={locale}>
      {numberField}
    </I18nProvider>
  ) : numberField;
};

export default NumberComponent;
