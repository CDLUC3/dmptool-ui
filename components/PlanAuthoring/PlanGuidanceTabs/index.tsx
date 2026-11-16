"use client";

import React from "react";
import { useTranslations } from "next-intl";
import {
  Button,
  ToggleButton,
  ToggleButtonGroup,
} from "react-aria-components";
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
    <div className={[styles.guidanceTabs, className].filter(Boolean).join(" ")}>
      <ToggleButtonGroup
        className={styles.guidanceSources}
        aria-label={t("guidance.sourcesAria")}
        selectionMode="single"
        disallowEmptySelection
        selectedKeys={selectedId ? [selectedId] : []}
        onSelectionChange={(keys) => {
          const [id] = keys;
          if (id != null) {
            onSelect(String(id));
          }
        }}
      >
        {sources.map((source) => (
          <ToggleButton
            key={source.id}
            id={source.id}
            className={styles.guidancePill}
          >
            {source.shortName}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
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
