'use client'

import React from "react";
import { useTranslations } from "next-intl";

import ComingSoonPage from "@/components/ComingSoonPage";

const AboutPage: React.FC = () => {
  const t = useTranslations("ComingSoon.pages.about");

  return <ComingSoonPage title={t("title")} description={t("description")} />;
};

export default AboutPage;
