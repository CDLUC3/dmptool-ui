"use client";

import React, { useCallback, useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { Switch } from "react-aria-components";
import type { LocalPreviewDataSource } from "../localPreviewDataSource";
import styles from "./displayLogicToggle.module.scss";

export default function DisplayLogicToggle({ dataSource }: { dataSource: LocalPreviewDataSource }) {
  const t = useTranslations("TemplatePreview");
  const subscribe = useCallback((listener: () => void) => dataSource.subscribe(listener), [dataSource]);
  const hasDisplayLogic = useSyncExternalStore(subscribe, () => dataSource.hasDisplayLogic(), () => false);
  const isApplied = useSyncExternalStore(subscribe, () => dataSource.isDisplayLogicApplied(), () => false);

  if (!hasDisplayLogic) {
    return null;
  }
  return (
    <div className={styles.toggle}>
      <Switch isSelected={isApplied} onChange={(selected) => dataSource.setDisplayLogicApplied(selected)}>
        <div className="indicator" />
        {t("displayLogic.label")}
      </Switch>
      <p className={styles.help}>{isApplied ? t("displayLogic.on") : t("displayLogic.off")}</p>
    </div>
  );
}
