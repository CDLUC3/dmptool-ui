'use client';

import { useState } from 'react';
import {
  Button,
  Dialog,
  DialogTrigger,
  Modal,
  ModalOverlay,
  Radio,
} from 'react-aria-components';
import { RadioGroupComponent } from '../Form';
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
    emailPromptLabel?: string;
    emailPromptYes?: string;
    emailPromptNo?: string;
    isSubmitting?: boolean;
    submittingText?: string;
  };
  onMarkAsDone?: (sendEmail: boolean) => void | Promise<void>;
}

const NotificationHeader = ({
  title,
  children,
  actionButtonText,
  modal,
  onMarkAsDone,
}: NotificationHeaderProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sendEmail, setSendEmail] = useState<boolean>(true);

  const handleConfirm = (close: () => void) => {
    close();
    onMarkAsDone?.(sendEmail);
  };

  return (
    <div className={styles.feedbackNotification}>
      <div className={styles.feedbackNotification__content}>
        <h2 className={styles.feedbackNotification__title}>{title}</h2>
        {children}
      </div>

      {onMarkAsDone && modal && (
        <DialogTrigger
          isOpen={isModalOpen}
          onOpenChange={(open) => {
            setIsModalOpen(open);
            if (!open) setSendEmail(true); // reset to default when modal closes
          }}
        >
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


                    {modal.emailPromptLabel && (
                      <RadioGroupComponent
                        name="projectType"
                        value={sendEmail ? 'yes' : 'no'}
                        aria-label={modal.emailPromptLabel}
                        radioGroupLabel={modal.emailPromptLabel}
                        onChange={(val) => setSendEmail(val === 'yes')}
                      >
                        <div>
                          <Radio value="yes">{modal.emailPromptYes}</Radio>
                        </div>

                        <div>
                          <Radio value="no">{modal.emailPromptNo}</Radio>
                        </div>
                      </RadioGroupComponent>
                    )}
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