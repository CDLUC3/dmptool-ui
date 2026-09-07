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
  planDocument: PlanDocument;
  onUpdate: () => void;
  onDelete: () => void;
}

function fileTypeLabel(planDocument: PlanDocument, unknownLabel: string): string {
  const explicit = planDocument.fileType?.trim();
  if (explicit) {
    return explicit;
  }

  const parts = planDocument.fileName.split(".");
  if (parts.length < 2) {
    return unknownLabel;
  }

  return parts.pop()?.toUpperCase() || unknownLabel;
}

export default function PlanDocumentCard({
  planDocument,
  onUpdate,
  onDelete,
}: PlanDocumentCardProps) {
  const t = useTranslations("PlanAuthoring");
  const Global = useTranslations("Global");
  const fileType = fileTypeLabel(planDocument, t("document.unknownFileType"));
  const downloadLabel = t("document.downloadAria", {
    fileName: planDocument.fileName,
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
              {planDocument.downloadHref ? (
                <TransitionLink
                  href={planDocument.downloadHref}
                  className={styles.fileNameLink}
                >
                  {planDocument.fileName}
                </TransitionLink>
              ) : (
                planDocument.fileName
              )}
            </h3>
            <p className={styles.fileType}>
              {t("document.fileType", { type: fileType })}
            </p>
            {planDocument.doi ? (
              <p className={styles.doi}>
                <span className={styles.doiLabel}>{t("document.doi")} </span>
                {planDocument.doi.startsWith("http") ? (
                  <AriaLink
                    href={planDocument.doi}
                    className={styles.doiLink}
                  >
                    {planDocument.doi}
                  </AriaLink>
                ) : (
                  planDocument.doi
                )}
              </p>
            ) : null}
            <p className={styles.timestamps}>
              {planDocument.modified ? (
                <span>
                  {t("document.lastUpdated", { date: planDocument.modified })}
                </span>
              ) : null}
              {planDocument.modified && planDocument.created ? (
                <span aria-hidden="true"> · </span>
              ) : null}
              {planDocument.created ? (
                <span>{t("document.created", { date: planDocument.created })}</span>
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
                    fileName: planDocument.fileName,
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
        {planDocument.downloadHref && (
          <div className={styles.downloadAction}>
            <TransitionLink
              href={planDocument.downloadHref}
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
