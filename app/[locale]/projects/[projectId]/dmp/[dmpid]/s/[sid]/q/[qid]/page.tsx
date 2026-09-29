import { redirect } from "next/navigation";
import { questionAnchorId } from "@/components/PlanAuthoring/model";
import { planAuthoringHref, type PlanRouteParams } from "../../../../planAuthoringHref";

export default async function PlanQuestionRedirectPage({
  params,
}: {
  params: Promise<PlanRouteParams & { sid: string; qid: string }>;
}) {
  const { qid, ...plan } = await params;
  redirect(
    planAuthoringHref(
      plan,
      questionAnchorId({ kind: "base", versionedQuestionId: Number(qid) })
    )
  );
}
