"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { Breadcrumb, Breadcrumbs, Link } from "react-aria-components";
import { routePath } from "@/utils/routes";

export interface PreviewBreadcrumbItem {
  label: React.ReactNode;
  href?: string;
}

export default function PreviewBreadcrumbs({ items }: { items: PreviewBreadcrumbItem[] }) {
  const Global = useTranslations("Global");
  return (
    <Breadcrumbs aria-label={Global("breadcrumbs.navigation")}>
      {[{ label: Global("breadcrumbs.home"), href: routePath("app.home") }, ...items].map(({ label, href }, index) => (
        <Breadcrumb key={index}>{href ? <Link href={href}>{label}</Link> : label}</Breadcrumb>
      ))}
    </Breadcrumbs>
  );
}
