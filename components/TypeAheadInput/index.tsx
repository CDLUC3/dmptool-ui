'use client'

import React, { useEffect, useId, useRef, useState } from 'react';
import {
  Input,
  Label,
  Text,
  TextField,
} from "react-aria-components";
import Spinner from '@/components/Spinner';
import { SuggestionInterface } from '@/app/types';
import classNames from 'classnames';
import styles from './typeaheadInput.module.scss';


export type TypeAheadInputProps = {
  label: string;
  placeholder?: string;
  helpText?: string;
  fieldName: string;
  required: boolean;
  error?: string;
  updateFormData: (id: string, value: string) => void; //Function to update the typeahead field value in the parent form data
  value?: string;
  className?: string;
  suggestions: SuggestionInterface[];
  onSearch: (searchTerm: string) => void;
  clearOnFocus?: boolean;
  isLoading?: boolean;
}

const TypeAheadInput = ({
  label,
  placeholder,
  helpText,
  fieldName,
  required,
  error,
  updateFormData,
  value,
  className,
  suggestions,
  onSearch,
  clearOnFocus = false,
  isLoading = false,
}: TypeAheadInputProps) => {
  const baseId = useId();
  const listboxId = `${baseId}-results`;
  const optionId = (index: number) => `${baseId}-option-${index}`;

  const [inputValue, setInputValue] = useState<string>(value ?? "");
  const [currentListItemFocused, setCurrentListItemFocused] = useState(-1);
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLUListElement | null>(null);
  const listItemRefs = useRef<(HTMLLIElement | null)[]>([]);

  const activeDescendentId = currentListItemFocused >= 0 ? optionId(currentListItemFocused) : undefined;

  const handleUpdate = (e: React.ChangeEvent<HTMLInputElement>) => {
    setOpen(true);
    setCurrentListItemFocused(-1);
    const value = e.target.value;
    const dataId = (e.target as HTMLElement).dataset.id || '';

    setInputValue(value);
    updateFormData(dataId, value);

    if (onSearch) {
      onSearch(value);
    }
  };

  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setOpen(true);
    if (clearOnFocus) {
      setInputValue('');
      updateFormData('', '');
      return;
    }

    const end = e.currentTarget.value.length;
    e.currentTarget.setSelectionRange(end, end);
  }

  const selectOption = (li: HTMLLIElement) => {
    setOpen(false);
    const item = (li.textContent ?? '').trim();

    const dataId = li.dataset.id || '';

    updateFormData(dataId, item);

    setInputValue(item);
    setCurrentListItemFocused(-1);

    inputRef.current?.focus();
  }

  const handleSelection = (e: React.MouseEvent<HTMLLIElement>) => {
    const li = (e.target as HTMLElement).closest('li');
    if (li) {
      selectOption(li);
    }
  }

  const highlightListItem = (index: number) => {
    setCurrentListItemFocused(index);
    listItemRefs.current[index]?.scrollIntoView({ block: 'nearest' });
  };

  const handleKeyboardEvents = (e: React.KeyboardEvent<HTMLElement>) => {
    const optionCount = listRef.current ? listRef.current.childNodes.length : 0;

    if (["ArrowUp", "ArrowDown", "Enter"].includes(e.key)) {
      e.preventDefault();
    }

    switch (e.key) {
      case "ArrowDown":
        if (currentListItemFocused < optionCount - 1) {
          highlightListItem(currentListItemFocused + 1);
        }
        break;

      case "ArrowUp":
        if (currentListItemFocused > 0) {
          highlightListItem(currentListItemFocused - 1);
        } else {
          setCurrentListItemFocused(-1);
        }
        break;

      case 'Enter': {
        const li = listItemRefs.current[currentListItemFocused];
        if (currentListItemFocused !== -1 && li) {
          selectOption(li);
        }
        break;
      }

      case 'Escape':
        setOpen(false);
        setCurrentListItemFocused(-1);
        break;
    }
  }

  useEffect(() => {
    if (onSearch) {
      onSearch(inputValue);
    }
  }, [inputValue]);

  useEffect(() => {
    // Function to handle click outside the input and list
    const handleClickOutside = (e: MouseEvent) => {
      if (
        inputRef.current &&
        !inputRef.current.contains(e.target as Node) &&
        listRef.current &&
        !listRef.current.contains(e.target as Node)
      ) {
        setOpen(false); // Hide the list
        setCurrentListItemFocused(-1); //Reset so that next search doesn't start with focus on the wrong option
      }
    };

    // Attach the event listener when component mounts
    document.addEventListener('click', handleClickOutside);

    // Cleanup: remove event listener when component unmounts
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);


  return (
    <div className={`${styles.autocompleteContainer} ${styles.expanded} ${className} form-row`} aria-expanded={open} role="combobox" aria-controls={listboxId}>
      <TextField
        type="text"
        data-testid="typeaheadWithOther"
        className={(!!error) ? styles.fieldError : ''}
        isInvalid={!!error}
        isRequired={required}
      >
        <Label>{label}</Label>
        <Input
          name={fieldName}
          type="text"
          value={inputValue}
          role="textbox"
          aria-controls={listboxId}
          aria-activedescendant={activeDescendentId}
          className={classNames('react-aria-Input', styles.searchInput)}
          onChange={handleUpdate}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyboardEvents}
          placeholder={placeholder ? placeholder : 'Type to search...'}
          ref={inputRef}
          autoComplete="off"
        />
        {(helpText && !error) && (
          <Text slot="description" className={styles.helpText}>
            {helpText}
          </Text>
        )}
        {error && (
          <Text slot="description" className={styles.errorMessage}>
            {error}
          </Text>
        )}
        <Spinner className={`${styles.searchSpinner} ${isLoading ? styles.show : ''}`}
          isActive={isLoading} />

        {/*Visually hidden element for screen readers */}
        <div
          aria-live="polite"
          className="hidden-accessibly">
          {isLoading
            ? "Loading..."
            : open
              ? (suggestions && suggestions.length > 0
                ? `${suggestions.length} suggestions available.`
                : "No results found.")
              : ""}
        </div>

        <div
          className={`${styles.autocompleteDropdownArrow} ${open ? styles.expanded : ""}`}
          onClick={e => e.preventDefault()}
          tabIndex={-1}
          aria-hidden="true"
        >
          <svg width="10" height="5" viewBox="0 0 10 5" fillRule="evenodd">
            <title>Open drop down</title>
            <path d="M10 0L5 5 0 0z"></path>
          </svg>
        </div>
      </TextField>

      <ul
        className={`${styles.autocompleteResults} ${open ? styles.visible : ''}`}
        ref={listRef}
        id={listboxId}
        role="listbox"
      >
        {suggestions && suggestions.length > 0 && (
          <>

            {suggestions?.map((suggestion, index) => {
              if (suggestion.displayName !== '') {
                return (
                  <li
                    key={index}
                    className={styles.autocompleteItem}
                    id={optionId(index)}
                    role='option'
                    aria-selected={currentListItemFocused === index}
                    data-id={suggestion?.uri}
                    onClick={handleSelection}
                    ref={(el) => {
                      listItemRefs.current[index] = el;
                    }}
                  >{suggestion.displayName}</li>
                )
              }
            })}
          </>
        )}
      </ul>
    </div>
  );
};

export default TypeAheadInput;
