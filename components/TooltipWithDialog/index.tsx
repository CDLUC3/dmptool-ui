import React, { useState, useRef, ReactNode } from 'react';
import {
  Button,
  Tooltip,
  TooltipTrigger,
  Dialog,
  DialogTrigger,
  Heading,
  Modal,
  ModalOverlay,
  OverlayArrow,
  PressEvent,
  TooltipProps
} from 'react-aria-components';
import Image from 'next/image';
import { DmpIcon } from "@/components/Icons";
import classNames from 'classnames';
import styles from "./tooltipWithDialog.module.scss";

interface TooltipWithDialogProps {
  text: string;
  tooltipText: string;
  dialogHeading?: string;
  dialogContent?: string;
  icon?: ReactNode;
  imageUrl?: string;
  onPressAction: (e: PressEvent, close: () => void) => void; // Allow passing arguments
  children?: ReactNode;
  placement?: TooltipProps['placement'];
}

const TooltipWithDialog = ({
  text,
  tooltipText,
  dialogHeading,
  dialogContent,
  icon,
  imageUrl,
  onPressAction,
  children,
  placement = "top left"
}: TooltipWithDialogProps) => {
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const buttonRef = useRef<HTMLButtonElement>(null);

  const onDialogChange = (isOpen: boolean) => {
    setIsOpen(isOpen);
    if (!isOpen) {
      setIsConfirmed(true);
    }
  };


  return (
    <>
      <DialogTrigger isOpen={isOpen} onOpenChange={onDialogChange}>
        <TooltipTrigger delay={0}>
          <Button
            className={classNames('react-aria-Button', styles.tooltipButton)}
            onPress={() => setIsOpen(true)}
            aria-label="Delete Item"
            ref={buttonRef}
          >
            {imageUrl && (
              <span><Image src={imageUrl} className={styles.icon} width={20} height={20} alt="" /></span>
            )}<span>{text}</span><span>{icon || <DmpIcon icon="cancel" />}</span>
          </Button>
          <Tooltip placement={placement} className={styles.tooltip} data-testid="tooltip-container">
            <OverlayArrow className={styles.tooltipArrow} />
            {tooltipText}
          </Tooltip>
        </TooltipTrigger>
        {children ? (
          children
        ) : (
          <ModalOverlay>
            <Modal>
              <Dialog>
                {({ close }) => (
                  <>
                    <Heading>{dialogHeading}</Heading>
                    <p>{dialogContent}</p>
                    <div>
                      <Button onPress={close}>Cancel</Button>
                      <Button onPress={e => onPressAction(e, close)}>Delete</Button>
                    </div>
                  </>
                )}
              </Dialog>
            </Modal>
          </ModalOverlay>
        )}

        {isConfirmed && <p>Item has been deleted</p>}
      </DialogTrigger >
    </>
  )
}

export default TooltipWithDialog;