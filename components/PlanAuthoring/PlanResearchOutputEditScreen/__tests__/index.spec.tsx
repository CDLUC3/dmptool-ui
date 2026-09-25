/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { useRouter } from 'next/navigation';
import { RESEARCH_OUTPUT_QUESTION_TYPE } from '@/lib/constants';
import type { PlanAuthoringDataSource } from '../../dataSource';
import type { PlanAuthoringModel, PlanQuestionDefinition } from '../../model';
import { questionAnchorId, questionKey } from '../../model';
import PlanResearchOutputEditScreen from '../index';

jest.mock('next-intl', () => ({
  useLocale: () => 'en-US',
  useTranslations: jest.fn((namespace: string) => (key: string) => `${namespace}.${key}`),
}));

jest.mock('@/i18n/routing', () => ({
  Link: ({ href, children }: any) => <a href={href}>{children}</a>,
}));

jest.mock('@/components/PageHeader', () => {
  const MockPageHeader = ({ title }: any) => <h1>{title}</h1>;
  MockPageHeader.displayName = 'MockPageHeader';
  return MockPageHeader;
});

jest.mock('@/components/Container', () => ({
  LayoutContainer: ({ children }: any) => <div>{children}</div>,
  ContentContainer: ({ children }: any) => <div>{children}</div>,
}));

jest.mock('@/components/ErrorMessages', () => {
  const MockErrorMessages = ({ errors }: any) => <div role="alert">{errors.join(' ')}</div>;
  MockErrorMessages.displayName = 'MockErrorMessages';
  return MockErrorMessages;
});

jest.mock('../../PlanQuestionHeader', () => {
  const MockPlanQuestionHeader = ({ question }: any) => <h2>{question.title}</h2>;
  MockPlanQuestionHeader.displayName = 'MockPlanQuestionHeader';
  return MockPlanQuestionHeader;
});

jest.mock('../../PlanQuestionSidebar', () => {
  const MockPlanQuestionSidebar = () => <aside>sidebar</aside>;
  MockPlanQuestionSidebar.displayName = 'MockPlanQuestionSidebar';
  return MockPlanQuestionSidebar;
});

jest.mock('../../PlanGuidanceCustomizeDialog', () => {
  const MockPlanGuidanceCustomizeDialog = () => null;
  MockPlanGuidanceCustomizeDialog.displayName = 'MockPlanGuidanceCustomizeDialog';
  return MockPlanGuidanceCustomizeDialog;
});

jest.mock(
  '@/components/Form/ResearchOutputAnswerComponent/SingleResearchOutputComponent',
  () => {
    const MockSingleResearchOutput = ({ onSave, onCancel, isNewEntry }: any) => (
      <div>
        <span data-testid="entry-mode">{isNewEntry ? 'new' : 'edit'}</span>
        <button type="button" onClick={onSave}>Save output</button>
        <button type="button" onClick={onCancel}>Cancel output</button>
      </div>
    );
    MockSingleResearchOutput.displayName = 'MockSingleResearchOutput';
    return MockSingleResearchOutput;
  }
);

const parsedJson = {
  type: RESEARCH_OUTPUT_QUESTION_TYPE,
  columns: [
    {
      heading: 'Title',
      commonStandardId: 'title',
      content: { type: 'text', meta: { schemaVersion: '1.0' }, attributes: {} },
    },
  ],
};

const existingRow = {
  columns: [
    {
      type: 'text',
      commonStandardId: 'title',
      meta: { schemaVersion: '1.0' },
      answer: 'Dataset A',
    },
  ],
};

function buildQuestion(): PlanQuestionDefinition {
  return {
    identity: { kind: 'base', versionedQuestionId: 104 },
    sectionIdentity: { kind: 'base', versionedSectionId: 1 },
    title: 'Research outputs for this award',
    required: true,
    questionType: RESEARCH_OUTPUT_QUESTION_TYPE,
    parsedJson,
    answerJson: {
      type: RESEARCH_OUTPUT_QUESTION_TYPE,
      answer: [existingRow],
    },
    hasAnswer: true,
    guidanceSources: [],
    comments: [],
    displayOrder: 1,
  };
}

function buildModel(): PlanAuthoringModel {
  return {
    title: 'Plan',
    templateName: 'Template',
    affiliationName: 'Org',
    templateVersion: '1',
    funderName: 'Funder',
    membersLabel: 'Members',
    relatedWorksLabel: 'Related works',
    currentUserId: 1,
    currentUserName: 'Ada',
    progress: { answeredQuestions: 1, totalQuestions: 1, percentComplete: 100 },
    capabilities: {
      canEditAnswers: true,
      canComment: true,
      canModerateComments: false,
      canCustomizeGuidance: false,
      canPublish: false,
    },
    sections: [
      {
        identity: { kind: 'base', versionedSectionId: 1 },
        title: 'Products',
        displayOrder: 1,
        questions: [buildQuestion()],
      },
    ],
    availableGuidanceOrgs: [],
    selectedGuidanceOrgIds: [],
  };
}

function buildDataSource(
  saveAnswer: PlanAuthoringDataSource['saveAnswer'] = jest.fn().mockResolvedValue({ success: true })
): PlanAuthoringDataSource {
  const current = buildModel();
  return {
    getModel: () => current,
    subscribe: () => () => undefined,
    saveAnswer,
    loadGuidance: jest.fn().mockResolvedValue([]),
    loadComments: jest.fn().mockResolvedValue([]),
    addComment: jest.fn(),
    updateComment: jest.fn(),
    deleteComment: jest.fn(),
    searchGuidanceOrgs: jest.fn().mockResolvedValue([]),
    setSelectedGuidanceOrgs: jest.fn().mockResolvedValue([]),
  };
}

const planHref = '/styleguide/components/plan-authoring';
const questionKeyParam = questionKey(buildQuestion().identity);
const returnHref = `/en-US${planHref}#${questionAnchorId(buildQuestion().identity)}`;

describe('PlanResearchOutputEditScreen', () => {
  const mockPush = jest.fn();

  beforeEach(() => {
    mockPush.mockReset();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
  });

  it('shows the not-found state for an unknown question', () => {
    render(
      <PlanResearchOutputEditScreen
        dataSource={buildDataSource()}
        questionKeyParam="base-question-999"
        rowIndexParam="0"
        planHref={planHref}
      />
    );

    expect(screen.getByRole('heading', { name: 'PlanAuthoring.researchOutput.notFoundTitle' })).toBeInTheDocument();
    expect(screen.getByText('PlanAuthoring.researchOutput.notFoundBody')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'PlanAuthoring.researchOutput.backToPlan' })).toHaveAttribute(
      'href',
      planHref
    );
  });

  it('shows the not-found state when the row index is out of range', () => {
    render(
      <PlanResearchOutputEditScreen
        dataSource={buildDataSource()}
        questionKeyParam={questionKeyParam}
        rowIndexParam="4"
        planHref={planHref}
      />
    );

    expect(screen.getByRole('heading', { name: 'PlanAuthoring.researchOutput.notFoundTitle' })).toBeInTheDocument();
  });

  it('opens an existing row for edit and returns to the plan on save', async () => {
    const user = userEvent.setup();
    const saveAnswer = jest.fn().mockResolvedValue({ success: true });

    render(
      <PlanResearchOutputEditScreen
        dataSource={buildDataSource(saveAnswer)}
        questionKeyParam={questionKeyParam}
        rowIndexParam="0"
        planHref={planHref}
      />
    );

    expect(screen.getByRole('heading', { name: 'QuestionEdit.headings.editResearchOutput' })).toBeInTheDocument();
    expect(screen.getByText('Research outputs for this award')).toBeInTheDocument();
    expect(screen.getByTestId('entry-mode')).toHaveTextContent('edit');

    await user.click(screen.getByRole('button', { name: 'Save output' }));

    expect(saveAnswer).toHaveBeenCalledWith(
      questionKeyParam,
      expect.objectContaining({
        type: RESEARCH_OUTPUT_QUESTION_TYPE,
        answer: [existingRow],
      })
    );
    expect(mockPush).toHaveBeenCalledWith(returnHref);
  });

  it('appends a row when saving a new output', async () => {
    const user = userEvent.setup();
    const saveAnswer = jest.fn().mockResolvedValue({ success: true });

    render(
      <PlanResearchOutputEditScreen
        dataSource={buildDataSource(saveAnswer)}
        questionKeyParam={questionKeyParam}
        rowIndexParam="new"
        planHref={planHref}
      />
    );

    expect(screen.getByRole('heading', { name: 'QuestionEdit.headings.addResearchOutput' })).toBeInTheDocument();
    expect(screen.getByTestId('entry-mode')).toHaveTextContent('new');

    await user.click(screen.getByRole('button', { name: 'Save output' }));

    expect(saveAnswer).toHaveBeenCalledWith(
      questionKeyParam,
      expect.objectContaining({
        answer: [existingRow, expect.any(Object)],
      })
    );
    expect(mockPush).toHaveBeenCalledWith(returnHref);
  });

  it('shows the save error and stays on the page when save fails', async () => {
    const user = userEvent.setup();
    const saveAnswer = jest.fn().mockResolvedValue({
      success: false,
      error: 'Could not save',
    });

    render(
      <PlanResearchOutputEditScreen
        dataSource={buildDataSource(saveAnswer)}
        questionKeyParam={questionKeyParam}
        rowIndexParam="0"
        planHref={planHref}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Save output' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Could not save');
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('returns to the plan when cancel is pressed', async () => {
    const user = userEvent.setup();

    render(
      <PlanResearchOutputEditScreen
        dataSource={buildDataSource()}
        questionKeyParam={questionKeyParam}
        rowIndexParam="0"
        planHref={planHref}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Cancel output' }));

    expect(mockPush).toHaveBeenCalledWith(returnHref);
  });
});
