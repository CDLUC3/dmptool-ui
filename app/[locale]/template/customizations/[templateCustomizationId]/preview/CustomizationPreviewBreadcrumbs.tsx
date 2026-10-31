"use client";

import { useTranslations } from "next-intl";
import PreviewBreadcrumbs, { type PreviewBreadcrumbItem } from "@/components/PlanPreview/PreviewBreadcrumbs";
import { routePath } from "@/utils/routes";

export default function CustomizationPreviewBreadcrumbs({
  templateCustomizationId,
  trail,
}: {
  templateCustomizationId: string;
  trail: PreviewBreadcrumbItem[];
}) {
  const Global = useTranslations("Global");
  return (
    <PreviewBreadcrumbs
      items={[
        { label: Global("breadcrumbs.templateCustomizations"), href: routePath("template.customizations") },
        { label: Global("breadcrumbs.editTemplate"), href: routePath("template.customize", { templateCustomizationId }) },
        ...trail,
      ]}
    />
  );
}
