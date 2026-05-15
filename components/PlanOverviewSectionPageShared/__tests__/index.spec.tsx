import { render, screen, waitFor, act } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing/react';
import type { MockLink } from '@apollo/client/testing';
import { useParams } from 'next/navigation';
import { axe, toHaveNoViolations } from 'jest-axe';

import {
  MeDocument,
  PlanDocument,
  PublishedQuestionsDocument,
  PublishedSectionDocument,
  PublishedCustomSectionDocument,
  PublishedCustomQuestionsDocument,
  VersionedGuidanceDocument,
  GuidanceSourcesForPlanDocument
} from '@/generated/graphql';

// Mocks
import versionedQuestionMock from '../__mocks__/versionedQuestionMock';
import versionedSectionMock from '../__mocks__/versionedSectionMock';
import planMock from '../__mocks__/planMock';
import meMock from '../__mocks__/meMock';
import guidanceSourcesForPlanMock from '../__mocks__/guidanceSourcesForPlanMock';
import versionedGuidanceMock from '../__mocks__/versionedGuidanceMock';
import publishedCustomQuestionsMock from '../__mocks__/publishedCustomQuestionsMock';
import publishedCustomSectionMock from '../__mocks__/publishedCustomSectionMock';
import { PlanOverviewSectionPageShared, SectionPageConfig } from '@/components/PlanOverviewSectionPageShared';
import { routePath } from '@/utils/routes';

expect.extend(toHaveNoViolations);

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: jest.fn(() => jest.fn((key) => key)), // Mock `useTranslations`,
}));

// Mock the PageHeader component
jest.mock('@/components/PageHeader', () => ({
  __esModule: true,
  default: ({ title }: { title: string }) => (
    <div data-testid="mock-page-header">{title}</div>
  ),
}));


// Mock GuidancePanel component
jest.mock('@/components/GuidancePanel', () => ({
  __esModule: true,
  /* eslint-disable @typescript-eslint/no-explicit-any */
  default: ({ guidanceItems, sectionTags }: any) => (
    <div data-testid="mock-guidance-panel">
      <div data-testid="guidance-items-count">{guidanceItems.length}</div>
      <div data-testid="section-tags-count">{Object.keys(sectionTags).length}</div>
    </div>
  ),
}));

// Mock stripHtml utility
jest.mock('@/utils/general', () => ({
  stripHtml: jest.fn((text) => text),
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useParams: jest.fn(),
  useRouter: jest.fn(() => ({
    push: jest.fn(),
  })),
  notFound: jest.fn(),
}));

const mockParams = {
  projectId: '123',
  dmpid: '456',
  sid: '456',
};

const customMockParams = {
  projectId: '123',
  dmpid: '456',
  csid: '456',
};

const normalizedCollaborators = Array.isArray(planMock.project?.collaborators)
  ? planMock.project.collaborators
  : planMock.project?.collaborators
    ? [planMock.project.collaborators]
    : [];

const basePlanMock = {
  ...planMock,
  readOnly: false,
  feedbackStatus: { status: 'NONE' },
  project: {
    ...planMock.project,
    collaborators: normalizedCollaborators,
  },
};

const makePlanMock = (overrides: Partial<typeof basePlanMock> = {}) => ({
  ...basePlanMock,
  ...overrides,
  project: {
    ...basePlanMock.project,
    ...overrides.project,
  },
});

const mocks = [
  // Successful questions query
  {
    request: {
      query: PublishedQuestionsDocument,
      variables: { planId: 456, versionedSectionId: 456 },
    },
    result: {
      data: {
        publishedQuestions: versionedQuestionMock,
      },
    },
  },
  // Successful section query
  {
    request: {
      query: PublishedSectionDocument,
      variables: { versionedSectionId: 456 },
    },
    result: {
      data: {
        publishedSection: versionedSectionMock,
      },
    },
  },
  // Successful plan query
  {
    request: {
      query: PlanDocument,
      variables: { planId: 456 },
    },
    result: {
      data: {
        plan: basePlanMock,
      },
    },
  },
  // Successful me query
  {
    request: {
      query: MeDocument,
    },
    result: {
      data: {
        me: meMock,
      },
    },
  },
  {
    request: {
      query: VersionedGuidanceDocument,
      variables: {
        affiliationId: 'https://ror.org/03yrm5c26',
        tagIds: [1, 2],
      },
    },
    result: {
      data: {
        versionedGuidance: versionedGuidanceMock,
      },
    },
  },
  {
    request: {
      query: VersionedGuidanceDocument,
      variables: {
        affiliationId: 'https://ror.org/03yrm5c26',
        tagIds: [],
      },
    },
    result: {
      data: {
        versionedGuidance: versionedGuidanceMock,
      },
    },
  },
  {
    request: {
      query: GuidanceSourcesForPlanDocument,
      variables: {
        planId: 456,
        versionedSectionId: 456,
      },
    },
    result: {
      data: {
        guidanceSourcesForPlan: guidanceSourcesForPlanMock,
      },
    },
  },
];

const errorMocks = [
  // Questions query error
  {
    request: {
      query: PublishedQuestionsDocument,
      variables: { planId: 456, versionedSectionId: 456 },
    },
    error: new Error('Failed to fetch questions'),
  },
  // Section query success (for error test)
  {
    request: {
      query: PublishedSectionDocument,
      variables: { versionedSectionId: 456 },
    },
    result: {
      data: {
        publishedSection: versionedSectionMock,
      },
    },
  },
  // Plan query success (for error test)
  {
    request: {
      query: PlanDocument,
      variables: { planId: 456 },
    },
    result: {
      data: {
        plan: basePlanMock,
      },
    },
  },
  {
    request: {
      query: MeDocument,
    },
    result: {
      data: {
        me: meMock,
      },
    },
  },
  {
    request: {
      query: VersionedGuidanceDocument,
      variables: {
        affiliationId: 'https://ror.org/03yrm5c26',
        tagIds: [1, 2],
      },
    },
    result: {
      data: {
        versionedGuidance: versionedGuidanceMock,
      },
    },
  },
  {
    request: {
      query: VersionedGuidanceDocument,
      variables: {
        affiliationId: 'https://ror.org/03yrm5c26',
        tagIds: [],
      },
    },
    result: {
      data: {
        versionedGuidance: versionedGuidanceMock,
      },
    },
  },
  {
    request: {
      query: GuidanceSourcesForPlanDocument,
      variables: {
        planId: 456,
        versionedSectionId: 456,
      },
    },
    result: {
      data: {
        guidanceSourcesForPlan: guidanceSourcesForPlanMock,
      },
    },
  },
];

const customMocks = [
  {
    request: { query: MeDocument },
    result: { data: { me: meMock } },
  },
  {
    request: { query: PlanDocument, variables: { planId: 456 } },
    result: { data: { plan: basePlanMock } },
  },
  {
    request: {
      query: PublishedCustomSectionDocument,
      variables: { customSectionId: 456, planId: 456 },
    },
    result: { data: publishedCustomSectionMock },
  },
  {
    request: {
      query: PublishedCustomQuestionsDocument,
      variables: { planId: 456, versionedCustomSectionId: 456 },
    },
    result: { data: publishedCustomQuestionsMock },
  },
  {
    request: {
      query: PublishedQuestionsDocument,
      variables: { planId: 456, versionedSectionId: 456 },
    },
    result: {
      data: { publishedQuestions: [] },  // should never be called, but prevents Apollo errors if skip regresses
    },
  },
  {
    request: {
      query: VersionedGuidanceDocument,
      variables: { affiliationId: 'https://ror.org/03yrm5c26', tagIds: [1, 2] },
    },
    result: { data: { versionedGuidance: versionedGuidanceMock } },
  },
  {
    request: {
      query: VersionedGuidanceDocument,
      variables: { affiliationId: 'https://ror.org/03yrm5c26', tagIds: [] },
    },
    result: { data: { versionedGuidance: versionedGuidanceMock } },
  },
  {
    request: {
      query: GuidanceSourcesForPlanDocument,
      variables: { planId: 456, customSectionId: 456 },  // ← customSectionId not versionedSectionId
    },
    result: { data: { guidanceSourcesForPlan: guidanceSourcesForPlanMock } },
  },
  // Base queries are intentionally absent — skip guards prevent them firing
];

const withPlanOverride = (
  apolloMocks: readonly MockLink.MockedResponse[],
  planOverrides: Partial<typeof basePlanMock>
): MockLink.MockedResponse[] => apolloMocks.map((mock) => {
  if (mock.request.query === PlanDocument) {
    return {
      ...mock,
      result: {
        data: {
          plan: makePlanMock(planOverrides),
        },
      },
    };
  }
  return mock;
});

const baseConfig: SectionPageConfig = {
  sectionIdParamKey: 'sid',
  questionsDocument: PublishedQuestionsDocument,
  questionsVariableKey: 'versionedSectionId',
  sectionDocument: PublishedSectionDocument,
  buildSectionVariables: ({ sectionId }) => ({ versionedSectionId: sectionId }),
  extractQuestions: (data) => (data as any)?.publishedQuestions,
  extractSection: (data) => (data as any)?.publishedSection,
  extractBreadcrumbName: (data) => (data as any)?.publishedSection?.name,
  buildQuestionLink: ({ projectId, dmpId, sectionId, question }) =>
    question.questionType === 'BASE'
      ? routePath('projects.dmp.versionedQuestion.detail', {
        projectId, dmpId,
        versionedSectionId: sectionId,
        versionedQuestionId: String(question.versionedQuestionId)
      })
      : routePath('projects.dmp.customQuestion.underVersionedSection', {
        projectId, dmpId,
        sid: sectionId,
        cqid: String(question.customQuestionId)
      }),
  sectionType: 'BASE',
  buildGuidanceMutationParams: ({ planId, sectionId }) => ({
    planId,
    versionedSectionId: sectionId,
    customSectionId: undefined,
  }),
};

const customConfig: SectionPageConfig = {
  sectionIdParamKey: 'csid',
  questionsDocument: PublishedCustomQuestionsDocument,
  questionsVariableKey: 'versionedCustomSectionId',
  sectionDocument: PublishedCustomSectionDocument,
  buildSectionVariables: ({ sectionId, planId }) => ({ customSectionId: sectionId, planId }),
  extractQuestions: (data) => (data as any)?.publishedCustomQuestions,
  extractSection: (data) => (data as any)?.publishedCustomSection,
  extractBreadcrumbName: (data) => (data as any)?.publishedCustomSection?.name,
  buildQuestionLink: ({ projectId, dmpId, sectionId, question }) =>
    routePath('projects.dmp.customQuestion.underCustomSection', {
      projectId, dmpId,
      csid: sectionId,
      cqid: String(question.customQuestionId)
    }),
  sectionType: 'CUSTOM',
  buildGuidanceMutationParams: ({ planId, sectionId }) => ({
    planId,
    versionedSectionId: sectionId,
    customSectionId: sectionId,
  }),
};

describe('PlanOverviewSectionPage - BASE section with BASE questions or CUSTOM questions', () => {
  beforeEach(() => {
    (useParams as jest.Mock).mockReturnValue(mockParams);
    jest.clearAllMocks();
  });

  it('should render the page with questions and section data', async () => {
    render(
      <MockedProvider mocks={mocks}>
        <PlanOverviewSectionPageShared config={baseConfig} />
      </MockedProvider>

    );

    // Check that initial questions are loaded
    await waitFor(() =>
      expect(screen.getByText('What types of data will be produced during your project?')).toBeInTheDocument()
    );

    // Check that questions are rendered
    expect(screen.getByText('What type of metadata will be collected?')).toBeInTheDocument();
    expect(screen.getByText('Will all data be converted to open source formats?')).toBeInTheDocument();

    // Check that section name is used in page title
    expect(screen.getByTestId('mock-page-header')).toBeInTheDocument();

    // Check that requirements section is rendered
    expect(screen.getByText('headings.requirementsBy')).toBeInTheDocument();
    expect(screen.getByText('Requirements text for the section')).toBeInTheDocument();

    // Check for mock sidebar
    expect(screen.getByTestId('mock-guidance-panel')).toBeInTheDocument();

  });

  it('should handle empty questions list', async () => {
    render(
      <MockedProvider mocks={mocks}>
        <PlanOverviewSectionPageShared config={baseConfig} />
      </MockedProvider>

    );

    // Check that initial questions are loaded
    await waitFor(() =>
      expect(screen.getByText('Requirements text for the section')).toBeInTheDocument()
    );

    // Check that other content is still rendered
    expect(screen.getByText('headings.requirementsBy')).toBeInTheDocument();
    // Check for mock sidebar
    expect(screen.getByTestId('mock-guidance-panel')).toBeInTheDocument();
  });

  it('should handle GraphQL errors gracefully', async () => {
    render(
      <MockedProvider mocks={errorMocks}>
        <PlanOverviewSectionPageShared config={baseConfig} />
      </MockedProvider>

    );

    // Wait for error to be displayed
    await waitFor(() => {
      expect(screen.getByText('errors.errorLoadingSections')).toBeInTheDocument();
    });
  });

  it('should render question cards with proper structure', async () => {
    render(
      <MockedProvider mocks={mocks}>
        <PlanOverviewSectionPageShared config={baseConfig} />
      </MockedProvider>

    );

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('What types of data will be produced during your project?')).toBeInTheDocument();
    });

    // Check that question cards are rendered
    const questionCards = screen.getAllByRole('region').filter(section =>
      section.className.includes('questionCard')
    );
    expect(questionCards).toHaveLength(3);

    // Check first question card structure
    const firstCard = questionCards[0];
    expect(firstCard).toHaveAttribute('aria-labelledby', 'question-title-1');

    // Check question title
    const title = firstCard.querySelector('h3');
    expect(title).toHaveTextContent('What types of data will be produced during your project?');
    expect(title).toHaveAttribute('id', 'question-title-1');

    // Check progress indicator
    const progressIndicator = firstCard.querySelector('.progressIndicator');
    expect(progressIndicator).toHaveAttribute('aria-label', 'Question status: question.notAnswered');

    // Check action button
    const actionButton = firstCard.querySelector('a[href*="/q/1"]');
    expect(actionButton).toHaveTextContent('sections.view');
  });

  it('should generate correct links for questions', async () => {
    render(
      <MockedProvider mocks={mocks}>
        <PlanOverviewSectionPageShared config={baseConfig} />
      </MockedProvider>

    );

    // Check that initial questions are loaded
    await waitFor(() =>
      expect(screen.getByText('Requirements text for the section')).toBeInTheDocument()
    );

    // Check that links are generated correctly
    const questionLinks = screen.getAllByText('sections.view');
    expect(questionLinks).toHaveLength(3);

    expect(questionLinks[0]).toHaveAttribute(
      'href',
      '/en-US/projects/123/dmp/456/s/456/q/1'
    );
    expect(questionLinks[1]).toHaveAttribute(
      'href',
      '/en-US/projects/123/dmp/456/s/456/q/2'
    );

    expect(questionLinks[2]).toHaveAttribute(
      'href',
      '/en-US/projects/123/dmp/456/s/456/q/3'
    );
  });

  it('should show view action for all questions when read only and user is not edit collaborator', async () => {
    const readOnlyMocks = withPlanOverride(mocks, {
      readOnly: true,
      project: {
        ...basePlanMock.project,
        collaborators: [
          {
            accessLevel: 'COMMENT',
            user: {
              id: meMock.id,
            },
          },
        ],
      },
    });

    render(
      <MockedProvider mocks={readOnlyMocks}>
        <PlanOverviewSectionPageShared config={baseConfig} />
      </MockedProvider>

    );

    await waitFor(() =>
      expect(screen.getByText('What types of data will be produced during your project?')).toBeInTheDocument()
    );

    expect(screen.getAllByText('sections.view')).toHaveLength(3);
    expect(screen.queryByText('sections.start')).not.toBeInTheDocument();
    expect(screen.queryByText('sections.update')).not.toBeInTheDocument();
  });

  it('should show start and update actions when read only and user is edit collaborator', async () => {
    const editCollaboratorMocks = withPlanOverride(mocks, {
      readOnly: true,
      project: {
        ...basePlanMock.project,
        collaborators: [
          {
            accessLevel: 'EDIT',
            user: {
              id: meMock.id,
            },
          },
        ],
      },
    });

    render(
      <MockedProvider mocks={editCollaboratorMocks}>
        <PlanOverviewSectionPageShared config={baseConfig} />
      </MockedProvider>

    );

    await waitFor(() =>
      expect(screen.getByText('What types of data will be produced during your project?')).toBeInTheDocument()
    );

    expect(screen.getAllByText('sections.start')).toHaveLength(2);
    expect(screen.getAllByText('sections.update')).toHaveLength(1);
    expect(screen.queryByText('sections.view')).not.toBeInTheDocument();
  });

  it('should show feedback notification when feedback is requested and plan is read only', async () => {
    const feedbackRequestedMocks = withPlanOverride(mocks, {
      readOnly: true,
      feedbackStatus: {
        status: 'REQUESTED',
      },
    });

    render(
      <MockedProvider mocks={feedbackRequestedMocks}>
        <PlanOverviewSectionPageShared config={baseConfig} />
      </MockedProvider>

    );

    await waitFor(() =>
      expect(screen.getByText('feedbackNotification.title')).toBeInTheDocument()
    );

    expect(screen.getByText('feedbackNotification.description')).toBeInTheDocument();
  });

  it('should generate correct completed description for questions', async () => {
    render(
      <MockedProvider mocks={mocks}>
        <PlanOverviewSectionPageShared config={baseConfig} />
      </MockedProvider>

    );

    // Check that initial questions are loaded
    await waitFor(() =>
      expect(screen.getByText('What types of data will be produced during your project?')).toBeInTheDocument()
    );

    expect(screen.getAllByLabelText('Question status: question.answered')).toHaveLength(1);
    expect(screen.getAllByLabelText('Question status: question.notAnswered')).toHaveLength(2);
  });

  it('should handle missing section data gracefully', async () => {
    // Clone the base mocks and override the PublishedSectionDocument result
    const missingSectionMocks = mocks.map(mock => {
      if (
        mock.request.query === PublishedSectionDocument &&
        mock.request.variables?.versionedSectionId === 456
      ) {
        return {
          ...mock,
          result: { data: { publishedSection: null } },
        };
      }
      return mock;
    });


    render(
      <MockedProvider mocks={missingSectionMocks}>
        <PlanOverviewSectionPageShared config={baseConfig} />
      </MockedProvider>

    );

    // Check that initial questions are loaded
    await waitFor(() =>
      expect(screen.getByText('What types of data will be produced during your project?')).toBeInTheDocument()
    );

    // Check that default section name is used
    expect(screen.getByTestId('mock-page-header')).toBeInTheDocument();
  });

  it('should handle null questions gracefully', async () => {
    const nullQuestionsMocks = mocks.map(mock => {
      if (
        mock.request.query === PublishedQuestionsDocument &&
        mock.request.variables?.planId === 456 &&
        mock.request.variables?.versionedSectionId === 456
      ) {
        return {
          ...mock,
          result: {
            data: {
              publishedQuestions: [null, ...versionedQuestionMock, null],
            },
          },
        };
      }
      return mock;
    });

    render(
      <MockedProvider mocks={nullQuestionsMocks}>
        <PlanOverviewSectionPageShared config={baseConfig} />
      </MockedProvider>
    );
    // Check that initial questions are loaded
    await waitFor(() =>
      expect(screen.getByText('What types of data will be produced during your project?')).toBeInTheDocument()
    );

    // Check that only valid questions are rendered (3 questions, not 5)
    const questionCards = screen.getAllByRole('region').filter(section =>
      section.className.includes('questionCard')
    );
    expect(questionCards).toHaveLength(3);
  });

  it('should pass accessibility tests', async () => {
    const { container } = render(
      <MockedProvider mocks={mocks}>
        <PlanOverviewSectionPageShared config={baseConfig} />
      </MockedProvider>
    );

    await waitFor(() =>
      expect(screen.getByText('What types of data will be produced during your project?')).toBeInTheDocument()
    );
    await waitFor(() => {
      expect(screen.queryByText('messaging.loading')).not.toBeInTheDocument();
    });

    let results;
    await act(async () => {
      results = await axe(container);
    });

    expect(results).toHaveNoViolations();
  });

  it('should handle missing question text gracefully', async () => {
    const incompleteMocks = mocks.map(mock => {
      if (
        mock.request.query === PublishedQuestionsDocument &&
        mock.request.variables?.planId === 456 &&
        mock.request.variables?.versionedSectionId === 456
      ) {
        return {
          ...mock,
          result: {
            data: {
              publishedQuestions: [
                {
                  id: 1,
                  questionText: null,
                  displayOrder: 1,
                  guidanceText: 'Guidance for question 1',
                  requirementText: 'Requirement for question 1',
                  sampleText: 'Sample for question 1',
                  versionedSectionId: 456,
                  versionedTemplateId: 789,
                  hasAnswer: false,
                },
              ],
            },
          },
        };
      }
      return mock;
    });

    render(
      <MockedProvider mocks={incompleteMocks}>
        <PlanOverviewSectionPageShared config={baseConfig} />
      </MockedProvider>
    );

    // Check that initial questions are loaded
    await waitFor(() =>
      expect(screen.getByText('Requirements text for the section')).toBeInTheDocument()
    );

    // Check that question card is still rendered with empty title
    const questionCards = screen.getAllByRole('region').filter(section =>
      section.className.includes('questionCard')
    );
    expect(questionCards).toHaveLength(1);

    const title = questionCards[0].querySelector('h3');
    expect(title).toHaveTextContent('');
  });
});

describe('PlanOverviewSectionPage - CUSTOM section with custom questions', () => {
  beforeEach(() => {
    (useParams as jest.Mock).mockReturnValue(customMockParams);
    jest.clearAllMocks();
  });

  it('should render the custom section name', async () => {
    render(
      <MockedProvider mocks={customMocks}>
        <PlanOverviewSectionPageShared config={customConfig} />
      </MockedProvider>
    );

    await waitFor(() =>
      expect(screen.getByText('Custom Section One')).toBeInTheDocument()
    );

    expect(screen.getByTestId('mock-page-header')).toBeInTheDocument();
    expect(screen.getByTestId('mock-guidance-panel')).toBeInTheDocument();
  });

  it('should render the custom question card', async () => {
    render(
      <MockedProvider mocks={customMocks}>
        <PlanOverviewSectionPageShared config={customConfig} />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Custom Radio Button Question')).toBeInTheDocument()
    });

    const questionCards = screen.getAllByRole('region').filter(s =>
      s.className.includes('questionCard')
    );
    expect(questionCards).toHaveLength(1);
  });

  it('should show not-answered status for the custom question', async () => {
    render(
      <MockedProvider mocks={customMocks}>
        <PlanOverviewSectionPageShared config={customConfig} />
      </MockedProvider>
    );

    await waitFor(() =>
      expect(screen.getByText('Custom Radio Button Question')).toBeInTheDocument()
    );

    expect(
      screen.getAllByLabelText('Question status: question.notAnswered')
    ).toHaveLength(1);
  });

  it('should link custom questions to the customQuestion route, not the versionedQuestion route', async () => {
    render(
      <MockedProvider mocks={customMocks}>
        <PlanOverviewSectionPageShared config={customConfig} />
      </MockedProvider>
    );

    await waitFor(() =>
      expect(screen.getByText('Custom Radio Button Question')).toBeInTheDocument()
    );

    const startLink = screen.getByText('sections.view');

    expect(startLink).toHaveAttribute('href', '/en-US/projects/123/dmp/456/cs/456/cq/7');

    // Verify it didn't fall back to versionedQuestion route (which would use 'undefined'
    // since versionedQuestionId is null on custom questions)
    expect(startLink).not.toHaveAttribute('href', expect.stringContaining('undefined'));
  });

  it('should not render the requirements heading when custom section requirements is empty', async () => {
    render(
      <MockedProvider mocks={customMocks}>
        <PlanOverviewSectionPageShared config={customConfig} />
      </MockedProvider>
    );

    await waitFor(() =>
      expect(screen.getByText('Custom Section One')).toBeInTheDocument()
    );

    // publishedCustomSectionMock has requirements: '' so the block is hidden
    expect(screen.queryByText('headings.requirementsBy')).not.toBeInTheDocument();
  });

  it('should handle an empty custom questions list', async () => {
    const emptyCustomMocks = customMocks.map(mock => {
      if (mock.request.query === PublishedCustomQuestionsDocument) {
        return { ...mock, result: { data: { publishedCustomQuestions: [] } } };
      }
      return mock;
    });

    render(
      <MockedProvider mocks={emptyCustomMocks}>
        <PlanOverviewSectionPageShared config={customConfig} />
      </MockedProvider>
    );

    await waitFor(() =>
      expect(screen.getByText('Custom Section One')).toBeInTheDocument()
    );

    // noQuestionsAvailable heading should appear
    expect(screen.getByText('headings.noQuestionsAvailable')).toBeInTheDocument();
  });
});
