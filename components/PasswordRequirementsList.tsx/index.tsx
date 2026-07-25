'use client'

import React from "react";
import { useTranslations } from "next-intl";
import { getPasswordRequirements } from "@/utils/validation";
import styles from './passwordRequirements.module.scss';
import { DmpIcon } from "../Icons";

interface PasswordRequirementsListProps {
  password: string;
}

const PasswordRequirementsList: React.FC<PasswordRequirementsListProps> = ({ password }) => {
  const t = useTranslations('Global.passwordRequirements');
  const requirements = getPasswordRequirements(password);

  const labels: Record<string, string> = {
    minLength: t('minLength'),
    hasUppercase: t('hasUppercase'),
    hasLowercase: t('hasLowercase'),
    hasNumber: t('hasNumber'),
    hasSpecialChar: t('hasSpecialChar'),
  };

  return (
    <div id="password-requirements">
      <p>{t('description')}</p>
      <ul className={styles.requirementsList} aria-live="polite">
        {requirements.map(({ key, isMet }) => (
          <li
            key={key}
            className={isMet ? styles.met : styles.unmet}
            data-testid={`requirement-${key}`}
          >
            <div className={styles.iconContainer}>
              <span aria-hidden="true">{isMet ? <DmpIcon icon="check_circle" className={styles.met} /> : <DmpIcon icon="error_circle" className={styles.unmet} />}</span>
              <span className="hidden-accessibly">{isMet ? t('metPrefix') : t('unmetPrefix')}</span>
              {labels[key]}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PasswordRequirementsList;