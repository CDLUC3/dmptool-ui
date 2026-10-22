import { redirect } from "@/i18n/routing";
import { sectionAnchorId } from "@/components/PlanAuthoring/model";
import { planAuthoringHref, type PlanRouteParams } from "../../planAuthoringHref";

export default async function PlanSectionRedirectPage({
  params,
}: {
  params: Promise<PlanRouteParams & { sid: string }>;
}) {
  const { sid, ...plan } = await params;
  redirect({
    href: planAuthoringHref(
      plan,
      sectionAnchorId({ kind: "base", versionedSectionId: Number(sid) })
    ),
    locale: plan.locale,
  });
}
