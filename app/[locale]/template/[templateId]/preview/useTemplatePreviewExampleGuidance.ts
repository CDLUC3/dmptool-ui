"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import type { TemplatePreviewExampleGuidance } from "./toTemplatePreviewModel";

// Guidance is rendered from an HTML string, so the note uses a plain class styled in preview.module.scss.
const PREVIEW_ONLY_NOTE_CLASS = "template-preview-only-note";

export function useTemplatePreviewExampleGuidance(): TemplatePreviewExampleGuidance {
  const t = useTranslations("TemplatePreview");
  const label = t("exampleGuidance.label");
  const shortName = t("exampleGuidance.shortName");
  const notice = t("exampleGuidance.notice");
  const body = t("exampleGuidance.body");
  const noteTitle = t("exampleGuidance.noTemplateGuidanceTitle");
  const note = t("exampleGuidance.noTemplateGuidance");
  return useMemo(
    () => ({
      label,
      shortName,
      bodyHtml: `<p><strong>${notice}</strong></p><p>${body}</p>`,
      noTemplateGuidanceNoteHtml: `<p class="${PREVIEW_ONLY_NOTE_CLASS}"><strong>${noteTitle}</strong> ${note}</p>`,
    }),
    [label, shortName, notice, body, noteTitle, note]
  );
}
