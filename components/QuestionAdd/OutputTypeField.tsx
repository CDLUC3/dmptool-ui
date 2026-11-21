import { useTranslations } from 'next-intl';
import { FormInput, FormSelect } from '@/components/Form';
import {
  OutputTypeFieldConfigProps,
  OutputTypeInterface,
} from '@/app/types';
import { DefaultResearchOutputTypesQuery } from '@/generated/graphql';

import {
  Button,
  Dialog,
  DialogTrigger,
  ListBoxItem,
  OverlayArrow,
  Popover,
} from "react-aria-components";
import { DmpIcon } from "@/components/Icons";

import styles from './questionAdd.module.scss';

interface OutputTypeFieldProps extends OutputTypeFieldConfigProps {
  defaultResearchOutputTypesData?: DefaultResearchOutputTypesQuery;
}

const OutputTypeField = ({
  field,
  defaultResearchOutputTypesData,
  newOutputType,
  setNewOutputType,
  onModeChange,
  onAddCustomType,
  onRemoveCustomType,
}: OutputTypeFieldProps) => {
  const QuestionAdd = useTranslations('QuestionAdd');


  const outputTypeOptions = [
    { id: 'defaults', name: QuestionAdd('researchOutput.labels.useDefaults') },
    { id: 'mine', name: QuestionAdd('researchOutput.labels.useCustomList') },
  ];
  // Transform backend data to match the display format
  const defaultOutputTypes = defaultResearchOutputTypesData?.defaultResearchOutputTypes
    ?.filter((item): item is NonNullable<typeof item> => item !== null)
    .map(item => ({
      id: item.name,
      type: item.name,
      description: item.description || ''
    })) || [];
  return (
    <div className={styles.typeConfig}>
      <div className={styles.typeModeSelector}>
        <FormSelect
          label={QuestionAdd('researchOutput.outputType.labels.defineOutputTypes')}
          ariaLabel={QuestionAdd('researchOutput.outputType.labels.defineOutputTypes')}
          isRequired={false}
          name="status"
          items={outputTypeOptions}
          onChange={(value) =>
            onModeChange(value as 'defaults' | 'mine')
          }
          selectedKey={field.outputTypeConfig?.mode || 'defaults'}
        >
          {(item) => <ListBoxItem key={item.id}>{item.name}</ListBoxItem>}
        </FormSelect>
      </div>

      {/* USE DEFAULTS MODE */}
      {field.outputTypeConfig?.mode === 'defaults' && (
        <div className={styles.defaultTypes}>
          <fieldset>
            <legend>{QuestionAdd('researchOutput.outputType.legends.default')}</legend>
            <ul className={`${styles.typesList} ${styles.bulletList}`} role="list">
              {defaultOutputTypes.map((outputType) => (
                <li key={outputType.id} className={styles.typeItem}>
                  <span id={`output-type-${outputType.id}`}>{outputType.type}</span>
                  <DialogTrigger>
                    <Button
                      className="popover-btn"
                      aria-label={QuestionAdd('labels.clickForMoreInfo')}
                      aria-describedby={`output-type-${outputType.id}`}
                    >
                      <div className="icon info"><DmpIcon icon="info" /></div>
                    </Button>
                    <Popover placement="top" className="dynamic-popover-width react-aria-Popover">
                      <OverlayArrow>
                        <svg width={12} height={12} viewBox="0 0 12 12" aria-hidden="true">
                          <path d="M0 0 L6 6 L12 0" />
                        </svg>
                      </OverlayArrow>
                      <Dialog aria-label={QuestionAdd('labels.typeDescription', { type: outputType.type })}>
                        <div className="flex-col">
                          {outputType.description}
                        </div>
                      </Dialog>
                    </Popover>
                  </DialogTrigger>
                </li>
              ))}
            </ul>
          </fieldset>
        </div>
      )}

      {/* USE MINE MODE */}
      {field.outputTypeConfig?.mode === 'mine' && (
        <div className={styles.customTypes}>
          <fieldset>
            <legend>{QuestionAdd('researchOutput.outputType.legends.myOutputs')}</legend>
            <div role="form" aria-label={QuestionAdd('labels.addCustomOutputType')}>
              <FormInput
                name="custom_types_add"
                type="text"
                isRequired={false}
                label={QuestionAdd('researchOutput.outputType.labels.enterOutputType')}
                className={styles.typeWrapper}
                value={newOutputType.type}
                onChange={(e) => setNewOutputType({ ...newOutputType, type: e.target.value })}
                aria-label={QuestionAdd('researchOutput.outputType.labels.enterOutputType')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    onAddCustomType();
                  }
                }}
              />
              {/*There is currently no way to save description for the outputType in dmptool-types. We have a ticket to update that*/}
              <FormInput
                name="custom_types_description"
                type="text"
                isRequired={false}
                label={QuestionAdd('researchOutput.outputType.labels.typeDescription')}
                className={styles.typeWrapper}
                value={newOutputType.description}
                onChange={(e) => setNewOutputType({ ...newOutputType, description: e.target.value })}
                aria-label={QuestionAdd('researchOutput.outputType.labels.typeDescription')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    onAddCustomType();
                  }
                }}
              />
              <Button
                type="button"
                onPress={onAddCustomType}
                isDisabled={!newOutputType?.type?.trim()}
                aria-label={QuestionAdd('researchOutput.outputType.buttons.addOutputType')}
              >
                {QuestionAdd('researchOutput.outputType.buttons.addOutputType')}
              </Button>
            </div>

            {field.outputTypeConfig?.customTypes?.length > 0 && (
              <div role="region" aria-label={QuestionAdd('labels.customTypeList')}>
                <ul
                  className={`${styles.customTypesList} ${styles.deletableList}`}
                  role="list"
                  aria-live="polite"
                  aria-relevant="additions removals"
                >
                  {field.outputTypeConfig.customTypes.map((customType: OutputTypeInterface, index: number) => (
                    <li
                      key={index}
                      className={styles.customTypeItem}
                      role="listitem"
                    >
                      <div className={styles.infoWrapper}>
                        <span id={`custom-type-${index}`}>{customType.type}</span>
                        {customType.description && (
                          <DialogTrigger>
                            <Button
                              className="popover-btn"
                              aria-label={QuestionAdd('labels.clickForMoreInfo')}
                              aria-describedby={`custom-type-${index}`}
                            >
                              <div className="icon info"><DmpIcon icon="info" /></div>
                            </Button>
                            <Popover placement="top" className="dynamic-popover-width react-aria-Popover">
                              <OverlayArrow>
                                <svg width={12} height={12} viewBox="0 0 12 12" aria-hidden="true">
                                  <path d="M0 0 L6 6 L12 0" />
                                </svg>
                              </OverlayArrow>
                              <Dialog aria-label={QuestionAdd('labels.typeDescription', { type: customType.type || '' })}>
                                <div className="flex-col">
                                  {customType.description}
                                </div>
                              </Dialog>
                            </Popover>
                          </DialogTrigger>
                        )}

                      </div>
                      <Button
                        type="button"
                        className={styles.removeButton}
                        onPress={() => onRemoveCustomType(customType.type ?? '')}
                        aria-label={QuestionAdd('researchOutput.outputType.labels.removeOutputType', { type: customType.type ?? '' })}
                      >
                        <span aria-hidden="true">x</span>
                        <span className="hidden-accessibly">{QuestionAdd('buttons.removeType', { type: customType.type ?? '' })}</span>
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </fieldset>
        </div>
      )}
    </div>
  );
};

export default OutputTypeField;