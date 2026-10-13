"use client";

import { useCallback, useSyncExternalStore } from "react";
import type { PlanAuthoringDataSource, PlanAuthoringState } from "./dataSource";

export function usePlanAuthoringState(
  dataSource: PlanAuthoringDataSource
): PlanAuthoringState {
  const subscribe = useCallback(
    (listener: () => void) => dataSource.subscribe(listener),
    [dataSource]
  );
  const getState = useCallback(() => dataSource.getState(), [dataSource]);
  return useSyncExternalStore(subscribe, getState, getState);
}
