import { redirect } from "@/i18n/routing";
import { questionAnchorId } from "@/components/PlanAuthoring/model";
import { planAuthoringHref, type PlanRouteParams } from "../../../../planAuthoringHref";

export default async function PlanCustomQuestionRedirectPage({
  params,
}: {
  params: Promise<PlanRouteParams & { sid: string; cqid: string }>;
}) {
  const { cqid, ...plan } = await params;
  redirect({
    href: planAuthoringHref(
      plan,
      questionAnchorId({ kind: "custom", customQuestionId: Number(cqid) })
    ),
    locale: plan.locale,
  });
}
