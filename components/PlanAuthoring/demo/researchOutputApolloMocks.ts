import type { MockedResponse } from "@apollo/client/testing";
import {
  DefaultResearchOutputTypesDocument,
  MetadataStandardsByUrIsDocument,
  MetadataStandardsDocument,
  Re3RepositoryTypesListDocument,
  Re3SubjectListDocument,
  Re3byUrIsDocument,
  RecommendedLicensesDocument,
  RepositoriesDocument,
} from "@/generated/graphql";

/**
 * Apollo mocks for research-output form widgets used by the Plan Authoring
 * styleguide (and reusable in Jest). Keeps the public styleguide off the real
 * GraphQL auth path — login is not required for /styleguide.
 */
export const DEMO_RESEARCH_OUTPUT_APOLLO_MOCKS: MockedResponse[] = [
  {
    request: {
      query: RecommendedLicensesDocument,
      variables: { recommended: true },
    },
    maxUsageCount: Number.POSITIVE_INFINITY,
    result: {
      data: {
        recommendedLicenses: [
          {
            __typename: "License",
            name: "CC0-1.0",
            id: 54,
            uri: "https://spdx.org/licenses/CC0-1.0.json",
          },
          {
            __typename: "License",
            name: "CC-BY-4.0",
            id: 55,
            uri: "https://spdx.org/licenses/CC-BY-4.0.json",
          },
          {
            __typename: "License",
            name: "MIT",
            id: 56,
            uri: "https://spdx.org/licenses/MIT.json",
          },
        ],
      },
    },
  },
  {
    request: { query: DefaultResearchOutputTypesDocument },
    maxUsageCount: Number.POSITIVE_INFINITY,
    result: {
      data: {
        defaultResearchOutputTypes: [
          {
            __typename: "ResearchOutputType",
            id: 1,
            name: "Audiovisual",
            value: "audiovisual",
            description: "A series of visual representations.",
            errors: null,
          },
          {
            __typename: "ResearchOutputType",
            id: 4,
            name: "Dataset",
            value: "dataset",
            description: "Data encoded in a defined structure.",
            errors: null,
          },
          {
            __typename: "ResearchOutputType",
            id: 12,
            name: "Software",
            value: "software",
            description: "A computer program.",
            errors: null,
          },
          {
            __typename: "ResearchOutputType",
            id: 14,
            name: "Text",
            value: "text",
            description: "A resource consisting primarily of words.",
            errors: null,
          },
        ],
      },
    },
  },
  {
    request: { query: Re3RepositoryTypesListDocument },
    maxUsageCount: Number.POSITIVE_INFINITY,
    result: {
      data: {
        re3RepositoryTypesList: {
          __typename: "Re3RepositoryTypesList",
          totalCount: 2,
          types: [
            {
              __typename: "Re3RepositoryTypeCount",
              type: "disciplinary",
              count: 1,
            },
            { __typename: "Re3RepositoryTypeCount", type: "other", count: 1 },
          ],
        },
      },
    },
  },
  {
    request: { query: Re3SubjectListDocument },
    maxUsageCount: Number.POSITIVE_INFINITY,
    result: {
      data: {
        re3SubjectList: {
          __typename: "Re3SubjectList",
          totalCount: 1,
          subjects: [
            {
              __typename: "Re3SubjectCount",
              subject: "Earth Sciences",
              count: 1,
            },
          ],
        },
      },
    },
  },
  {
    request: {
      query: Re3byUrIsDocument,
      variables: () => true,
    },
    maxUsageCount: Number.POSITIVE_INFINITY,
    result: {
      data: {
        re3byURIs: [],
      },
    },
  },
  {
    request: {
      query: MetadataStandardsByUrIsDocument,
      variables: () => true,
    },
    maxUsageCount: Number.POSITIVE_INFINITY,
    result: {
      data: {
        metadataStandardsByURIs: [
          {
            __typename: "MetadataStandard",
            id: 1,
            name: "DataCite Metadata Schema",
            uri: "https://schema.datacite.org/",
            description: "DataCite metadata schema",
            keywords: ["datacite"],
            errors: null,
          },
        ],
      },
    },
  },
  {
    request: {
      query: MetadataStandardsDocument,
      variables: () => true,
    },
    maxUsageCount: Number.POSITIVE_INFINITY,
    result: {
      data: {
        metadataStandards: {
          __typename: "MetadataStandardSearchResult",
          hasNextPage: false,
          hasPreviousPage: false,
          currentOffset: 0,
          limit: 5,
          nextCursor: null,
          totalCount: 1,
          availableSortFields: [],
          items: [
            {
              __typename: "MetadataStandard",
              id: 1,
              name: "DataCite Metadata Schema",
              uri: "https://schema.datacite.org/",
              description: "DataCite metadata schema",
              keywords: ["datacite"],
              errors: null,
            },
          ],
        },
      },
    },
  },
  {
    request: {
      query: RepositoriesDocument,
      variables: () => true,
    },
    maxUsageCount: Number.POSITIVE_INFINITY,
    result: {
      data: {
        repositories: {
          __typename: "RepositorySearchResult",
          hasPreviousPage: false,
          hasNextPage: false,
          currentOffset: 0,
          availableSortFields: [],
          totalCount: 1,
          nextCursor: null,
          limit: 5,
          items: [
            {
              __typename: "Re3DataRepository",
              id: "zenodo",
              name: "Zenodo",
              description: "General-purpose open repository",
              uri: "https://www.re3data.org/repository/r3d100010468",
              website: "https://zenodo.org",
              repositoryTypes: ["other"],
              keywords: ["open"],
            },
          ],
        },
      },
    },
  },
];
