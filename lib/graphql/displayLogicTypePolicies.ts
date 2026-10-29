import { TypePolicies } from '@apollo/client';

/**
 * Type policies for display logic queries.
 * These fields always return the complete list, so the incoming list should replace the cached one. Without
 * merge: false, Apollo warns about possible data loss when the list shrinks:
 * - questionConditionGroups: a question's display logic groups (e.g. after display logic is removed)
 * - triggerQuestionsForQuestion: the prior option questions a question's display logic can use (e.g. after a
 *   question is moved, deleted, or changed to a type without options)
 */
export const displayLogicTypePolicies: TypePolicies = {
  Query: {
    fields: {
      questionConditionGroups: { merge: false },
      triggerQuestionsForQuestion: { merge: false },
    },
  },
};
