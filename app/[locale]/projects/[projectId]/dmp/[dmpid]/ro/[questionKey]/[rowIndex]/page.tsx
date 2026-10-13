"use client";

import { useParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Breadcrumb, Breadcrumbs, Link } from "react-aria-components";
import {
  PlanResearchOutputEditScreen,
  usePlanAuthoringDataSource,
} from "@/components/PlanAuthoring";
import { routePath } from "@/utils/routes";

export default function PlanResearchOutputPage() {
  const params = useParams<{
    projectId: string;
    dmpid: string;
    questionKey: string;
    rowIndex: string;
  }>();
  const locale = useLocale();
  const Global = useTranslations("Global");
  const projectId = String(params.projectId);
  const dmpId = String(params.dmpid);
  const dataSource = usePlanAuthoringDataSource(Number(dmpId));
  const planHref = routePath("projects.dmp.show", { projectId, dmpId }, {}, locale);

  return (
    <PlanResearchOutputEditScreen
      dataSource={dataSource}
      questionKeyParam={String(params.questionKey ?? "")}
      rowIndexParam={String(params.rowIndex ?? "")}
      planHref={planHref}
      breadcrumbs={(currentPage) => (
        <Breadcrumbs aria-label={Global("breadcrumbs.navigation")}>
          <Breadcrumb>
            <Link href={routePath("app.home", {}, {}, locale)}>{Global("breadcrumbs.home")}</Link>
          </Breadcrumb>
          <Breadcrumb>
            <Link href={routePath("projects.index", {}, {}, locale)}>{Global("breadcrumbs.projects")}</Link>
          </Breadcrumb>
          <Breadcrumb>
            <Link href={routePath("projects.show", { projectId }, {}, locale)}>{Global("breadcrumbs.projectOverview")}</Link>
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
