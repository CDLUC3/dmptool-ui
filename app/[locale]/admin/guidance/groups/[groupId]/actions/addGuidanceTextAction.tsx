"use server";

import { executeGraphQLMutation } from "@/utils/server/graphqlServerActionHandler";
import { ActionResponse } from "@/app/types";
import { AddGuidanceDocument } from "@/generated/graphql";

export async function addGuidanceTextAction({
  guidanceGroupId,
  guidanceText,
  tagId
}: {
  guidanceGroupId: number;
  guidanceText: string;
  tagId: number;
}): Promise<ActionResponse> {
  // Execute the mutation using the shared handler
  return await executeGraphQLMutation({
    document: AddGuidanceDocument,
    variables: {
      input: {
        guidanceGroupId,
        guidanceText,
        tagId
      }
    },
    dataPath: "addGuidance"
  });
}