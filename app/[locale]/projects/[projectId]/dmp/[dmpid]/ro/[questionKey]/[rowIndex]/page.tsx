"use client";

import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Breadcrumb, Breadcrumbs, Link } from "react-aria-components";
import {
  PlanResearchOutputEditScreen,
  usePlanAuthoringDataSource,
} from "@/components/PlanAuthoring";
import { routePath } from "@/utils/routes";
export default function PlanResearchOutputPage() {
  const { projectId, dmpid: dmpId, questionKey, rowIndex } = useParams<{
    projectId: string;
    dmpid: string;
    questionKey: string;
    rowIndex: string;
  }>();
  const Global = useTranslations("Global");
  const dataSource = usePlanAuthoringDataSource(Number(dmpId));
  const planHref = routePath("projects.dmp.show", { projectId, dmpId });

  return (
    <PlanResearchOutputEditScreen
      dataSource={dataSource}
      questionKeyParam={questionKey}
      rowIndexParam={rowIndex}
      planHref={planHref}
      breadcrumbs={(currentPage) => (
        <Breadcrumbs aria-label={Global("breadcrumbs.navigation")}>
          <Breadcrumb>
            <Link href={routePath("app.home")}>{Global("breadcrumbs.home")}</Link>
          </Breadcrumb>
          <Breadcrumb>
            <Link href={routePath("projects.index")}>{Global("breadcrumbs.projects")}</Link>
          </Breadcrumb>
          <Breadcrumb>
            <Link href={routePath("projects.show", { projectId })}>{Global("breadcrumbs.projectOverview")}</Link>
          </Breadcrumb>
          <Breadcrumb>
            <Link href={planHref}>{Global("breadcrumbs.planOverview")}</Link>
          </Breadcrumb>
          <Breadcrumb>{currentPage}</Breadcrumb>
        </Breadcrumbs>
      )}
    />
  );
}
