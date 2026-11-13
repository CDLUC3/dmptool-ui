'use client'

import React from "react";
import { useTranslations } from "next-intl";

import ComingSoonPage from "@/components/ComingSoonPage";

const EditorialBoardPage: React.FC = () => {
  const t = useTranslations("ComingSoon.pages.editorialBoard");

  return <ComingSoonPage title={t("title")} description={t("description")} />;
};

export default EditorialBoardPage;
