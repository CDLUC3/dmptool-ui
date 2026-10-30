"use client";

import { useTranslations } from "next-intl";
import PreviewBreadcrumbs, { type PreviewBreadcrumbItem } from "@/components/PlanPreview/PreviewBreadcrumbs";
import { routePath } from "@/utils/routes";

export default function TemplatePreviewBreadcrumbs({
  templateId,
  templateName,
  trail,
}: {
  templateId: string;
  templateName: string;
  trail: PreviewBreadcrumbItem[];
}) {
  const Global = useTranslations("Global");
  return (
    <PreviewBreadcrumbs
      items={[
        { label: Global("breadcrumbs.templates"), href: routePath("template.index") },
        { label: templateName || Global("breadcrumbs.template"), href: routePath("template.show", { templateId }) },
        ...trail,
      ]}
    />
  );
}
