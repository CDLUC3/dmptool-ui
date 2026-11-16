import React from 'react';
import { CheckboxesQuestionType } from '@dmptool/types';
import { CheckboxGroupComponent } from '@/components/Form';
import { Checkbox } from "react-aria-components";

interface CheckboxesQuestionProps {
  parsedQuestion: CheckboxesQuestionType;
  selectedCheckboxValues: string[];
  name?: string;
  isDisabled?: boolean;
  handleCheckboxGroupChange: (values: string[]) => void;
}

const CheckboxesQuestionComponent: React.FC<CheckboxesQuestionProps> = ({
  parsedQuestion,
  selectedCheckboxValues,
  name = "checkboxes",
  isDisabled = false,
  handleCheckboxGroupChange
}) => {
  const checkboxData = parsedQuestion.options?.map((opt: CheckboxesQuestionType['options'][number]) => ({
    label: opt.label,
    value: opt.value,
  }));
  const initialChecked = parsedQuestion.options
    ?.filter((opt: CheckboxesQuestionType['options'][number]) => opt.selected)
    .map((opt: CheckboxesQuestionType['options'][number]) => opt.value);
  const value = selectedCheckboxValues.length > 0 ? selectedCheckboxValues : initialChecked;

  return (
    <CheckboxGroupComponent
      name={name}
      value={value}
      onChange={handleCheckboxGroupChange}
      checkboxGroupLabel=""
      checkboxGroupDescription={""}
      isDisabled={isDisabled}
    >
      {checkboxData.map((checkbox, index) => (
        <div key={index}>
          <Checkbox value={checkbox.value} aria-label="checkbox">
            <div className="checkbox">
              <svg viewBox="0 0 18 18" aria-hidden="true">
                <polyline points="1 9 7 14 15 4" />
              </svg>
            </div>
            <div className="">
              <span>
                {checkbox.label}
              </span>
            </div>
          </Checkbox>
        </div>
      ))}
    </CheckboxGroupComponent>
  );
};

export default CheckboxesQuestionComponent;