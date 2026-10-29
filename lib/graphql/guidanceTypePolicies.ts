import { TypePolicies } from '@apollo/client';

/**
 * Type policies for guidance-related types.
 * GuidanceItem.id is not globally unique - it's only unique per tag.
 * Multiple organizations can have items with id: 1, so we disable normalization.
 * GuidanceSource.id is per org (e.g. `affiliation-<uri>`), but its items differ
 * per question, so sources are not normalized either.
 */
export const guidanceTypePolicies: TypePolicies = {
  GuidanceItem: {
    keyFields: false,
  },
  GuidanceSource: {
    keyFields: false,
    fields: {
      items: { merge: false },
    },
  },
  CustomSectionErrors: {
    keyFields: false,
  }
};