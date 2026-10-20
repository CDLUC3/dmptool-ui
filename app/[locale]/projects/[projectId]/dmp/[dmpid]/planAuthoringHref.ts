import { routePath } from "@/utils/routes";

export interface PlanRouteParams {
  locale: string;
  projectId: string;
  dmpid: string;
}

export function planAuthoringHref(
  { projectId, dmpid }: PlanRouteParams,
  anchorId: string
): string {
  return `${routePath("projects.dmp.show", { projectId, dmpId: dmpid })}#${anchorId}`;
}
