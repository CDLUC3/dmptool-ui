import { useTranslations } from 'next-intl';
import {
  Button,
  Dialog,
  DialogTrigger,
  OverlayArrow,
  Popover,
} from "react-aria-components";

import {
  AccessLevelsFieldProps,
} from '@/app/types';

import { DmpIcon } from "@/components/Icons";
import { defaultAccessLevels } from '@/utils/researchOutputTable';
import styles from './questionAdd.module.scss';


const InitialAccessLevelField = ({
  field,
}: AccessLevelsFieldProps) => {
  const QuestionAdd = useTranslations('QuestionAdd');
  return (
    <div className={styles.typeConfig}>
      {field.accessLevelsConfig?.mode === 'defaults' && (
        <div className={styles.defaultTypes}>
          <fieldset>
            <legend>{QuestionAdd('researchOutput.accessLevels.legends.default')}</legend>
            <ul className={`${styles.typesList} ${styles.bulletList}`} role="list">
              {defaultAccessLevels.map((accessLevel, index) => {
                const accessLevelValue = accessLevel.value.toUpperCase().replace(/ /g, '');
                const accessLevelDescription = QuestionAdd('researchOutput.accessLevelDescription' + accessLevelValue);
                return (
                  <li key={accessLevel.value || index} className={styles.typeItem}>
                    <span id={`access-level-${index}`}>{accessLevel.label}</span>
                    <DialogTrigger>
                      <Button
                        className="popover-btn"
                        aria-label={QuestionAdd('labels.clickForMoreInfo')}
                        aria-describedby={`access-level-${index}`}
                      >
                        <div className="icon info"><DmpIcon icon="info" /></div>
                      </Button>
                      <Popover placement="top" className="dynamic-popover-width react-aria-Popover">
                        <OverlayArrow>
                          <svg width={12} height={12} viewBox="0 0 12 12" aria-hidden="true">
                            <path d="M0 0 L6 6 L12 0" />
                          </svg>
                        </OverlayArrow>
                        <Dialog aria-label={QuestionAdd('labels.accessLevelDescription', { level: accessLevel.label })}>
                          <div className="flex-col">
                            {accessLevelDescription}
                          </div>
                        </Dialog>
                      </Popover>
                    </DialogTrigger>
                  </li>
                )
              })}
            </ul>
          </fieldset>
        </div>
      )}
    </div>
  );
};

export default InitialAccessLevelField;