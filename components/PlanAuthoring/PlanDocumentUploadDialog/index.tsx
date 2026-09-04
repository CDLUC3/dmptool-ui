"use client";

import React, { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Button,
  Dialog,
  DropZone,
  FileTrigger,
  Heading,
  Modal,
  ModalOverlay,
} from "react-aria-components";
import type { DropEvent, FileDropItem } from "react-aria";
import styles from "./PlanDocumentUploadDialog.module.scss";

const ACCEPTED_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export interface PlanDocumentUploadDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  fileName: string;
  onUpload?: (file: File) => void;
}

export default function PlanDocumentUploadDialog({
  isOpen,
  onOpenChange,
  fileName,
  onUpload,
}: PlanDocumentUploadDialogProps) {
  const t = useTranslations("PlanAuthoring");
  const Global = useTranslations("Global");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedFile(null);
    }
  }, [isOpen]);

  const handleFile = (file: File) => {
    setSelectedFile(file);
  };

  const handleDrop = (event: DropEvent) => {
    const files = event.items.filter(
      (item) => item.kind === "file"
    ) as FileDropItem[];

    if (files[0]) {
      void files[0].getFile().then(handleFile);
    }
  };

  return (
    <ModalOverlay
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      isDismissable
      className={styles.modalOverlay}
    >
      <Modal className={styles.modal}>
        <Dialog
          className={styles.dialog}
          aria-label={t("uploadDialog.title")}
        >
          <div className={styles.dialogHeader}>
            <Heading
              slot="title"
              className={styles.dialogTitle}
            >
              {t("uploadDialog.title")}
            </Heading>
          </div>

          <div className={styles.dialogBody}>
            <p className={styles.warning}>
              {t.rich("uploadDialog.replaceWarning", {
                fileName,
                strong: (chunks) => <strong>{chunks}</strong>,
              })}
            </p>
            <div className={styles.uploadIntro}>
              <h3 className={styles.uploadHeading}>
                {t("uploadDialog.uploadHeading")}
              </h3>
              <p className={styles.fileTypes}>{t("uploadDialog.fileTypes")}</p>
            </div>
            <DropZone
              onDrop={handleDrop}
              aria-label={t("uploadDialog.dropAria")}
              className={styles.dropZone}
            >
              <FileTrigger
                acceptedFileTypes={ACCEPTED_TYPES}
                allowsMultiple={false}
                onSelect={(files) => {
                  if (files?.[0]) {
                    handleFile(files[0]);
                  }
                }}
              >
                <Button>{t("uploadDialog.selectFile")}</Button>
              </FileTrigger>
              <p className={styles.dropHint}>
                {selectedFile
                  ? t("uploadDialog.selectedFile", {
                      fileName: selectedFile.name,
                    })
                  : t("uploadDialog.dropHint")}
              </p>
            </DropZone>
          </div>

          <div className={styles.dialogActions}>
            <Button
              isDisabled={!selectedFile}
              onPress={() => {
                if (selectedFile) {
                  onUpload?.(selectedFile);
                }
                onOpenChange(false);
              }}
            >
              {t("uploadDialog.upload")}
            </Button>
            <Button
              className="link"
              onPress={() => onOpenChange(false)}
            >
              {Global("buttons.cancel")}
            </Button>
          </div>
        </Dialog>
      </Modal>
    </ModalOverlay>
  );
}
