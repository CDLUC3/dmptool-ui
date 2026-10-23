"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { Button } from "react-aria-components";
import NotificationHeader from "@/components/Notification";
import type { PreviewErrorKind } from "../previewError";

export default function PreviewLoadError({
  kind,
  notFoundMessage,
  onRetry,
}: {
  kind: PreviewErrorKind;
  notFoundMessage?: string;
  onRetry?: () => void;
}) {
  const t = useTranslations("TemplatePreview");
  const PlanAuthoring = useTranslations("PlanAuthoring");

  return (
    <div role="alert">
      <NotificationHeader title={t(`errors.${kind}.title`)}>
        <p>{kind === "notFound" && notFoundMessage ? notFoundMessage : t(`errors.${kind}.body`)}</p>
        {kind === "failed" && onRetry ? (
          <Button className="react-aria-Button react-aria-Button--secondary" onPress={onRetry}>
            {PlanAuthoring("common.retry")}
          </Button>
        ) : null}
      </NotificationHeader>
    </div>
  );
}
