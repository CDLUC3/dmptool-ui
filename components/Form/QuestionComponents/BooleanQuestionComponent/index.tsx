import React from 'react';
import { BooleanQuestionType } from '@dmptool/types';
import { useTranslations } from 'next-intl';
import { RadioGroupComponent } from '@/components/Form';
import { Radio } from 'react-aria-components';

interface BooleanQuestionProps {
  parsedQuestion: BooleanQuestionType;
  selectedValue?: string;
  name?: string;
  isDisabled?: boolean;
  handleRadioChange: (value: string) => void;
}

const BooleanQuestionComponent: React.FC<BooleanQuestionProps> = ({
  parsedQuestion,
  selectedValue,
  name = 'visibility',
  isDisabled = false,
  handleRadioChange
}) => {
  // Localization keys
  const Global = useTranslations('Global');

  // Set checked value based on parsedQuestion.attributes.value
  const initialChecked = parsedQuestion?.attributes?.value ? 'yes' : 'no';

  const value = selectedValue ?? initialChecked;

  return (

    <RadioGroupComponent
      name={name}
      value={value}
      radioGroupLabel=""
      onChange={handleRadioChange}
      isDisabled={isDisabled}
    >
      <div>
        <Radio value="yes">{Global('form.yesLabel')}</Radio>
      </div>

      <div>
        <Radio value="no">{Global('form.noLabel')}</Radio>
      </div>

    </RadioGroupComponent>
  );
};

export default BooleanQuestionComponent;