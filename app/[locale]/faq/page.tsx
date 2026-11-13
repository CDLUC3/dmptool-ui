'use client'

import React from "react";
import { useTranslations } from "next-intl";

import ComingSoonPage from "@/components/ComingSoonPage";

const FaqPage: React.FC = () => {
  const t = useTranslations("ComingSoon.pages.faq");

  return <ComingSoonPage title={t("title")} description={t("description")} />;
};

export default FaqPage;
