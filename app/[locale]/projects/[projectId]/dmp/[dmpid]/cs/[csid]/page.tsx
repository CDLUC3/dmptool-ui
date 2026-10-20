import { redirect } from "@/i18n/routing";
import { sectionAnchorId } from "@/components/PlanAuthoring/model";
import { planAuthoringHref, type PlanRouteParams } from "../../planAuthoringHref";

export default async function PlanCustomSectionRedirectPage({
  params,
}: {
  params: Promise<PlanRouteParams & { csid: string }>;
}) {
  const { csid, ...plan } = await params;
  redirect({
    href: planAuthoringHref(
      plan,
      sectionAnchorId({ kind: "custom", customSectionId: Number(csid) })
    ),
    locale: plan.locale,
  });
}
