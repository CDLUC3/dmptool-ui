'use client';

import React, { useId } from 'react';
import {
  Button,
  Dialog,
  Heading,
  Modal,
  ModalOverlay,
  PressEvent
} from 'react-aria-components';
import styles from './modalOverlayComponent.module.scss';

interface ModalOverlayProps {
  heading: string;
  content: string;
  isOpen?: boolean;
  btnSecondaryText?: string;
  btnPrimaryText?: string;
  isPrimaryDisabled?: boolean;
  onPressAction: (e: PressEvent, close: () => void) => void;
}

export const ModalOverlayComponent = ({
  heading,
  content,
  isOpen,
  btnSecondaryText,
  btnPrimaryText,
  isPrimaryDisabled = false,
  onPressAction
}: ModalOverlayProps) => {
  const titleId = useId();
  const descriptionId = useId();

  return (
    <ModalOverlay isOpen={isOpen} isDismissable>
      <Modal>
        <Dialog
          role="alertdialog"
          aria-labelledby={titleId}
          aria-describedby={descriptionId}
        >
          {({ close }) => (
            <>
              <Heading slot="title" id={titleId}>{heading}</Heading>
              <p id={descriptionId}>{content}</p>
              <div className={styles.dialogActions}>
                <Button className="secondary" autoFocus onPress={close}>
                  {btnSecondaryText || 'Cancel'}
                </Button>
                <Button
                  className="danger"
                  isDisabled={isPrimaryDisabled}
                  onPress={e => onPressAction(e, close)}
                >
                  {btnPrimaryText || 'Delete'}
                </Button>
              </div>
            </>
          )}
        </Dialog>
      </Modal>
    </ModalOverlay>
  )
}
