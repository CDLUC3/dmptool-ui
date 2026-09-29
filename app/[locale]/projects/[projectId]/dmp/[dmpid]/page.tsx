"use client";

import { useParams } from "next/navigation";
import { LayoutContainer } from "@/components/Container";
import { PlanAuthoring, usePlanAuthoringDataSource } from "@/components/PlanAuthoring";
import PlanOverview from "./PlanOverview";
import styles from "./PlanAuthoringPage.module.scss";

export default function PlanOverviewPage() {
  const params = useParams();
  const dataSource = usePlanAuthoringDataSource(Number(params.dmpid));

  return (
    <PlanOverview>
      {(overview) => (
        <LayoutContainer className={styles.layout}>
          <PlanAuthoring overview={overview} dataSource={dataSource} />
        </LayoutContainer>
      )}
    </PlanOverview>
  );
}
