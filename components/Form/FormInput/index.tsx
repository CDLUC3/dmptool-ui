import React, { useState } from 'react';
import { useTranslations } from "next-intl";
import {
  Button,
  FieldError,
  Input,
  Label,
  Text,
  TextField,
} from "react-aria-components";
import styles from './formInput.module.scss';

interface InputProps {
  name: string;
  id?: string;
  type?: string;
  label: string;
  placeholder?: string;
  description?: string;
  defaultValue?: string;
  ariaDescribedBy?: string;
  ariaLabel?: string;
  value?: string | number;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
  labelClasses?: string;
  inputClasses?: string;
  disabled?: boolean;
  isRequired?: boolean;
  isRecommended?: boolean;
  isRequiredVisualOnly?: boolean;
  isInvalid?: boolean;
  errorMessage?: string;
  helpMessage?: string | React.ReactNode;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  /** Defaults to true when type="password". */
  showPasswordToggle?: boolean;
  /** Adds field context to the password toggle aria-label. */
  passwordToggleLabel?: string;
  /** Defaults to false. */
  defaultPasswordVisible?: boolean;
}

const FormInput = React.forwardRef<HTMLInputElement, InputProps & React.InputHTMLAttributes<HTMLInputElement>>(({
  name,
  id,
  type,
  label,
  placeholder,
  description,
  defaultValue,
  ariaDescribedBy,
  ariaLabel,
  value,
  onChange,
  className = '',
  labelClasses = '',
  inputClasses = '',
  disabled = false,
  isRequired = false,
  isRequiredVisualOnly = false,
  isRecommended = false,
  isInvalid = false,
  errorMessage = '',
  helpMessage = '',
  minLength = undefined,
  maxLength = undefined,
  pattern,
  showPasswordToggle = undefined,
  passwordToggleLabel,
  defaultPasswordVisible = false,
  ...rest
}, ref) => {
  const showRequired = isRequired || isRequiredVisualOnly;
  const t = useTranslations('Global.labels');

  const isPassword = type === 'password';
  const hasPasswordToggle = isPassword && (showPasswordToggle ?? true);
  const [passwordVisible, setPasswordVisible] = useState(defaultPasswordVisible);
  const effectiveType = isPassword && passwordVisible ? 'text' : type;
  const passwordToggleAriaLabel = passwordToggleLabel
    ? t(passwordVisible ? 'hidePasswordFor' : 'showPasswordFor', { field: passwordToggleLabel })
    : t(passwordVisible ? 'hidePassword' : 'showPassword');
  const inputId = id ?? name;
  const helpTextId = `${inputId}-help`;
  const errorTextId = `${inputId}-error`;

  // Combine aria-describedby IDs for help text, error message, and any additional IDs passed in via ariaDescribedBy prop.
  // This way, input can be associated with multiple descriptive elements for accessibility.
  const describedByIds = [
    ariaDescribedBy,
    helpMessage ? helpTextId : null,
    isInvalid && errorMessage ? errorTextId : null,
  ].filter(Boolean).join(' ') || undefined;

  const inputElement = (
    <Input
      ref={ref}
      id={inputId}
      name={name}
      type={effectiveType}
      className={inputClasses}
      placeholder={placeholder}
      onChange={onChange}
      value={value}
      disabled={disabled}
      aria-describedby={describedByIds}
      aria-label={ariaLabel}
      minLength={minLength}
      maxLength={maxLength}
      pattern={pattern}
      aria-required={isRequired}
      {...rest}
    />
  );

  return (
    <>
      <TextField
        name={name}
        type={effectiveType}
        className={`${className} react-aria-TextField ${isInvalid ? 'field-error' : ''}`}
        isRequired={isRequired}
        defaultValue={defaultValue}
        isInvalid={isInvalid}
        data-testid="field-wrapper"
      >
        <Label htmlFor={inputId} className={labelClasses}>
          {label}
          {showRequired && <span className="is-required" aria-hidden="true"> ({t('required')})</span>}
          {isRecommended && <span className="is-recommended" aria-hidden="true"> ({t('recommended')})</span>}
        </Label>
        {description && (
          <Text slot="description" className="help">
            {description}
          </Text>
        )}

        {hasPasswordToggle ? (
          <div className={styles.passwordField}>
            {inputElement}
            <Button
              type="button"
              className={`${styles.passwordToggle} link react-aria-Button`}
              aria-label={passwordToggleAriaLabel}
              aria-controls={inputId}
              onPress={() => setPasswordVisible((visible) => !visible)}
              data-testid="password-toggle"
            >
              {/* title on inner span — react-aria Button strips it from the element */}
              <span
                className={styles.toggleLabel}
                title={passwordToggleAriaLabel}
              >
                <span aria-hidden={passwordVisible}>{t('show')}</span>
                <span aria-hidden={!passwordVisible}>{t('hide')}</span>
              </span>
            </Button>
            <span className="hidden-accessibly" aria-live="polite">
              {passwordVisible ? t('passwordIsVisible') : t('passwordIsHidden')}
            </span>
          </div>
        ) : (
          inputElement
        )}

        {isInvalid && <FieldError id={errorTextId} className='error-message'>{errorMessage}</FieldError>}

        {helpMessage && (
          <Text id={helpTextId} slot="description" className='help-text'>
            {helpMessage}
          </Text>
        )}
        <FieldError />
      </TextField>
    </>
  );
});

FormInput.displayName = 'FormInput';
export default FormInput;
