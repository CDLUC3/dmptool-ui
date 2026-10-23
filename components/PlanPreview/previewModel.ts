import type { PlanCapabilities } from "@/components/PlanAuthoring/model";

// Customize guidance is shown so the button is visible; preview pages intercept it.
export const PREVIEW_CAPABILITIES: PlanCapabilities = {
  canEditAnswers: true,
  canComment: false,
  canModerateComments: false,
  canCustomizeGuidance: true,
};

export function byDisplayOrder(
  a: { displayOrder?: number | null },
  b: { displayOrder?: number | null }
) {
  return (a.displayOrder ?? 0) - (b.displayOrder ?? 0);
}
