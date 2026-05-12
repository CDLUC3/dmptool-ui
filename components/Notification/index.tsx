'use client';

import { useState } from 'react';
import {
  Button,
  Dialog,
  DialogTrigger,
  Modal,
  ModalOverlay,
} from 'react-aria-components';
import styles from './notification.module.scss';

interface NotificationHeaderProps {
  title: string;
  children: React.ReactNode;
  actionButtonText?: string;
  modal?: {
    title: string;
    content: React.ReactNode;
    cancelButtonText: string;
    confirmButtonText: string;
    isSubmitting?: boolean;
    submittingText?: string;
  };
  onMarkAsDone?: () => void | Promise<void>;
}

const NotificationHeader = ({
  title,
  children,
  actionButtonText,
  modal,
  onMarkAsDone,
}: NotificationHeaderProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleConfirm = (close: () => void) => {
    close();
    onMarkAsDone?.();
  };

  return (
    <div className={styles.feedbackNotification}>
      <div className={styles.feedbackNotification__content}>
        <h2 className={styles.feedbackNotification__title}>{title}</h2>
        {children}
      </div>

      {onMarkAsDone && modal && (
        <DialogTrigger isOpen={isModalOpen} onOpenChange={setIsModalOpen}>
          <Button className={styles.feedbackNotification__action}>
            {actionButtonText}
          </Button>
          <ModalOverlay>
            <Modal>
              <Dialog>
                {({ close }) => (
                  <>
                    <h3>{modal.title}</h3>
                    {modal.content}
                    <div className={styles.buttonGroup}>
                      <Button onPress={close} className="secondary">{modal.cancelButtonText}</Button>
                      <Button
                        onPress={() => handleConfirm(close)}
                        isDisabled={modal.isSubmitting}
                      >
                        {modal.isSubmitting ? modal.submittingText ?? modal.confirmButtonText : modal.confirmButtonText}
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
};

export default NotificationHeader;