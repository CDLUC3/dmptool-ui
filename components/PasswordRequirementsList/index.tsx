'use client'

import React from "react";
import { useTranslations } from "next-intl";
import { getPasswordRequirements } from "@/utils/validation";
import styles from './passwordRequirements.module.scss';
import { DmpIcon } from "../Icons";

interface PasswordRequirementsListProps {
  password: string;
}

type RequirementStatus = "pending" | "met" | "unmet";

const getRequirementStatus = (password: string, isMet: boolean): RequirementStatus => {
  if (!password) {
    return "pending";
  }

  return isMet ? "met" : "unmet";
};

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
      <p className={styles.heading}>{t('description')}</p>
      <ul className={styles.requirementsList}>
        {requirements.map(({ key, isMet }) => {
          const status = getRequirementStatus(password, isMet);

          return (
            <li
              key={key}
              className={styles[status]}
              data-testid={`requirement-${key}`}
            >
              <div className={styles.iconContainer}>
                <span aria-hidden="true">
                  {status === "unmet" ? (
                    <DmpIcon icon="error_circle" className={styles.unmet} />
                  ) : (
                    <DmpIcon icon="check_circle" className={status === "met" ? styles.met : styles.pending} />
                  )}
                </span>
                {status !== "pending" && (
                  <span className="hidden-accessibly">{status === "met" ? t('metPrefix') : t('unmetPrefix')}</span>
                )}
                {labels[key]}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default PasswordRequirementsList;
