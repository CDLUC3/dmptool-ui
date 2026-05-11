import React from "react";
import { Radio } from "react-aria-components";
import { useTranslations } from 'next-intl';
import { RadioGroupComponent } from "@/components/Form";
import styles from './ProjectsProjectCollaboration.module.scss';

interface AccessLevelRadioGroupProps {
  name?: string;
  value: string;
  onChange: (value: string) => void;
  radioGroupLabel?: string;
  collaboratorName: string;
}

const AccessLevelRadioGroup: React.FC<AccessLevelRadioGroupProps> = ({
  name = "accessLevel",
  value,
  onChange,
  radioGroupLabel = "",
  collaboratorName,
}) => {
  // Localization
  const t = useTranslations('ProjectsProjectCollaboration');
  return (
    <div className={styles.accessOptions}>
      <RadioGroupComponent
        name={name}
        value={value}
        radioGroupLabel={radioGroupLabel}
        onChange={onChange}
      >
        <div>
          <Radio value="edit" aria-label={t('canEditPlanFor', { name: collaboratorName })} data-testid={`edit-${collaboratorName}`}>{t('canEdit')}</Radio>
        </div>
        <div>
          <Radio value="comment" aria-label={t('canCommentPlanFor', { name: collaboratorName })} data-testid={`comment-${collaboratorName}`}>{t('canComment')}</Radio>
        </div>
        <div>
          <Radio value="own" aria-label={t('canCoOwnPlanFor', { name: collaboratorName })} data-testid={`own-${collaboratorName}`}>{t('own')}</Radio>
        </div>
        <div>
          <Radio value="primary" aria-label={t('canPrimaryOwnPlanFor', { name: collaboratorName })} data-testid={`primary-${collaboratorName}`}>{t('primary')}</Radio>
        </div>
      </RadioGroupComponent>
    </div>
  )
};

export default AccessLevelRadioGroup;