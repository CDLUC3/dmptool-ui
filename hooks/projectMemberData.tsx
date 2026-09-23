'use client'

import { useEffect, useState } from 'react';

// GraphQL
import { useQuery } from '@apollo/client/react';
import { ProjectMemberDocument } from '@/generated/graphql';

// Utils and other
import { ProjectMemberFormInterface } from '@/app/types';

// Custom hook to fetch project Member data
export const useProjectMemberData = (projectMemberId: number) => {
  const [projectMemberData, setProjectMemberData] = useState<ProjectMemberFormInterface>({
    givenName: '',
    surName: '',
    affiliationId: '',
    affiliationName: '',
    otherAffiliationName: '',
    email: '',
    orcid: '',
    isPrimaryContact: false,
  });

  // Keep track of which roles are checked
  const [checkboxRoles, setCheckboxRoles] = useState<string[]>([]);

  // Query for the specified project member
  const { data, loading, error: queryError } = useQuery(ProjectMemberDocument, {
    variables: {
      projectMemberId: Number(projectMemberId)
    },
    fetchPolicy: 'network-only', // Always fetch fresh data
  })

  useEffect(() => {
    // Update state values from data results
    if (data?.projectMember) {
      const projMember = data.projectMember;
      setProjectMemberData({
        givenName: projMember.givenName ?? '',
        surName: projMember?.surName ?? '',
        affiliationId: projMember?.affiliation?.uri ?? '',
        affiliationName: projMember?.affiliation?.displayName ?? '',
        otherAffiliationName: '',
        email: projMember?.email ?? '',
        orcid: projMember?.orcid ?? '',
        isPrimaryContact: projMember?.isPrimaryContact ?? false,
      })
      if (data.projectMember?.memberRoles) {
        const cleanedRoles = data.projectMember?.memberRoles.filter(role => role !== null && role !== undefined);
        const cleanedData = cleanedRoles.map(({ __typename, ...fields }) => fields);
        const selectedRoleLabels = cleanedData
          .map(role => {
            return role?.id?.toString() ?? '';
          })
        setCheckboxRoles(selectedRoleLabels);
      }
    }
  }, [data])


  return {
    projectMemberData,
    checkboxRoles,
    setCheckboxRoles,
    loading,
    setProjectMemberData,
    data,
    queryError
  };
};
