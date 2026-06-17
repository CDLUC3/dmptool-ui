import { TypePolicies } from '@apollo/client';

/**
 * Type policies for guidance-related types.
 * GuidanceItem.id is not globally unique - it's only unique per tag.
 * Multiple organizations can have items with id: 1, so we disable normalization.
 */
export const guidanceTypePolicies: TypePolicies = {
  GuidanceItem: {
    keyFields: false,
  },
  GuidanceSource: {
    fields: {
      items: { merge: false },
    },
  },
  CustomSectionErrors: {
    keyFields: false,
  }
};