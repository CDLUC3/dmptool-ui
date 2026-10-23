"use client";

import React, { createContext, useContext, useMemo } from "react";
import { createLoadedPreviewDataSource, type LoadedPreview } from "./createLoadedPreviewDataSource";
import type { LocalPreviewDataSource } from "./localPreviewDataSource";
import styles from "./preview.module.scss";

const PreviewContext = createContext<LocalPreviewDataSource | null>(null);

/**
 * For a full preview's layout, which stays mounted between the preview and its research
 * output pages so answers entered on one are still there on the other. `load` should be stable.
 */
export function PreviewProvider({
  load,
  children,
}: {
  load: () => Promise<LoadedPreview>;
  children: React.ReactNode;
}) {
  const dataSource = useMemo(() => createLoadedPreviewDataSource(load), [load]);
  return (
    <PreviewContext.Provider value={dataSource}>
      <div className={styles.preview}>{children}</div>
    </PreviewContext.Provider>
  );
}

export function usePreviewDataSource(): LocalPreviewDataSource {
  const dataSource = useContext(PreviewContext);
  if (!dataSource) {
    throw new Error("usePreviewDataSource must be used inside PreviewProvider.");
  }
  return dataSource;
}
