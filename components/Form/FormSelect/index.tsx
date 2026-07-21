import React, { forwardRef, Key } from 'react';
import { useTranslations } from "next-intl";
import type {
  SelectProps,
  ValidationResult
} from 'react-aria-components';
import {
  Button,
  FieldError,
  Label,
  ListBox,
  ListBoxItem,
  Popover,
  Select,
  SelectValue,
  Text
} from 'react-aria-components';
import styles from './formSelect.module.scss';

interface SelectItem {
  id: string;
  name: string;
}
interface MySelectProps<T extends SelectItem>
  extends Omit<SelectProps<T>, 'children' | 'onChange'> {
  label?: string;
  ariaLabel?: string;
  hideLabelVisually?: boolean;
  errorMessage?: string | ((validation: ValidationResult) => string);
  helpMessage?: string;
  description?: string;
  selectClasses?: string;
  isRequired?: boolean;
  isRequiredVisualOnly?: boolean;
  isDisabled?: boolean;
  onChange?: (value: string) => void;
  items?: T[];
  placeHolder?: string;
  selectedKey?: string;
  children?: React.ReactNode | ((item: T) => React.ReactNode);
}

export const FormSelect = forwardRef<HTMLButtonElement, MySelectProps<SelectItem>>((props, ref) => {
  const {
    label,
    ariaLabel,
    hideLabelVisually,
    errorMessage,
    helpMessage,
    description,
    selectClasses,
    isRequired = false,
    isRequiredVisualOnly = false,
    isDisabled = false,
    onChange,
    items,
    placeholder,
    selectedKey,
    ...rest
  } = props;
  const showRequired = isRequired || isRequiredVisualOnly;
  const t = useTranslations('Global.labels');

  const handleSelectionChange = (key: Key | null) => {
    if (onChange) {
      // Convert `Key | null` to string or undefined as needed
      onChange(key?.toString() ?? '');
    }
  };

  return (
    <Select
      {...rest}
      selectedKey={selectedKey}
      data-invalid={errorMessage}
      className={`${selectClasses} ${styles.mySelect} react-aria-Select`}
      aria-label={ariaLabel}
      aria-required={isRequired}
      onChange={handleSelectionChange}
      placeholder={placeholder}
      isDisabled={isDisabled}
    >
      {(state) => (
        <>
          <Label className={hideLabelVisually ? 'hidden-accessibly' : ''}>
            {label}{showRequired && <span className="is-required" aria-hidden="true"> ({t('required')})</span>}
          </Label>
          {description && (
            <Text slot="description" className="help">
              {description}</Text>
          )}
          <Button
            className='react-aria-Button selectButton'
            ref={ref}
            data-testid="select-button"
            isDisabled={isDisabled}>
            <SelectValue />
            <span
              aria-hidden="true"
              style={{
                transform: state.isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s'
              }}
            >
              <svg width="10" height="5" viewBox="0 0 10 5" fillRule="evenodd">
                <title>Open drop down</title>
                <path d="M10 0L5 5 0 0z"></path>
              </svg>
            </span>
          </Button>

          {errorMessage && <FieldError className='error-message'>{errorMessage}</FieldError>}
          {helpMessage && (
            <Text slot="description" className='help-text'>
              {helpMessage}
            </Text>
          )}
          <Popover>
            <ListBox items={items}>
              {(item) => (
                <ListBoxItem key={item.id as React.Key}>{item.name}</ListBoxItem>
              )}
            </ListBox>
          </Popover>
        </>
      )}
    </Select >
  );
});

FormSelect.displayName = 'FormSelect';
