'use client'

import React from "react";
import { useTranslations } from "next-intl";

import ComingSoonPage from "@/components/ComingSoonPage";

const LogosPage: React.FC = () => {
  const t = useTranslations("ComingSoon.pages.logos");

  return <ComingSoonPage title={t("title")} description={t("description")} />;
};

export default LogosPage;
