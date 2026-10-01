import { TypePolicies } from '@apollo/client';

/**
 * Type policies for display logic queries.
 * questionConditionGroups always returns the complete list of a question's display logic groups, so the
 * incoming list should replace the cached one. Without merge: false, Apollo warns about possible data loss
 * when the list shrinks (e.g. after display logic is removed from a question).
 */
export const displayLogicTypePolicies: TypePolicies = {
  Query: {
    fields: {
      questionConditionGroups: { merge: false },
    },
  },
};
