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
  Text,
} from "react-aria-components";
import type { DropEvent, FileDropItem } from "react-aria";
import styles from "./PlanDocumentUploadDialog.module.scss";

const ACCEPTED_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const ACCEPTED_EXTENSIONS = [".pdf", ".doc", ".docx"];

const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024; // 20MB

type UploadErrorKey = "invalidType" | "tooLarge" | "multipleFiles";

function hasAcceptedType(file: File): boolean {
  if (ACCEPTED_TYPES.includes(file.type)) {
    return true;
  }

  // file.type can be empty if the browser/OS cannot determine the MIME type
  const name = file.name.toLowerCase();
  return ACCEPTED_EXTENSIONS.some((ext) => name.endsWith(ext));
}

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
  const [errorKey, setErrorKey] = useState<UploadErrorKey | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedFile(null);
      setErrorKey(null);
    }
  }, [isOpen]);

  const handleFile = (file: File, options?: { multipleDropped?: boolean }) => {
    if (!hasAcceptedType(file)) {
      setSelectedFile(null);
      setErrorKey("invalidType");
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setSelectedFile(null);
      setErrorKey("tooLarge");
      return;
    }

    setSelectedFile(file);
    setErrorKey(options?.multipleDropped ? "multipleFiles" : null);
  };

  const handleDrop = (event: DropEvent) => {
    const files = event.items.filter(
      (item) => item.kind === "file"
    ) as FileDropItem[];

    if (!files[0]) {
      return;
    }

    const multipleDropped = files.length > 1;
    void files[0].getFile().then((file) => {
      handleFile(file, { multipleDropped });
    });
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
              {errorKey && (
                <Text
                  className={
                    errorKey === "multipleFiles"
                      ? styles.notice
                      : styles.error
                  }
                  role="alert"
                >
                  {t(`uploadDialog.errors.${errorKey}`)}
                </Text>
              )}
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
