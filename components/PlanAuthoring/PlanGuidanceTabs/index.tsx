"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { Button } from "react-aria-components";
import type { PlanGuidanceSource } from "../model";
import styles from "./PlanGuidanceTabs.module.scss";

interface PlanGuidanceTabsProps {
  sources: PlanGuidanceSource[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onCustomize?: () => void;
  canCustomize?: boolean;
  className?: string;
}

export default function PlanGuidanceTabs({
  sources,
  selectedId,
  onSelect,
  onCustomize,
  canCustomize = false,
  className,
}: PlanGuidanceTabsProps) {
  const t = useTranslations("PlanAuthoring");

  return (
    <div
      className={[styles.guidanceTabs, className].filter(Boolean).join(" ")}
      role="tablist"
      aria-label={t("guidance.sourcesAria")}
    >
      {sources.map((source) => {
        const selected = source.id === selectedId;
        return (
          <Button
            key={source.id}
            className={styles.guidancePill}
            data-selected={selected}
            onPress={() => onSelect(source.id)}
            aria-selected={selected}
          >
            {source.shortName}
          </Button>
        );
      })}
      {canCustomize && onCustomize ? (
        <Button
          className={styles.customizePill}
          onPress={onCustomize}
        >
          {t("guidance.customize")}
        </Button>
      ) : null}
    </div>
  );
}
