"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { Button, DialogTrigger, Link as AriaLink } from "react-aria-components";
import { Card } from "@/components/Card/card";
import { TransitionLink } from "@/components/Form";
import { DmpIcon } from "@/components/Icons";
import { ModalOverlayComponent } from "@/components/ModalOverlayComponent";
import type { PlanDocument } from "../model";
import styles from "./PlanDocumentCard.module.scss";

export interface PlanDocumentCardProps {
  document: PlanDocument;
  onUpdate: () => void;
  onDelete: () => void;
}

function fileTypeLabel(document: PlanDocument, unknownLabel: string): string {
  const explicit = document.fileType?.trim();
  if (explicit) {
    return explicit;
  }

  const parts = document.fileName.split(".");
  if (parts.length < 2) {
    return unknownLabel;
  }

  return parts.pop()?.toUpperCase() || unknownLabel;
}

export default function PlanDocumentCard({
  document,
  onUpdate,
  onDelete,
}: PlanDocumentCardProps) {
  const t = useTranslations("PlanAuthoring");
  const Global = useTranslations("Global");
  const fileType = fileTypeLabel(document, t("document.unknownFileType"));
  const downloadLabel = t("document.downloadAria", {
    fileName: document.fileName,
  });

  return (
    <Card
      className={styles.documentCard}
      data-testid="plan-document-card"
    >
      <div className={styles.topRow}>
        <div className={styles.documentMain}>
          <span
            className={styles.fileIcon}
            aria-hidden="true"
          >
            {fileType.toUpperCase() === "PDF" ? (
              <DmpIcon
                icon="pdf"
                width={22}
                height={22}
                fill="currentColor"
              />
            ) : (
              <span className={styles.fileIconText}>{fileType}</span>
            )}
          </span>
          <div className={styles.documentMeta}>
            <h3 className={styles.fileName}>
              {document.downloadHref ? (
                <TransitionLink
                  href={document.downloadHref}
                  className={styles.fileNameLink}
                >
                  {document.fileName}
                </TransitionLink>
              ) : (
                document.fileName
              )}
            </h3>
            <p className={styles.fileType}>
              {t("document.fileType", { type: fileType })}
            </p>
            {document.doi ? (
              <p className={styles.doi}>
                <span className={styles.doiLabel}>{t("document.doi")} </span>
                {document.doi.startsWith("http") ? (
                  <AriaLink
                    href={document.doi}
                    className={styles.doiLink}
                  >
                    {document.doi}
                  </AriaLink>
                ) : (
                  document.doi
                )}
              </p>
            ) : null}
            <p className={styles.timestamps}>
              {document.modified ? (
                <span>
                  {t("document.lastUpdated", { date: document.modified })}
                </span>
              ) : null}
              {document.modified && document.created ? (
                <span aria-hidden="true"> · </span>
              ) : null}
              {document.created ? (
                <span>{t("document.created", { date: document.created })}</span>
              ) : null}
            </p>
            <div className={styles.secondaryActions}>
              <Button
                className="link"
                onPress={onUpdate}
              >
                {t("document.updateDocument")}
              </Button>
              <DialogTrigger>
                <Button className="link">{Global("buttons.delete")}</Button>
                <ModalOverlayComponent
                  heading={t("document.deleteTitle")}
                  content={t("document.deleteWarning", {
                    fileName: document.fileName,
                  })}
                  btnSecondaryText={Global("buttons.cancel")}
                  btnPrimaryText={Global("buttons.delete")}
                  onPressAction={(_event, close) => {
                    onDelete();
                    close();
                  }}
                />
              </DialogTrigger>
            </div>
          </div>
        </div>
        {document.downloadHref && (
          <div className={styles.downloadAction}>
            <TransitionLink
              href={document.downloadHref}
              className="react-aria-Button secondary"
              aria-label={downloadLabel}
            >
              {t("document.download")}
            </TransitionLink>
          </div>
        )}
      </div>
    </Card>
  );
}
