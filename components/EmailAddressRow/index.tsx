'use client';

import { useState } from 'react';
import classNames from 'classnames';
import { useTranslations } from 'next-intl';
import {
  Button,
  Dialog,
  DialogTrigger,
  Heading,
  Modal,
  ModalOverlay,
  OverlayArrow,
  Popover
} from 'react-aria-components';
import { DmpIcon } from '@/components/Icons';
import styles from './emailAddressRow.module.scss';

interface DeleteRowInterface {
  email: string;
  isAlias: boolean;
  isConfirmed?: boolean;
  additionalClassName?: string;
  deleteDisabled?: boolean;
  onDeleteSuccess?: (email: string) => void;
  makePrimaryEmail?: (email: string) => void;
  deleteEmail?: (email: string) => void;
  resendConfirmation?: (email: string) => Promise<void>;
}
export default function EmailAddressRow({
  email,
  isAlias,
  isConfirmed = false,
  additionalClassName,
  deleteDisabled = false,
  makePrimaryEmail,
  deleteEmail,
  resendConfirmation
}: DeleteRowInterface) {

  const t = useTranslations('UserProfile');
  const [isResending, setIsResending] = useState(false);

  const handleResend = async (resend: (email: string) => Promise<void>) => {
    setIsResending(true);
    try {
      await resend(email);
    } finally {
      setIsResending(false);
    }
  }

  const handleMakePrimary = (email: string) => {
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
        <div className={styles.emailHeader}>
          <p className={styles.emailAddress}>{email}</p>
          {isAlias && (
            isConfirmed ? (
              <span className={classNames(styles.statusBadge, styles.confirmedBadge)}>
                <DmpIcon icon="check_circle" classes={styles.statusBadgeIcon} width="16px" height="16px" />
                {t('confirmedBadge')}
              </span>
            ) : (
              <>
                <span className={classNames(styles.statusBadge, styles.unconfirmedBadge)}>
                  <DmpIcon icon="warning" classes={styles.statusBadgeIcon} width="16px" height="16px" />
                  {t('unconfirmedBadge')}
                </span>
                <DialogTrigger>
                  <Button
                    className={styles.infoButton}
                    aria-label={t('unconfirmedInfoAria', { email })}
                  >
                    <DmpIcon icon="info" classes={styles.infoIcon} width="18px" height="18px" />
                  </Button>
                  <Popover className="dynamic-popover-width react-aria-Popover">
                    <OverlayArrow>
                      <svg width={12} height={12} viewBox="0 0 12 12" aria-hidden="true">
                        <path d="M0 0 L6 6 L12 0" />
                      </svg>
                    </OverlayArrow>
                    <Dialog aria-label={t('unconfirmedBadge')} className="popoverContent">
                      {t('unconfirmedTooltip')}
                    </Dialog>
                  </Popover>
                </DialogTrigger>
              </>
            )
          )}
        </div>
        {isAlias && isConfirmed && (
          <Button
            onPress={() => handleMakePrimary(email)}
            className={styles.emailLink}
          >
            {t('linkMakePrimary')}
          </Button>
        )}
        {isAlias && !isConfirmed && (
          <>
            <p className={styles.unconfirmedMessage}>{t('unconfirmedEmailDesc')}</p>
            {resendConfirmation && (
              <Button
                className={styles.emailLink}
                isPending={isResending}
                onPress={() => handleResend(resendConfirmation)}
              >
                {isResending ? t('btnResendingVerification') : t('btnResendVerification')}
              </Button>
            )}
          </>
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
        <DialogTrigger>
          <Button
            className={`${styles.deleteButton} delete-email`}
            aria-label={t('deleteEmailAria', { email })}
          >
            <DmpIcon icon="trashcan" classes={styles.trashcanIcon} />
          </Button>
          <ModalOverlay isDismissable>
            <Modal>
              <Dialog role="alertdialog">
                {({ close }) => (
                  <>
                    <Heading slot="title">{t('deleteEmailConfirmTitle')}</Heading>
                    <p>{t('deleteEmailConfirmMessage', { email })}</p>
                    <div className={styles.dialogActions}>
                      <Button className="secondary" onPress={close}>
                        {t('btnCancel')}
                      </Button>
                      <Button
                        className="danger"
                        onPress={() => {
                          if (deleteEmail) {
                            deleteEmail(email);
                          }
                          close();
                        }}
                      >
                        {t('btnDelete')}
                      </Button>
                    </div>
                  </>
                )}
              </Dialog>
            </Modal>
          </ModalOverlay>
        </DialogTrigger>
      )}

    </div>
  );
}
