"use client";

import { useParams } from "next/navigation";
import { useLocale } from "next-intl";
import { LayoutContainer } from "@/components/Container";
import { PlanAuthoring, usePlanAuthoringDataSource } from "@/components/PlanAuthoring";
import { toResearchOutputRowNavigation } from "@/components/PlanAuthoring/researchOutputAnswer";
import { routePath } from "@/utils/routes";
import PlanOverview from "./PlanOverview";
import styles from "./PlanAuthoringPage.module.scss";

export default function PlanOverviewPage() {
  const params = useParams();
  const locale = useLocale();
  const projectId = String(params.projectId);
  const dmpId = String(params.dmpid);
  const dataSource = usePlanAuthoringDataSource(Number(dmpId));

  return (
    <PlanOverview>
      {(overview) => (
        <LayoutContainer className={styles.layout}>
          <PlanAuthoring
            overview={overview}
            dataSource={dataSource}
            getResearchOutputRowNavigation={(question) =>
              toResearchOutputRowNavigation(question, (questionKey, rowIndex) =>
                routePath(
                  "projects.dmp.researchOutput",
                  { projectId, dmpId, questionKey, rowIndex },
                  {},
                  locale
                )
              )
            }
          />
        </LayoutContainer>
      )}
    </PlanOverview>
  );
}
