"use client";

import { useMemo } from "react";
import { useApolloClient } from "@apollo/client/react";
import { useLocale } from "next-intl";
import type { PlanAuthoringDataSource } from "./dataSource";
import { createPlanAuthoringDataSource } from "./planAuthoringDataSource";

export function usePlanAuthoringDataSource(planId: number): PlanAuthoringDataSource {
  const client = useApolloClient();
  const locale = useLocale();
  return useMemo(
    () => createPlanAuthoringDataSource({ client, planId, locale }),
    [client, planId, locale]
  );
}
