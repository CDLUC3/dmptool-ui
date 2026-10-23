"use client";

import { useTranslations } from "next-intl";
import { useToast } from "@/context/ToastContext";

export function usePreviewCustomizeGuidance(): () => void {
  const t = useTranslations("TemplatePreview");
  const toastState = useToast();
  return () => toastState.add(t("customizeGuidanceUnavailable"), { type: "info" });
}
