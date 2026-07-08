'use client';

import React from 'react';
import classNames from 'classnames';
import { useTranslations } from 'next-intl';
import { DmpIcon } from '@/components/Icons';
import styles from './emailAddressRow.module.scss';

interface DeleteRowInterface {
  email: string;
  isAlias: boolean;
  additionalClassName?: string;
  deleteDisabled?: boolean;
  onDeleteSuccess?: (email: string) => void;
  makePrimaryEmail?: (email: string) => void;
  deleteEmail?: (email: string) => void;
}
export default function EmailAddressRow({
  email,
  isAlias,
  additionalClassName,
  deleteDisabled = false,
  makePrimaryEmail,
  deleteEmail
}: DeleteRowInterface) {

  const t = useTranslations('UserProfile');

  const handleMakePrimary = (e: React.MouseEvent<HTMLDivElement>, email: string) => {
    e.preventDefault();
    if (makePrimaryEmail) {
      makePrimaryEmail(email);
    }
  }
  return (

    <div className={classNames(
      styles.emailRow,
      additionalClassName && styles[additionalClassName]
    )}>
      <div className={styles.emailContent}>
        <p className={styles.emailAddress}>{email}</p>
        {isAlias && (
          <div role="button" onClick={e => handleMakePrimary(e, email)} className={styles.emailLink}>{t('linkMakePrimary')}</div>
        )}
        {deleteDisabled && (
          <p className={styles.deleteDisabledMessage}>{t('primaryEmailCannotBeDeleted')}</p>
        )}
      </div>

      {deleteDisabled ? (
        <span className={styles.primaryBadge}>
          <DmpIcon icon="lock" classes={styles.primaryBadgeIcon} width="16px" height="16px" />
          {t('primaryBadge')}
        </span>
      ) : (
        <div onClick={() => deleteEmail && deleteEmail(email)} className="delete-email">
          <DmpIcon icon="trashcan" classes={styles.trashcanIcon} />
        </div>
      )}

    </ div >
  );
}
