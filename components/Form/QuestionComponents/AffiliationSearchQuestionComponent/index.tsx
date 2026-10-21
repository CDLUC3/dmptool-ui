import React from 'react';
import { useTranslations } from 'next-intl';
import { FormInput } from '@/components/Form';
import { TypeAheadWithOther, useAffiliationSearch } from '@/components/Form/TypeAheadWithOther';
import { AffiliationSearchQuestionProps } from '@/app/types';


const AffiliationSearchQuestionComponent: React.FC<AffiliationSearchQuestionProps> = ({
  parsedQuestion,
  affiliationData,
  otherAffiliationName = '',
  otherField = false,
  isDisabled = false,
  setOtherField,
  handleAffiliationChange,
  handleOtherAffiliationChange
}) => {
  const t = useTranslations('AffiliationSearchQuestion');
  const { suggestions, handleSearch, isSearching, searchError } = useAffiliationSearch();

  return (
    <>
      <TypeAheadWithOther
        label={parsedQuestion?.attributes?.label || t('label')}
        fieldName="institution"
        setOtherField={setOtherField}
        isRequired={true}
        error={searchError ?? ''}
        helpText={parsedQuestion?.attributes?.help || t('helpText')}
        updateFormData={handleAffiliationChange}
        value={affiliationData?.affiliationName || ''}
        suggestions={suggestions}
        onSearch={handleSearch}
        isDisabled={isDisabled}
        isLoading={isSearching}
      />
      {otherField && (
        <div className="form-row">
          <FormInput
            name="otherAffiliationName"
            type="text"
            label={t('otherLabel')}
            placeholder={t('otherPlaceholder')}
            value={otherAffiliationName}
            onChange={handleOtherAffiliationChange}
          />
        </div >
      )
      }
    </>
  )
};

export default AffiliationSearchQuestionComponent;
