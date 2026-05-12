import {
  TemplateCustomizationOverviewDocument,
  PublishTemplateCustomizationDocument,
  UnpublishTemplateCustomizationDocument,
  MoveCustomSectionDocument,
  RemoveTemplateCustomizationDocument,
  CustomizableObjectOwnership,
} from '@/generated/graphql';

// Mock data for template customization overview
export const mocks = [
  {
    request: {
      query: TemplateCustomizationOverviewDocument,
      variables: {
        templateCustomizationId: 1,
      },
    },
    result: {
      data: {
        templateCustomizationOverview: {
          __typename: 'TemplateCustomizationOverview',
          id: 1,
          versionedTemplateName: 'NSF-BIO: Biological Sciences',
          versionedTemplateAffiliationName: 'National Science Foundation',
          versionedTemplateVersion: '1.0',
          customizationLastCustomized: '2024-01-01T00:00:00Z',
          customizationIsDirty: false,
          customizationLastPublishedDate: '2024-01-01T00:00:00Z',
          sections: [
            {
              __typename: 'SectionCustomizationOverview',
              id: 1,
              name: 'Project Information',
              displayOrder: 1,
              sectionType: CustomizableObjectOwnership.Base,
              hasCustomRequirements: false,
              hasCustomGuidance: true,
              questions: [
                {
                  __typename: 'QuestionCustomizationOverview',
                  id: 1,
                  text: 'What is your project title?',
                  displayOrder: 1,
                  questionType: CustomizableObjectOwnership.Base,
                  hasCustomGuidance: true,
                  hasCustomSampleAnswer: false,
                },
                {
                  __typename: 'QuestionCustomizationOverview',
                  id: 2,
                  text: 'Describe your project',
                  displayOrder: 2,
                  questionType: CustomizableObjectOwnership.Base,
                  hasCustomGuidance: false,
                  hasCustomSampleAnswer: true,
                },
              ],
            },
            {
              __typename: 'SectionCustomizationOverview',
              id: 2,
              name: 'Custom Section',
              displayOrder: 2,
              sectionType: CustomizableObjectOwnership.Custom,
              hasCustomRequirements: true,
              hasCustomGuidance: true,
              questions: [
                {
                  __typename: 'QuestionCustomizationOverview',
                  id: 3,
                  text: 'Custom question',
                  displayOrder: 1,
                  questionType: CustomizableObjectOwnership.Custom,
                  hasCustomGuidance: false,
                  hasCustomSampleAnswer: false,
                },
              ],
            },
          ],
        },
      },
    },
  },
];

export const draftStatusMock = [
  {
    request: {
      query: TemplateCustomizationOverviewDocument,
      variables: {
        templateCustomizationId: 1,
      },
    },
    result: {
      data: {
        templateCustomizationOverview: {
          __typename: 'TemplateCustomizationOverview',
          id: 1,
          versionedTemplateName: 'NSF-BIO: Biological Sciences',
          versionedTemplateAffiliationName: 'National Science Foundation',
          versionedTemplateVersion: '1.0',
          customizationLastCustomized: '2024-01-01T00:00:00Z',
          customizationIsDirty: true,
          customizationLastPublishedDate: null,
          sections: [],
        },
      },
    },
  },
];

export const draftPublishSuccessMock = [
  ...draftStatusMock,
  // Need a second query mock for the refetch() call after publish
  ...draftStatusMock,
  {
    request: {
      query: PublishTemplateCustomizationDocument,
      variables: {
        templateCustomizationId: 1,
      },
    },
    result: {
      data: {
        publishTemplateCustomization: {
          __typename: 'TemplateCustomizationOverview',
          customizationId: 1,
          customizationIsDirty: false,
          customizationLastCustomized: '2024-01-01T00:00:00Z',
          customizationLastCustomizedById: 1,
          customizationLastCustomizedByName: 'Test User',
          customizationMigrationStatus: 'OK',
          customizationStatus: 'PUBLISHED',
          customizationLastPublishedDate: '2024-01-01T00:00:00Z',
          errors: null,
          sections: [],
          versionedTemplateAffiliationId: 'https://ror.org/test',
          versionedTemplateAffiliationName: 'National Science Foundation',
          versionedTemplateDescription: 'Test description',
          versionedTemplateId: 1,
          versionedTemplateLastModified: '2024-01-01T00:00:00Z',
          versionedTemplateName: 'NSF-BIO: Biological Sciences',
          versionedTemplateVersion: '1.0',
        },
      },
    },
  },
];

export const unpublishedChangesMock = [
  {
    request: {
      query: TemplateCustomizationOverviewDocument,
      variables: {
        templateCustomizationId: 1,
      },
    },
    result: {
      data: {
        templateCustomizationOverview: {
          __typename: 'TemplateCustomizationOverview',
          id: 1,
          versionedTemplateName: 'NSF-BIO: Biological Sciences',
          versionedTemplateAffiliationName: 'National Science Foundation',
          versionedTemplateVersion: '1.0',
          customizationLastCustomized: '2024-01-01T00:00:00Z',
          customizationIsDirty: true,
          customizationLastPublishedDate: '2023-12-01T00:00:00Z',
          sections: [],
        },
      },
    },
  },
];

export const notStartedMock = [
  {
    request: {
      query: TemplateCustomizationOverviewDocument,
      variables: {
        templateCustomizationId: 1,
      },
    },
    result: {
      data: {
        templateCustomizationOverview: {
          __typename: 'TemplateCustomizationOverview',
          id: 1,
          versionedTemplateName: 'NSF-BIO: Biological Sciences',
          versionedTemplateAffiliationName: 'National Science Foundation',
          versionedTemplateVersion: '1.0',
          customizationLastCustomized: null,
          customizationIsDirty: false,
          customizationLastPublishedDate: null,
          sections: [],
        },
      },
    },
  },
];

export const errorMock = [
  {
    request: {
      query: TemplateCustomizationOverviewDocument,
      variables: {
        templateCustomizationId: 1,
      },
    },
    error: new Error('Network error'),
  },
];

export const publishSuccessMock = [
  ...mocks,
  {
    request: {
      query: PublishTemplateCustomizationDocument,
      variables: {
        templateCustomizationId: 1,
      },
    },
    result: {
      data: {
        publishTemplateCustomization: {
          __typename: 'PublishTemplateCustomizationPayload',
          templateCustomization: {
            __typename: 'TemplateCustomization',
            id: 1,
          },
          errors: null,
        },
      },
    },
  },
];

export const unpublishSuccessMock = [
  ...mocks,
  ...mocks, //second copy for the refetch() call
  {
    request: {
      query: UnpublishTemplateCustomizationDocument,
      variables: {
        templateCustomizationId: 1,
      },
    },
    result: {
      data: {
        unpublishTemplateCustomization: {
          __typename: 'UnpublishTemplateCustomizationPayload',
          templateCustomization: {
            __typename: 'TemplateCustomization',
            id: 1,
          },
          errors: null,
        },
      },
    },
  },
];

export const unpublishErrorMock = [
  ...mocks,
  {
    request: {
      query: UnpublishTemplateCustomizationDocument,
      variables: {
        templateCustomizationId: 1,
      },
    },
    result: {
      data: {
        unpublishTemplateCustomization: {
          __typename: 'UnpublishTemplateCustomizationPayload',
          templateCustomization: null,
          errors: {
            general: 'Failed to unpublish customization',
          },
        },
      },
    },
  },
];

export const unpublishNoResultMock = [
  ...mocks,
  {
    request: {
      query: UnpublishTemplateCustomizationDocument,
      variables: {
        templateCustomizationId: 1,
      },
    },
    result: {
      data: {
        unpublishTemplateCustomization: null,
      },
    },
  },
];

export const unpublishNetworkErrorMock = [
  ...mocks,
  {
    request: {
      query: UnpublishTemplateCustomizationDocument,
      variables: {
        templateCustomizationId: 1,
      },
    },
    error: new Error('Network error'),
  },
];

export const publishErrorMock = [
  ...unpublishedChangesMock,
  {
    request: {
      query: PublishTemplateCustomizationDocument,
      variables: {
        templateCustomizationId: 1,
      },
    },
    result: {
      data: {
        publishTemplateCustomization: {
          __typename: 'PublishTemplateCustomizationPayload',
          templateCustomization: null,
          errors: {
            general: 'Failed to publish customization',
          },
        },
      },
    },
  },
];

export const publishNoResultMock = [
  ...draftStatusMock,
  {
    request: {
      query: PublishTemplateCustomizationDocument,
      variables: {
        templateCustomizationId: 1,
      },
    },
    result: {
      data: {
        publishTemplateCustomization: null,
      },
    },
  },
];

export const publishNetworkErrorMock = [
  ...draftStatusMock,
  {
    request: {
      query: PublishTemplateCustomizationDocument,
      variables: {
        templateCustomizationId: 1,
      },
    },
    error: new Error('Network error'),
  },
];

export const moveSectionSuccessMock = [
  ...mocks,
  ...mocks, // second copy for the refetch() call after successful move
  {
    request: {
      query: MoveCustomSectionDocument,
      variables: {
        input: {
          customSectionId: 2,
          newSectionId: null,
          newSectionType: null,
        },
      },
    },
    result: {
      data: {
        moveCustomSection: {
          __typename: 'MoveCustomSectionPayload',
          customSection: {
            __typename: 'CustomSection',
            id: 2,
          },
          errors: null,
        },
      },
    },
  },
];

export const moveSectionErrorMock = [
  ...mocks,
  {
    request: {
      query: MoveCustomSectionDocument,
      variables: {
        input: {
          customSectionId: 2,
          newSectionId: null,
          newSectionType: null,
        },
      },
    },
    result: {
      data: {
        moveCustomSection: {
          __typename: 'MoveCustomSectionPayload',
          customSection: null,
          errors: {
            general: 'Failed to move section',
          },
        },
      },
    },
  },
];

export const moveSectionNetworkErrorMock = [
  ...mocks,
  {
    request: {
      query: MoveCustomSectionDocument,
      variables: {
        input: {
          customSectionId: 2,
          newSectionId: null,
          newSectionType: null,
        },
      },
    },
    error: new Error('Network error'), // throws instead of returning data, triggering catch()
  },
];


export const deleteSuccessMock = [
  ...mocks,
  {
    request: {
      query: RemoveTemplateCustomizationDocument,
      variables: {
        templateCustomizationId: 1,
      },
    },
    result: {
      data: {
        removeTemplateCustomization: {
          __typename: 'RemoveTemplateCustomizationPayload',
          templateCustomization: {
            __typename: 'TemplateCustomization',
            id: 1,
          },
          errors: null,
        },
      },
    },
  },
];

export const deleteErrorMock = [
  ...mocks,
  {
    request: {
      query: RemoveTemplateCustomizationDocument,
      variables: {
        templateCustomizationId: 1,
      },
    },
    result: {
      data: {
        removeTemplateCustomization: {
          __typename: 'RemoveTemplateCustomizationPayload',
          templateCustomization: null,
          errors: {
            general: 'Failed to delete customization',
          },
        },
      },
    },
  },
];

export const deleteNetworkErrorMock = [
  ...mocks,
  {
    request: {
      query: RemoveTemplateCustomizationDocument,
      variables: {
        templateCustomizationId: 1,
      },
    },
    error: new Error('Network error'),
  },
];
