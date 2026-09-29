import { redirect } from "next/navigation";
import { sectionAnchorId } from "@/components/PlanAuthoring/model";
import { planAuthoringHref, type PlanRouteParams } from "../../planAuthoringHref";

export default async function PlanSectionRedirectPage({
  params,
}: {
  params: Promise<PlanRouteParams & { sid: string }>;
}) {
  const { sid, ...plan } = await params;
  redirect(
    planAuthoringHref(
      plan,
      sectionAnchorId({ kind: "base", versionedSectionId: Number(sid) })
    )
  );
}
