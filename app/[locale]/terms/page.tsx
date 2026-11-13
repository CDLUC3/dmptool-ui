'use client'

import React from "react";
import { useTranslations } from "next-intl";

import ComingSoonPage from "@/components/ComingSoonPage";

const TermsPage: React.FC = () => {
  const t = useTranslations("ComingSoon.pages.terms");

  return <ComingSoonPage title={t("title")} description={t("description")} />;
};

export default TermsPage;
