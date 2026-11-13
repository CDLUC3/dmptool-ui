'use client'

import React from "react";
import { useTranslations } from "next-intl";

import ComingSoonPage from "@/components/ComingSoonPage";

const HelpPage: React.FC = () => {
  const t = useTranslations("ComingSoon.pages.help");

  return <ComingSoonPage title={t("title")} description={t("description")} />;
};

export default HelpPage;
