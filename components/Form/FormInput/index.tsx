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
  defaultPasswordVisible = false,
  ...rest
}, ref) => {
  const showRequired = isRequired || isRequiredVisualOnly;
  const t = useTranslations('Global.labels');

  const isPassword = type === 'password';
  const hasPasswordToggle = isPassword && (showPasswordToggle ?? true);
  const [passwordVisible, setPasswordVisible] = useState(defaultPasswordVisible);
  const effectiveType = isPassword && passwordVisible ? 'text' : type;

  const inputElement = (
    <Input
      ref={ref}
      id={id}
      name={name}
      type={effectiveType}
      className={inputClasses}
      placeholder={placeholder}
      onChange={onChange}
      value={value}
      disabled={disabled}
      aria-describedby={ariaDescribedBy}
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
        <Label htmlFor={id} className={labelClasses}>
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
              aria-label={passwordVisible ? t('hidePassword') : t('showPassword')}
              onPress={() => setPasswordVisible((visible) => !visible)}
              data-testid="password-toggle"
            >
              {/* title on inner span — react-aria Button strips it from the element */}
              <span
                className={styles.toggleLabel}
                title={passwordVisible ? t('hidePassword') : t('showPassword')}
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

        {isInvalid && <FieldError className='error-message'>{errorMessage}</FieldError>}

        {helpMessage && (
          <Text slot="description" className='help-text'>
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
