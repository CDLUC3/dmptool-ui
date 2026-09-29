import { redirect } from "next/navigation";
import { sectionAnchorId } from "@/components/PlanAuthoring/model";
import { planAuthoringHref, type PlanRouteParams } from "../../planAuthoringHref";

export default async function PlanCustomSectionRedirectPage({
  params,
}: {
  params: Promise<PlanRouteParams & { csid: string }>;
}) {
  const { csid, ...plan } = await params;
  redirect(
    planAuthoringHref(
      plan,
      sectionAnchorId({ kind: "custom", customSectionId: Number(csid) })
    )
  );
}
