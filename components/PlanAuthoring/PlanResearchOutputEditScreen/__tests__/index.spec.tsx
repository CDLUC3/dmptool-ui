import React, { type ComponentProps } from 'react';
import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { axe, toHaveNoViolations } from 'jest-axe';
import { useRouter } from '@/i18n/routing';
import { RESEARCH_OUTPUT_QUESTION_TYPE } from '@/lib/constants';
import type { PlanAuthoringState } from '../../dataSource';
import type { PlanAuthoringModel } from '../../model';
import { questionAnchorId, questionKey } from '../../model';
import {
  createMockDataSource,
  makeComment,
  makeModel,
  makeQuestion,
  makeSection,
} from '../../mocks';
import { spyOnDataSource, type SpiedMockDataSource } from '../../mocks/spyOnDataSource';
import PlanResearchOutputEditScreen from '../index';
import type PageHeader from '@/components/PageHeader';
import type ErrorMessages from '@/components/ErrorMessages';
import type PlanQuestionHeader from '../../PlanQuestionHeader';
import type PlanQuestionSidebar from '../../PlanQuestionSidebar';
import type PlanGuidanceCustomizeDialog from '../../PlanGuidanceCustomizeDialog';
import type SingleResearchOutputComponent from '@/components/Form/ResearchOutputAnswerComponent/SingleResearchOutputComponent';

type MockPageHeaderProps = ComponentProps<typeof PageHeader>;
type MockErrorMessagesProps = ComponentProps<typeof ErrorMessages>;
type MockPlanQuestionHeaderProps = ComponentProps<typeof PlanQuestionHeader>;
type MockPlanQuestionSidebarProps = ComponentProps<typeof PlanQuestionSidebar>;
type MockPlanGuidanceCustomizeDialogProps = ComponentProps<typeof PlanGuidanceCustomizeDialog>;
type MockSingleResearchOutputProps = ComponentProps<typeof SingleResearchOutputComponent>;

expect.extend(toHaveNoViolations);

jest.mock('next-intl', () => ({
  useTranslations: jest.fn((namespace: string) => (key: string) => `${namespace}.${key}`),
}));

jest.mock('@/i18n/routing', () => ({
  Link: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>{children}</a>
  ),
  useRouter: jest.fn(),
}));

jest.mock('@/components/PageHeader', () => {
  const MockPageHeader = ({ title, breadcrumbs }: MockPageHeaderProps) => (
    <header>
      {breadcrumbs}
      <h1>{title}</h1>
    </header>
  );
  MockPageHeader.displayName = 'MockPageHeader';
  return MockPageHeader;
});

jest.mock('@/components/ErrorMessages', () => {
  const MockErrorMessages = ({ errors }: MockErrorMessagesProps) => <div role="alert">{Object.values(errors).join(' ')}</div>;
  MockErrorMessages.displayName = 'MockErrorMessages';
  return MockErrorMessages;
});

jest.mock('../../PlanQuestionHeader', () => {
  const MockPlanQuestionHeader = ({ question }: MockPlanQuestionHeaderProps) => <h2>{question.title}</h2>;
  MockPlanQuestionHeader.displayName = 'MockPlanQuestionHeader';
  return MockPlanQuestionHeader;
});

jest.mock('../../PlanQuestionSidebar', () => {
  const MockPlanQuestionSidebar = (props: MockPlanQuestionSidebarProps) => (
    <div>
      <span data-testid="sidebar-can-comment">{String(props.canComment)}</span>
      <button type="button" onClick={() => props.onAddComment('new comment')}>Add comment</button>
      <button type="button" onClick={() => props.onUpdateComment('answer-7', 'updated')}>Update comment</button>
      <button type="button" onClick={() => props.onDeleteComment('answer-7')}>Delete comment</button>
      <button type="button" onClick={() => props.onCustomize()}>Customize guidance</button>
    </div>
  );
  MockPlanQuestionSidebar.displayName = 'MockPlanQuestionSidebar';
  return MockPlanQuestionSidebar;
});

jest.mock('../../PlanGuidanceCustomizeDialog', () => {
  const MockPlanGuidanceCustomizeDialog = ({ isOpen, onSearch, onSave, onOpenChange }: MockPlanGuidanceCustomizeDialogProps) =>
    isOpen ? (
      <div role="dialog" aria-label="customize-guidance">
        <button type="button" onClick={() => onSearch('nih')}>Search orgs</button>
        <button
          type="button"
          onClick={async () => {
            await onSave(['org-1']);
            onOpenChange(false);
          }}
        >
          Save orgs
        </button>
      </div>
    ) : null;
  MockPlanGuidanceCustomizeDialog.displayName = 'MockPlanGuidanceCustomizeDialog';
  return MockPlanGuidanceCustomizeDialog;
});

jest.mock(
  '@/components/Form/ResearchOutputAnswerComponent/SingleResearchOutputComponent',
  () => {
    const MockSingleResearchOutput = ({ onSave, onCancel, isNewEntry, isDisabled, showButtons, setRows }: MockSingleResearchOutputProps) => (
      <div>
        <span data-testid="entry-mode">{isNewEntry ? 'new' : 'edit'}</span>
        <span data-testid="entry-disabled">{String(isDisabled)}</span>
        <button type="button" onClick={() => setRows([{ columns: [] }])}>Change output</button>
        {showButtons ? (
          <>
            <button type="button" onClick={onSave}>Save output</button>
            <button type="button" onClick={onCancel}>Cancel output</button>
          </>
        ) : null}
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

const question = makeQuestion({
  identity: { kind: 'base', versionedQuestionId: 104 },
  title: 'Research outputs for this award',
  questionType: RESEARCH_OUTPUT_QUESTION_TYPE,
  parsedJson,
  answerJson: { type: RESEARCH_OUTPUT_QUESTION_TYPE, answer: [existingRow] },
  hasAnswer: true,
  comments: [makeComment({ id: 'answer-7' })],
});

function buildModel(overrides: Partial<PlanAuthoringModel> = {}): PlanAuthoringModel {
  return makeModel({
    sections: [makeSection({ title: 'Products', questions: [question] })],
    ...overrides,
  });
}

function buildDataSource(
  options: { model?: PlanAuthoringModel; initialState?: PlanAuthoringState } = {}
): SpiedMockDataSource {
  return spyOnDataSource(createMockDataSource({ model: buildModel(), ...options }));
}

const planHref = '/styleguide/components/plan-authoring';
const questionKeyParam = questionKey(question.identity);
const returnHref = `${planHref}#${questionAnchorId(question.identity)}`;

function renderScreen({
  dataSource = buildDataSource(),
  questionKey = questionKeyParam,
  rowIndex = '0',
}: { dataSource?: SpiedMockDataSource; questionKey?: string; rowIndex?: string } = {}) {
  const view = render(
    <PlanResearchOutputEditScreen
      dataSource={dataSource}
      questionKeyParam={questionKey}
      rowIndexParam={rowIndex}
      planHref={planHref}
      breadcrumbs={(currentPage) => <nav aria-label="Breadcrumb">{currentPage}</nav>}
    />
  );
  return { ...view, dataSource };
}

describe('PlanResearchOutputEditScreen', () => {
  const mockPush = jest.fn();

  beforeEach(() => {
    mockPush.mockReset();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
  });

  it('shows a loading message until the plan is ready', () => {
    const dataSource = buildDataSource({ initialState: { status: 'loading' } });
    renderScreen({ dataSource });

    expect(screen.getByText('PlanAuthoring.screen.loadingPlan')).toBeInTheDocument();

    act(() => dataSource.setState({ status: 'ready', model: buildModel() }));

    expect(
      screen.getByRole('heading', { name: 'QuestionEdit.headings.editResearchOutput' })
    ).toBeInTheDocument();
  });

  it('shows the load error and retries through the data source', async () => {
    const user = userEvent.setup();
    const dataSource = buildDataSource({
      initialState: { status: 'error', message: 'Network down' },
    });
    renderScreen({ dataSource });

    expect(screen.getByRole('alert')).toHaveTextContent('Network down');

    await user.click(screen.getByRole('button', { name: 'PlanAuthoring.common.retry' }));
    expect(dataSource.reload).toHaveBeenCalledTimes(1);
  });

  it('shows the not-found state for an unknown question', () => {
    renderScreen({ questionKey: 'base-question-999' });

    expect(
      screen.getByRole('heading', { name: 'PlanAuthoring.researchOutput.notFoundTitle' })
    ).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Breadcrumb' })).toHaveTextContent(
      'PlanAuthoring.researchOutput.notFoundTitle'
    );
    expect(screen.getByText('PlanAuthoring.researchOutput.notFoundBody')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'PlanAuthoring.researchOutput.backToPlan' })
    ).toHaveAttribute('href', planHref);
  });

  it('shows the not-found state when the row index is out of range', () => {
    renderScreen({ rowIndex: '4' });

    expect(
      screen.getByRole('heading', { name: 'PlanAuthoring.researchOutput.notFoundTitle' })
    ).toBeInTheDocument();
  });

  it('opens an existing row for edit and returns to the plan on save', async () => {
    const user = userEvent.setup();
    const { dataSource } = renderScreen();

    expect(
      screen.getByRole('heading', { name: 'QuestionEdit.headings.editResearchOutput' })
    ).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Breadcrumb' })).toHaveTextContent(
      'QuestionEdit.headings.editResearchOutput'
    );
    expect(screen.getByText('Research outputs for this award')).toBeInTheDocument();
    expect(screen.getByTestId('entry-mode')).toHaveTextContent('edit');

    await user.click(screen.getByRole('button', { name: 'Save output' }));

    expect(dataSource.saveAnswer).toHaveBeenCalledWith(
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
    const { dataSource } = renderScreen({ rowIndex: 'new' });

    expect(
      screen.getByRole('heading', { name: 'QuestionEdit.headings.addResearchOutput' })
    ).toBeInTheDocument();
    expect(screen.getByTestId('entry-mode')).toHaveTextContent('new');

    await user.click(screen.getByRole('button', { name: 'Save output' }));

    expect(dataSource.saveAnswer).toHaveBeenCalledWith(
      questionKeyParam,
      expect.objectContaining({
        answer: [existingRow, expect.any(Object)],
      })
    );
    expect(mockPush).toHaveBeenCalledWith(returnHref);
  });

  it('shows the validation messages and stays on the page when the answer is invalid', async () => {
    const user = userEvent.setup();
    const dataSource = buildDataSource();
    dataSource.saveAnswer.mockResolvedValue({
      kind: 'invalid',
      messages: ['Title is required.'],
    });
    renderScreen({ dataSource });

    await user.click(screen.getByRole('button', { name: 'Save output' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Title is required.');
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('falls back to the generic save error when a failed save has no message', async () => {
    const user = userEvent.setup();
    const dataSource = buildDataSource();
    dataSource.saveAnswer.mockResolvedValue({ kind: 'failed' });
    renderScreen({ dataSource });

    await user.click(screen.getByRole('button', { name: 'Save output' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'PlanAuthoring.researchOutput.saveFailed'
    );
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('saves once when Save is pressed again before the first save finishes', async () => {
    const user = userEvent.setup();
    const dataSource = buildDataSource();
    let finishSave: () => void = () => undefined;
    dataSource.saveAnswer.mockImplementation(
      () => new Promise((resolve) => {
        finishSave = () => resolve({ kind: 'saved' });
      })
    );
    renderScreen({ dataSource, rowIndex: 'new' });

    const save = screen.getByRole('button', { name: 'Save output' });
    await user.click(save);
    await user.click(save);

    expect(dataSource.saveAnswer).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('entry-disabled')).toHaveTextContent('true');

    await act(async () => finishSave());
    expect(mockPush).toHaveBeenCalledWith(returnHref);
  });

  it('lets the user save again after a failed save', async () => {
    const user = userEvent.setup();
    const dataSource = buildDataSource();
    dataSource.saveAnswer.mockResolvedValueOnce({ kind: 'failed', message: 'Down' });
    renderScreen({ dataSource });

    await user.click(screen.getByRole('button', { name: 'Save output' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Down');
    expect(screen.getByTestId('entry-disabled')).toHaveTextContent('false');

    await user.click(screen.getByRole('button', { name: 'Save output' }));
    expect(dataSource.saveAnswer).toHaveBeenCalledTimes(2);
    expect(mockPush).toHaveBeenCalledWith(returnHref);
  });

  it('warns before the page unloads only while the row has unsaved changes', async () => {
    const user = userEvent.setup();
    renderScreen();

    const unload = () => {
      const event = new Event('beforeunload', { cancelable: true });
      window.dispatchEvent(event);
      return event.defaultPrevented;
    };
    expect(unload()).toBe(false);

    await user.click(screen.getByRole('button', { name: 'Change output' }));
    expect(unload()).toBe(true);

    await user.click(screen.getByRole('button', { name: 'Save output' }));
    await waitFor(() => expect(unload()).toBe(false));
  });

  it('returns to the plan when cancel is pressed', async () => {
    const user = userEvent.setup();
    renderScreen();

    await user.click(screen.getByRole('button', { name: 'Cancel output' }));

    expect(mockPush).toHaveBeenCalledWith(returnHref);
  });

  it('shows the row read-only when the viewer cannot edit answers', () => {
    const model = buildModel();
    renderScreen({
      dataSource: buildDataSource({
        model: { ...model, capabilities: { ...model.capabilities, canEditAnswers: false } },
      }),
    });

    expect(screen.getByTestId('entry-disabled')).toHaveTextContent('true');
    expect(screen.queryByRole('button', { name: 'Save output' })).not.toBeInTheDocument();
  });

  it('wires the sidebar comment actions to the data source', async () => {
    const user = userEvent.setup();
    const { dataSource } = renderScreen();

    expect(screen.getByTestId('sidebar-can-comment')).toHaveTextContent('true');

    await user.click(screen.getByRole('button', { name: 'Add comment' }));
    await user.click(screen.getByRole('button', { name: 'Update comment' }));
    await user.click(screen.getByRole('button', { name: 'Delete comment' }));

    expect(dataSource.addComment).toHaveBeenCalledWith(questionKeyParam, 'new comment');
    expect(dataSource.updateComment).toHaveBeenCalledWith(questionKeyParam, 'answer-7', 'updated');
    expect(dataSource.deleteComment).toHaveBeenCalledWith(questionKeyParam, 'answer-7');
  });

  it('opens the customize guidance dialog and saves the selected orgs', async () => {
    const user = userEvent.setup();
    const { dataSource } = renderScreen();

    expect(screen.queryByRole('dialog', { name: 'customize-guidance' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Customize guidance' }));
    const dialog = screen.getByRole('dialog', { name: 'customize-guidance' });

    await user.click(within(dialog).getByRole('button', { name: 'Search orgs' }));
    expect(dataSource.searchGuidanceOrgs).toHaveBeenCalledWith('nih');

    await user.click(within(dialog).getByRole('button', { name: 'Save orgs' }));
    expect(dataSource.setSelectedGuidanceOrgs).toHaveBeenCalledWith(['org-1']);
    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: 'customize-guidance' })).not.toBeInTheDocument();
    });
  });

  it('has no accessibility violations on the edit screen', async () => {
    const { container } = renderScreen();

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('has no accessibility violations on the not-found screen', async () => {
    const { container } = renderScreen({ questionKey: 'base-question-999' });

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
