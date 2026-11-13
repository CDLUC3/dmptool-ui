'use client'

import React from "react";
import { useTranslations } from "next-intl";

import ComingSoonPage from "@/components/ComingSoonPage";

const MembershipPage: React.FC = () => {
  const t = useTranslations("ComingSoon.pages.membership");

  return <ComingSoonPage title={t("title")} description={t("description")} />;
};

export default MembershipPage;
