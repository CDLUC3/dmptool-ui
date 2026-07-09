'use client';

import classNames from 'classnames';
import { useTranslations } from 'next-intl';
import {
  Button,
  Dialog,
  DialogTrigger,
  Heading,
  Modal,
  ModalOverlay
} from 'react-aria-components';
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
        <p className={styles.emailAddress}>{email}</p>
        {isAlias && (
          <Button
            onPress={() => handleMakePrimary(email)}
            className={styles.emailLink}
          >
            {t('linkMakePrimary')}
          </Button>
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
