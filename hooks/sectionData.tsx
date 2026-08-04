'use client'

import { useEffect, useState } from 'react';

// GraphQL
import { useQuery } from '@apollo/client/react';
import { SectionDocument, } from '@/generated/graphql';

// Utils and other
import { SectionFormInterface } from '@/app/types';
import { stripHtmlTags } from '@/utils/general';

export const useSectionData = (sectionId: number) => {
  const [sectionData, setSectionData] = useState<SectionFormInterface>({
    sectionName: '',
    sectionIntroduction: '',
    sectionRequirements: '',
    sectionGuidance: '',
    sectionTags: [],
    displayOrder: undefined,
    bestPractice: undefined
  });

  // Query for the specified section
  const { data, loading } = useQuery(SectionDocument, {
    variables: {
      sectionId: Number(sectionId)
    }
  })


  useEffect(() => {
    // Update state values from data results
    if (data?.section) {
      const section = data.section;
      const cleanedSectionName = stripHtmlTags(section.name);
      setSectionData({
        sectionName: cleanedSectionName,
        sectionIntroduction: section?.introduction ? section.introduction : '',
        sectionRequirements: section?.requirements ? section.requirements : '',
        sectionGuidance: section?.guidance ? section.guidance : '',
        displayOrder: section?.displayOrder ? section.displayOrder : undefined,
        bestPractice: section?.bestPractice ? Boolean(section.bestPractice) : undefined

      })
    }
  }, [data])


  return {
    sectionData,
    loading,
    setSectionData,
    data
  };
};
