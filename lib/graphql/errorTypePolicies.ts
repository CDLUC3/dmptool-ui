import {
  TypePolicies,
  TypePolicy,
  FieldPolicy,
  FieldReadFunction
} from '@apollo/client';

// Define all types that have error fields
export const TYPES_WITH_ERRORS = [
  'Section',
  'Question',
  'Project',
  'ProjectFunding',
  'Plan',
  'PlanMember',
  'Template',
  'CustomSection',
  'CustomQuestion',
  'VersionedSection',
  'SectionCustomizationOverview', // Added for cache policy
] as const;

// Map of typeName to additional fields needing merge: false
const EXTRA_FIELDS: Record<string, string[]> = {
  Section: ['questions'],
  Question: ['conditionGroups'], // Display logic groups are always returned as the complete list
  Template: ['sections'],
  SectionCustomizationOverview: ['questions'], // Added for cache policy
};

// Typed read function
const errorRead: FieldReadFunction = (existing, { canRead }) => {
  return canRead(existing) ? existing : undefined;
};

/**
 * Creates type policies that set merge: false for error fields
 * on all specified types and  to always replace with new data. This prevents Apollo from trying to merge
 * error objects which have inconsistent shapes.
 * Apollo Client v4 made caching more aggressive, and changed some defaults
 * around object merging. Without this type policy, Apollo tries to merge error objects from different queries. And when it does, 
 * we get cache pollution and runtime errors.
 * Example:
  * // Step 1: Query returns Section with validation errors
    const section1 = {
    id: "123",
    errors: [{ field: "title", message: "Required" }]
  };

  // Step 2: Mutation returns same Section with different error structure
    const section2 = {
    id: "123", 
    errors: [{ code: "INVALID", details: {...} }]  // Different shape!
  };
  Apollo would try and merge these two error arrays, leading to a corrupted cache entry.
  By setting merge: false, we ensure that the latest data always replaces the old data in the cache.
  This keeps the cache consistent and avoids runtime errors due to unexpected data shapes.
 *
 * @param typeNames - Array of type names that have error fields
 * @returns TypePolicies object for Apollo Client
 */
export function createErrorTypePolicies(
  typeNames: readonly string[]
): TypePolicies {
  return typeNames.reduce<TypePolicies>((acc, typeName) => {
    const fields: TypePolicy['fields'] = {
      errors: {
        merge: false,
        read: errorRead,
      } satisfies FieldPolicy,
    };

    // Add extra fields with merge: false
    if (EXTRA_FIELDS[typeName]) {
      EXTRA_FIELDS[typeName].forEach((field) => {
        fields![field] = { merge: false };
      });
    }

    acc[typeName] = { fields };
    return acc;
  }, {});
}

export const errorTypePolicies = createErrorTypePolicies(TYPES_WITH_ERRORS);