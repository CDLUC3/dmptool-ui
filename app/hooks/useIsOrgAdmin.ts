// hooks/useIsOrgAdmin.ts
import { useMemo } from "react";

type Collaborator = {
  accessLevel?: string | null;
  user?: {
    id?: number | null;
    affiliation?: { id?: number | null } | null;
  } | null;
} | null;

// This hook determines if the current user is an Org Admin for the project based on their role and affiliation compared to the primary collaborator's affiliation.
export function useIsOrgAdmin(
  me: { role?: string | null; affiliation?: { id?: number | null } | null } | null | undefined,
  collaborators: Collaborator[] | null | undefined
): boolean {
  return useMemo(() => {
    const myRole = me?.role;
    const myAffiliationId = me?.affiliation?.id;

    if (!myRole || !myAffiliationId) return false;
    if (myRole !== "ADMIN" && myRole !== "SUPERADMIN") return false;

    const primaryCollaborator = collaborators?.find(
      (c) => c?.accessLevel === "PRIMARY"
    );

    if (!primaryCollaborator) return false;

    return primaryCollaborator.user?.affiliation?.id === myAffiliationId;
  }, [me?.role, me?.affiliation?.id, collaborators]);
}