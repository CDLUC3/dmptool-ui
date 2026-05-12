'use client'

import { Button, Checkbox } from "react-aria-components";
import { useTranslations } from 'next-intl';
import { FormInput } from '@/components/Form';
import RepositorySelectionSystem from '@/components/QuestionAdd/ReposSelector';
import MetaDataStandards from '@/components/QuestionAdd/MetaDataStandards';
import OutputTypeField from '@/components/QuestionAdd/OutputTypeField';
import LicenseField from '@/components/QuestionAdd/LicenseField';
import InitialAccessLevel from '@/components/QuestionAdd/InitialAccessLevel';
import {
  StandardField,
  OutputTypeInterface,
  RepositoryInterface,
  MetaDataStandardInterface,
  MetaDataConfig,
  AdditionalFieldsType
} from '@/app/types';
import { DefaultResearchOutputTypesQuery, LicensesQuery } from '@/generated/graphql';
import styles from './researchOutput.module.scss';

interface ResearchOutputComponentProps {
  standardFields: StandardField[];
  additionalFields: AdditionalFieldsType[];
  expandedFields: string[];
  nonCustomizableFieldIds: string[];
  newOutputType: OutputTypeInterface;
  setNewOutputType: React.Dispatch<React.SetStateAction<OutputTypeInterface>>;
  newLicenseType: string;
  setNewLicenseType: React.Dispatch<React.SetStateAction<string>>;
  defaultResearchOutputTypesData?: DefaultResearchOutputTypesQuery;
  licensesData?: LicensesQuery;
  onStandardFieldChange: (fieldId: string, enabled: boolean) => void;
  onCustomizeField: (fieldId: string) => void;
  onUpdateStandardFieldProperty: (fieldId: string, propertyName: string, value: unknown) => void;
  onTogglePreferredRepositories: (hasCustomRepos: boolean) => void;
  onRepositoriesChange: (repos: RepositoryInterface[]) => void;
  onToggleMetaDataStandards: (hasCustomStandards: boolean) => void;
  onMetaDataStandardsChange: (standards: MetaDataStandardInterface[]) => void;
  onOutputTypeModeChange: (mode: 'defaults' | 'mine') => void;
  onAddCustomOutputType: () => void;
  onRemoveCustomOutputType: (type: string) => void;
  onLicenseModeChange: (mode: 'defaults' | 'addToDefaults') => void;
  onAddCustomLicenseType: () => void;
  onRemoveCustomLicenseType: (type: string) => void;
  onDeleteAdditionalField: (fieldId: string) => void;
  onUpdateAdditionalField: (fieldId: string, propertyName: string, value: unknown) => void;
  onAddAdditionalField: () => void;
}

// Type guard function to check if a field has metaDataConfig
const hasMetaDataConfig = (field: StandardField): field is StandardField & { metaDataConfig: MetaDataConfig } => {
  return field.metaDataConfig !== undefined;
};

const ResearchOutputComponent: React.FC<ResearchOutputComponentProps> = ({
  standardFields,
  additionalFields,
  expandedFields,
  nonCustomizableFieldIds,
  newOutputType,
  setNewOutputType,
  newLicenseType,
  setNewLicenseType,
  defaultResearchOutputTypesData,
  licensesData,
  onStandardFieldChange,
  onCustomizeField,
  onUpdateStandardFieldProperty,
  onTogglePreferredRepositories,
  onRepositoriesChange,
  onToggleMetaDataStandards,
  onMetaDataStandardsChange,
  onOutputTypeModeChange,
  onAddCustomOutputType,
  onRemoveCustomOutputType,
  onLicenseModeChange,
  onAddCustomLicenseType,
  onRemoveCustomLicenseType,
  onDeleteAdditionalField,
  onUpdateAdditionalField,
  onAddAdditionalField
}) => {
  const Global = useTranslations('Global');
  const QuestionAdd = useTranslations('QuestionAdd');

  return (
    <>
      <div className={styles.fieldsContainer}>
        <h3>{QuestionAdd('researchOutput.headings.enableStandardFields')}</h3>

        <p className={styles.fieldsDescription}>
          {QuestionAdd('researchOutput.description')}
        </p>
        <div className={styles.fieldsList}>
          {standardFields.map((field) => {
            // Required fields will always have their checkbox checked and disabled to 
            // prevent changes, and a tooltip explaining why it's disabled
            const isDisabled = field.required;
            const tooltipId = `tooltip-${field.id}`;

            return (
              <div key={field.id} className={styles.fieldRowWrapper}>
                <div className={styles.fieldRow}>
                  <div className={isDisabled ? styles.tooltipWrapper : undefined}>

                    <Checkbox
                      isSelected={field.enabled}
                      isDisabled={isDisabled}
                      data-testid={`checkbox-${field.id}`}
                      aria-describedby={isDisabled ? tooltipId : undefined}
                      className={
                        `react-aria-Checkbox ${(field.required)
                          ? styles.disabledCheckbox
                          : ''
                        }`
                      }

                      onChange={(isSelected) => onStandardFieldChange(field.id, isSelected)}
                    >
                      <div className="checkbox">
                        <svg viewBox="0 0 18 18" aria-hidden="true">
                          <polyline points="1 9 7 14 15 4" />
                        </svg>
                      </div>
                      <span>{field.label}</span>
                    </Checkbox>
                    {isDisabled && <span id={tooltipId} className={styles.tooltipText}>{QuestionAdd('researchOutput.tooltip.requiredFields')}</span>}
                  </div>
                  {field.id !== 'title' && (
                    <Button
                      type="button"
                      className={`buttonLink link`}
                      aria-expanded={expandedFields.includes(field.id)}
                      aria-controls={`panel-${field.id}`}
                      onPress={() => onCustomizeField(field.id)}
                    >
                      {expandedFields.includes(field.id)
                        ? Global('buttons.close')
                        : nonCustomizableFieldIds.includes(field.id)
                          ? Global('links.expand')
                          : Global('buttons.customize')}
                    </Button>
                  )}

                </div>

                {/* Expanded panel OUTSIDE the .fieldRow flex container */}
                {expandedFields.includes(field.id) && (
                  <div id={`panel-${field.id}`} className={styles.fieldPanel}>
                    {/** Description */}
                    {field.id === 'description' && (
                      <FormInput
                        name="descriptionHelpText"
                        type="text"
                        isRequired={false}
                        label={QuestionAdd('labels.helpText', { fieldName: QuestionAdd('researchOutput.labels.description') })}
                        value={field.helpText || ''}
                        onChange={(e) => onUpdateStandardFieldProperty('description', 'helpText', e.currentTarget.value)}
                        helpMessage={QuestionAdd('researchOutput.helpText')}
                        maxLength={300}
                      />
                    )}

                    {/** Data Flags Configuration */}
                    {field.id === 'dataFlags' && field.content && field.content.type === 'checkBoxes' && (
                      <div style={{ marginBottom: '1.5rem' }}>
                        <fieldset>
                          <legend>{QuestionAdd('researchOutput.legends.dataFlag')}</legend>
                          <div className={styles.dataFlagsConfig}>
                            {field.content.options.map((option, index) => (
                              <div key={`${option.value}-${index}`} style={{ marginBottom: '0.5rem' }}>
                                <Checkbox
                                  isSelected={option.selected}
                                  onChange={(isSelected) => {
                                    if (field.content?.type === 'checkBoxes') {
                                      const updatedOptions = [...field.content.options];
                                      updatedOptions[index] = { ...option, selected: isSelected };
                                      onUpdateStandardFieldProperty('dataFlags', 'content', {
                                        ...field.content,
                                        options: updatedOptions
                                      });
                                    }
                                  }}
                                >
                                  <div className="checkbox">
                                    <svg viewBox="0 0 18 18" aria-hidden="true">
                                      <polyline points="1 9 7 14 15 4" />
                                    </svg>
                                  </div>
                                  <span>{option.label}</span>
                                </Checkbox>
                              </div>
                            ))}
                          </div>
                        </fieldset>
                      </div>
                    )}


                    {/** Output Type Configuration */}
                    {field.id === 'outputType' && (
                      <>
                        <OutputTypeField
                          field={field}
                          defaultResearchOutputTypesData={defaultResearchOutputTypesData}
                          newOutputType={newOutputType}
                          setNewOutputType={setNewOutputType}
                          onModeChange={onOutputTypeModeChange}
                          onAddCustomType={onAddCustomOutputType}
                          onRemoveCustomType={onRemoveCustomOutputType}
                        />
                        <FormInput
                          name="outputTypeHelpText"
                          type="text"
                          isRequired={false}
                          label={QuestionAdd('labels.helpText', { fieldName: field.label })}
                          value={field.helpText || ''}
                          onChange={(e) => onUpdateStandardFieldProperty('outputType', 'helpText', e.currentTarget.value)}
                          helpMessage={QuestionAdd('researchOutput.helpText')}
                          maxLength={300}
                        />
                      </>
                    )}

                    {/** Repository Selector */}
                    {field.id === 'repoSelector' && (
                      <>
                        <RepositorySelectionSystem
                          field={field}
                          handleTogglePreferredRepositories={onTogglePreferredRepositories}
                          onRepositoriesChange={onRepositoriesChange}
                        />

                        <FormInput
                          name="repositoriesHelpText"
                          type="text"
                          isRequired={false}
                          label={QuestionAdd('labels.helpText', { fieldName: field.label })}
                          value={field.helpText || ''}
                          onChange={(e) => onUpdateStandardFieldProperty('repoSelector', 'helpText', e.currentTarget.value)}
                          helpMessage={QuestionAdd('researchOutput.helpText')}
                          maxLength={300}
                        />
                      </>
                    )}

                    {/** Metadata Standards */}
                    {field.id === 'metadataStandards' && hasMetaDataConfig(field) && (
                      <>
                        <MetaDataStandards
                          field={field}
                          handleToggleMetaDataStandards={onToggleMetaDataStandards}
                          onMetaDataStandardsChange={onMetaDataStandardsChange}
                        />

                        <FormInput
                          name="metadataStandardsHelpText"
                          type="text"
                          isRequired={false}
                          label={QuestionAdd('labels.helpText', { fieldName: field.label })}
                          value={field.helpText || ''}
                          onChange={(e) => onUpdateStandardFieldProperty('metadataStandards', 'helpText', e.currentTarget.value)}
                          helpMessage={QuestionAdd('researchOutput.helpText')}
                          maxLength={300}
                        />
                      </>
                    )}

                    {/**License configurations */}
                    {field.id === 'licenses' && (
                      <>
                        <LicenseField
                          field={field}
                          licensesData={licensesData}
                          newLicenseType={newLicenseType}
                          setNewLicenseType={setNewLicenseType}
                          onModeChange={onLicenseModeChange}
                          onAddCustomType={onAddCustomLicenseType}
                          onRemoveCustomType={onRemoveCustomLicenseType}
                        />
                        <FormInput
                          name="licensesHelpText"
                          type="text"
                          isRequired={false}
                          label={QuestionAdd('labels.helpText', { fieldName: field.label })}
                          value={field.helpText || ''}
                          onChange={(e) => onUpdateStandardFieldProperty('licenses', 'helpText', e.currentTarget.value)}
                          helpMessage={QuestionAdd('researchOutput.helpText')}
                          maxLength={300}
                        />
                      </>
                    )}

                    {/**Access level configurations */}
                    {field.id === 'accessLevels' && (
                      <>
                        <InitialAccessLevel
                          field={field}
                        />

                        <FormInput
                          name="accessLevelsHelpText"
                          type="text"
                          isRequired={false}
                          label={QuestionAdd('labels.helpText', { fieldName: field.label })}
                          value={field.helpText || ''}
                          onChange={(e) => onUpdateStandardFieldProperty('accessLevels', 'helpText', e.currentTarget.value)}
                          helpMessage={QuestionAdd('researchOutput.helpText')}
                          maxLength={300}
                        />
                      </>
                    )}
                  </div>
                )}

              </div>
            );
          })}
        </div>

        <div className={styles.fieldsContainer}>
          <h3>{QuestionAdd('researchOutput.headings.additionalTextFields')}</h3>
          <div className={styles.fieldsList}>
            {additionalFields.map((field) => {

              return (
                <div key={field.id} className={styles.fieldRowWrapper}>
                  <div className={styles.fieldRow}>
                    <Checkbox
                      isSelected={field.enabled}
                      onChange={(isSelected) => onUpdateAdditionalField(field.id, 'enabled', isSelected)}
                    >
                      <div className="checkbox">
                        <svg viewBox="0 0 18 18" aria-hidden="true">
                          <polyline points="1 9 7 14 15 4" />
                        </svg>
                      </div>
                      <span>{field.heading}</span>
                    </Checkbox>
                    <div className={styles.fieldActions}>
                      <Button
                        type="button"
                        className={`buttonLink link`}
                        aria-expanded={expandedFields.includes(field.id)}
                        aria-controls={`panel-${field.id}`}
                        onPress={() => onCustomizeField(field.id)}
                      >
                        {expandedFields.includes(field.id) ? Global('buttons.close') : Global('buttons.customize')}
                      </Button>

                      <Button
                        type="button"
                        className={`buttonLink link ${styles.deleteButton}`}
                        onPress={() => onDeleteAdditionalField(field.id)}
                        aria-label={Global('buttons.delete', { item: field.heading })}
                      >
                        {Global('buttons.delete')}
                      </Button>

                    </div>
                  </div>

                  {/* Expanded panel for Additional Custom Fields */}
                  {expandedFields.includes(field.id) && (
                    <div id={`panel-${field.id}`} className={styles.customizePanel}>
                      <div className={styles.fieldCustomization}>
                        {/* Field Label */}
                        <FormInput
                          name={`${field.id}_label`}
                          type="text"
                          id={`${field.id}_label`}
                          isRequired={false}
                          label={QuestionAdd('researchOutput.additionalFields.fieldLabel.label')}
                          value={field.heading}
                          onChange={(e) => onUpdateAdditionalField(field.id, 'customLabel', e.currentTarget.value)}
                          helpMessage={QuestionAdd('researchOutput.additionalFields.fieldLabel.helpText')}
                        />

                        {/* Help Text */}
                        <FormInput
                          name={`${field.id}_help`}
                          isRequired={false}
                          label={QuestionAdd('labels.helpText', { fieldName: field.heading })}
                          value={field.content?.attributes?.help || ''}
                          onChange={(e) => onUpdateAdditionalField(field.id, 'helpText', e.currentTarget.value)}
                          helpMessage={QuestionAdd('researchOutput.helpText')}
                          maxLength={300}
                        />

                        {/* Max Length for text field */}
                        <FormInput
                          name={`${field.id}_maxLength`}
                          type="number"
                          isRequired={false}
                          label={QuestionAdd('researchOutput.additionalFields.maxLength.label')}
                          value={field.content?.attributes?.maxLength?.toString() || ''}
                          onChange={(e) => onUpdateAdditionalField(field.id, 'maxLength', e.currentTarget.value)}
                          helpMessage={QuestionAdd('researchOutput.additionalFields.maxLength.helpText')}
                        />

                        {/* Default Value for the custom field */}
                        <FormInput
                          name={`${field.id}_defaultValue`}
                          isRequired={false}
                          label={QuestionAdd('researchOutput.additionalFields.defaultValue.label')}
                          value={field.content?.attributes?.defaultValue || ''}
                          onChange={(e) => onUpdateAdditionalField(field.id, 'defaultValue', e.currentTarget.value)}
                          helpMessage={QuestionAdd('researchOutput.additionalFields.defaultValue.helpText')}
                          maxLength={300}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            <div className={styles.additionalFieldsContainer}>
              <Button
                type="button"
                className={styles.addFieldButton}
                onPress={onAddAdditionalField}
              >
                + {QuestionAdd('researchOutput.additionalFields.addFieldBtn')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ResearchOutputComponent;
