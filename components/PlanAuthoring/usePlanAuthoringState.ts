"use client";

import { useCallback, useSyncExternalStore } from "react";
import type { PlanAuthoringDataSource, PlanAuthoringState } from "./dataSource";

// The server always renders the loading state, so hydration must start from it
// even when the data source has already loaded on the client.
const SERVER_STATE: PlanAuthoringState = { status: "loading" };
const getServerState = () => SERVER_STATE;

export function usePlanAuthoringState(
  dataSource: PlanAuthoringDataSource
): PlanAuthoringState {
  const subscribe = useCallback(
    (listener: () => void) => dataSource.subscribe(listener),
    [dataSource]
  );
  const getState = useCallback(() => dataSource.getState(), [dataSource]);
  return useSyncExternalStore(subscribe, getState, getServerState);
}
