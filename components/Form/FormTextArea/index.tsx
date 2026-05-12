'use client';

import React from 'react'; // Import useCallback
import { useTranslations } from "next-intl";
import {
  FieldError,
  Label,
  Text,
  TextArea,
  TextField,
} from "react-aria-components";
import TinyMCEEditor from '@/components/TinyMCEEditor';

interface FormTextInputAreaProps {
  name: string;
  label: string;
  description?: string;
  placeholder?: string;
  value?: string;

  // Unified onChange handler - always receives the new string value
  onChange?: (newValue: string) => void;

  className?: string; // Wrapper class
  labelClasses?: string;
  textAreaClasses?: string;
  editorWrapperClasses?: string;

  disabled?: boolean;
  isRequired?: boolean;
  isRequiredVisualOnly?: boolean;
  isInvalid?: boolean;
  errorMessage?: string;
  helpMessage?: string | React.ReactNode;

  // If true, render TinyMCEEditor; otherwise, render TextArea
  richText?: boolean;
}

const FormTextInputArea: React.FC<FormTextInputAreaProps> = ({
  name,
  label,
  description,
  placeholder,
  value = '',
  onChange, // This prop now expects (newValue: string) => void
  className = '',
  labelClasses = '',
  textAreaClasses = '',
  editorWrapperClasses = '',
  disabled = false,
  isRequired = false,
  isRequiredVisualOnly = false,
  isInvalid = false,
  errorMessage = '',
  helpMessage = '',
  richText = false,
}) => {
  const showRequired = isRequired || isRequiredVisualOnly;
  const t = useTranslations('Global.labels');
  const sanitizeId = (id: string) => id.replace(/[^a-zA-Z0-9-_]/g, ''); // Remove invalid characters

  // Generate unique ID for accessibility. SanitizeId removes invalid characters that cannot be used with
  // TinyMCEEEditor's use of querySelectorAll
  const inputId = sanitizeId(`${name}-input-${React.useId()}`);

  // Internal handler for the standard TextArea
  // It extracts the value from the event and calls the unified onChange
  const handleTextAreaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange?.(e.currentTarget.value); // Call the parent's onChange with the string value
  };

  // The handler for the TinyMCEEditor's setContent prop
  // It directly calls the unified onChange with the new content string
  const handleEditorContentChange = (newContent: string) => {
    onChange?.(newContent); // Call the parent's onChange with the string value
  };


  return (
    <TextField
      name={name}
      className={`${className} react-aria-TextField ${isInvalid ? 'field-error' : ''} ${richText ? 'richtext-field-container' : ''}`}
      isRequired={isRequired}
      isInvalid={isInvalid}
      isDisabled={disabled}
      data-testid="field-wrapper"
    >
      <Label htmlFor={inputId} className={labelClasses}>
        {label}{showRequired && <span className="is-required" aria-hidden="true"> ({t('required')})</span>}
      </Label>

      {description && (
        <Text slot="description" className="help">
          {description}
        </Text>
      )}

      {/* --- Conditional Rendering Logic --- */}
      {richText ? (
        // Render DmpEditor
        <div className={editorWrapperClasses}>

          <TinyMCEEditor
            content={value}
            setContent={handleEditorContentChange}
            id={inputId}
            disabled={disabled}
          />

        </div>
      ) : (
        // Render standard TextArea
        <TextArea
          id={inputId}
          name={name}
          className={textAreaClasses}
          placeholder={placeholder}
          onChange={handleTextAreaChange}
          value={value}
          disabled={disabled}
          aria-describedby={helpMessage ? `${inputId}-help` : undefined}
          aria-required={isRequired}
        />
      )}

      {/* Error Message */}
      {isInvalid && errorMessage && (
        <FieldError className='error-message'>{errorMessage}</FieldError>
      )}

      {/* Help Message */}
      {helpMessage && !isInvalid && (
        <Text slot="description" id={`${inputId}-help`} className='help-text'>
          {helpMessage}
        </Text>
      )}

    </TextField>
  );
};

export default FormTextInputArea;
