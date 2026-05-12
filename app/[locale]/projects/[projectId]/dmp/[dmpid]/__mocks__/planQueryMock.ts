export const mockPlanData = {
  plan: {
    id: 1,
    versionedTemplate: {
      template: {
        id: 2,
        name: "Generic DMP Template",
      },
      name: "NSF-CISE: Computer and Information Science and Engineering",
      owner: {
        uri: "https://ror.org/03yrm5c26",
        displayName: "California Digital Library (cdlib.org)"
      },
      version: "v2",
      created: "2025-10-23 18:16:20"
    },
    fundings: [
      {
        id: 1,
        projectFunding: {
          affiliation: {
            displayName: 'National Science Foundation (nsf.gov)'
          }
        }
      },
      {
        id: 3,
        projectFunding: {
          affiliation: {
            displayName: 'Irish Research Council (research.ie)'
          }
        }
      }
    ],
    visibility: "PUBLIC",
    status: "DRAFT",
    project: {
      fundings: [
        {
          affiliation: {
            displayName: "National Science Foundation (nsf.gov)"
          },
          funderOpportunityNumber: "NSF-12345-ABC"
        }
      ],
      title: "Reef Havens: Exploring the Role of Reef Ecosystems in Sustaining Eel Populations"
    },
    members: [
      {
        isPrimaryContact: true,
        projectMember: {
          givenName: "Captain",
          surName: "Nemo",
          email: null,
          orcid: "https://orcid.org/0000-0002-1234-5678",
          memberRoles: [
            {
              label: "Principal Investigator (PI)"
            }
          ]
        }
      }
    ],
    versionedSections: [
      {
        answeredQuestions: 1,
        displayOrder: 1,
        versionedSectionId: 7,
        title: "Roles & Responsibilities",
        totalQuestions: 1,
        customSectionId: null,
        sectionType: "BASE"
      },
      {
        answeredQuestions: 2,
        displayOrder: 2,
        versionedSectionId: null,
        title: "Metadata",
        totalQuestions: 5,
        customSectionId: 1,
        sectionType: "CUSTOM"
      },
      {
        answeredQuestions: 0,
        displayOrder: 3,
        versionedSectionId: 9,
        title: "Sharing/Copyright Issues",
        totalQuestions: 0
      },
      {
        answeredQuestions: 0,
        displayOrder: 4,
        versionedSectionId: 10,
        title: "Long Term Storage",
        totalQuestions: 0
      },
      {
        answeredQuestions: 0,
        displayOrder: 5,
        versionedSectionId: 11,
        title: "Research Products",
        totalQuestions: 1
      }
    ],
    planCreator: {
      id: 3,
      affiliation: {
        uri: "https://ror.org/03yrm5c26"
      }
    },
    created: "1741308996000",
    modified: "1741308996000",
    dmpId: "https://doi.org/10.2312/abc123",
    registered: null,
    title: 'Reef Havens: Exploring the Role of Reef Ecosystems in Sustaining Eel Populations'
  }
}
