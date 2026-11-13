'use client'

import React from "react";
import { useTranslations } from "next-intl";

import ComingSoonPage from "@/components/ComingSoonPage";
import { routePath } from "@/utils/routes";

const AdminStatisticsPage: React.FC = () => {
  const t = useTranslations("Admin");
  const Global = useTranslations("Global");

  return (
    <ComingSoonPage
      title={t("sections.reporting.items.usageStatistics.title")}
      description={t("sections.reporting.items.usageStatistics.description")}
      parentBreadcrumbs={[{ label: Global("breadcrumbs.admin"), href: routePath("admin.index") }]}
    />
  );
};

export default AdminStatisticsPage;
