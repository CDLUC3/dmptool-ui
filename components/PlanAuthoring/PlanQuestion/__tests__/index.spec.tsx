/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { axe, toHaveNoViolations } from 'jest-axe';
import PlanQuestion from '../index';
import { TEXT_AREA_QUESTION_TYPE } from '@/lib/constants';
import { questionAnchorId, questionKey } from '../../model';
import {
  buildSampleAnswerDraft,
  getPlanSampleAnswers,
  resolveInitialAnswer,
} from '../../sampleAnswers';
import { usePlanQuestionController } from '../../usePlanQuestionController';

expect.extend(toHaveNoViolations);

// --- next-intl ---
jest.mock('next-intl', () => ({
  useTranslations: jest.fn((namespace: string) => (key: string) => `${namespace}.${key}`),
}));

// --- react-aria-components ---
jest.mock('react-aria-components', () => ({
  Button: ({ children, onPress, ...rest }: any) => (
    <button type="button" onClick={onPress} {...rest}>
      {children}
    </button>
  ),
}));

// --- @/lib/constants ---
jest.mock('@/lib/constants', () => ({
  TEXT_AREA_QUESTION_TYPE: 'textArea',
}));

// --- @/context/ToastContext ---
const mockToastAdd = jest.fn();
jest.mock('@/context/ToastContext', () => ({
  useToast: jest.fn(() => ({ add: mockToastAdd })),
}));

// --- ../model ---
jest.mock('../../model', () => ({
  questionKey: jest.fn((identity: any) => `key-${identity?.id ?? 'unknown'}`),
  questionAnchorId: jest.fn((identity: any) => `question-${identity?.id ?? 'unknown'}`),
}));

// --- ../sampleAnswers ---
jest.mock('../../sampleAnswers', () => ({
  buildSampleAnswerDraft: jest.fn((_type: string, html: string, _current: unknown) => ({
    fromSample: true,
    html,
  })),
  getPlanSampleAnswers: jest.fn(() => []),
  resolveInitialAnswer: jest.fn(() => ({ initial: true })),
}));

// --- ../usePlanQuestionController ---
const mockSaveNow = jest.fn().mockResolvedValue(undefined);
const mockSetDraftAnswer = jest.fn();
const mockSetMode = jest.fn();
const defaultControllerReturn = {
  mode: 'viewing',
  draftAnswer: { initial: true },
  saveState: 'idle',
  errorMessage: undefined,
  setDraftAnswer: mockSetDraftAnswer,
  setMode: mockSetMode,
  saveNow: mockSaveNow,
};
jest.mock('../../usePlanQuestionController', () => ({
  usePlanQuestionController: jest.fn(() => defaultControllerReturn),
}));

// --- child components ---
jest.mock('../../PlanQuestionHeader', () => {
  const MockPlanQuestionHeader = ({ question }: any) => (
    <div data-testid="question-header">{question?.title ?? 'header'}</div>
  );
  MockPlanQuestionHeader.displayName = 'MockPlanQuestionHeader';
  return MockPlanQuestionHeader;
});

jest.mock('../../PlanSampleAnswers', () => {
  const MockPlanSampleAnswers = ({ samples, onUseSample }: any) => (
    <div data-testid="sample-answers">
      {samples.map((s: any, i: number) => (
        <button key={i} type="button" onClick={() => onUseSample(s.html ?? '<p>sample</p>')}>
          Use sample {i}
        </button>
      ))}
    </div>
  );
  MockPlanSampleAnswers.displayName = 'MockPlanSampleAnswers';
  return MockPlanSampleAnswers;
});

jest.mock('../../PlanQuestionAnswer', () => {
  const MockPlanQuestionAnswer = ({ mode, disabled, onStartEditing }: any) => (
    <div data-testid="question-answer" data-mode={mode} data-disabled={String(disabled)}>
      <button type="button" onClick={onStartEditing}>
        Start editing
      </button>
    </div>
  );
  MockPlanQuestionAnswer.displayName = 'MockPlanQuestionAnswer';
  return MockPlanQuestionAnswer;
});

jest.mock('../../PlanQuestionSaveStatus', () => {
  const MockPlanQuestionSaveStatus = ({ state, errorMessage }: any) => (
    <div data-testid="save-status">
      {state}
      {errorMessage ? `:${errorMessage}` : ''}
    </div>
  );
  MockPlanQuestionSaveStatus.displayName = 'MockPlanQuestionSaveStatus';
  return MockPlanQuestionSaveStatus;
});

jest.mock('../../PlanQuestionSidebar', () => {
  const MockPlanQuestionSidebar = (props: any) => (
    <div data-testid="question-sidebar">
      <button type="button" onClick={() => props.onAddComment('a new comment')}>
        Add comment
      </button>
      <button type="button" onClick={() => props.onUpdateComment(1, 'updated text')}>
        Update comment
      </button>
      <button type="button" onClick={() => props.onDeleteComment(1)}>
        Delete comment
      </button>
      <button type="button" onClick={() => props.loadGuidance()}>
        Load guidance
      </button>
      <button type="button" onClick={() => props.loadComments()}>
        Load comments
      </button>
      <span data-testid="sidebar-can-comment">{String(props.canComment)}</span>
      <span data-testid="sidebar-can-customize">{String(props.canCustomize)}</span>
    </div>
  );
  MockPlanQuestionSidebar.displayName = 'MockPlanQuestionSidebar';
  return MockPlanQuestionSidebar;
});

const baseQuestion = {
  identity: { id: 42 },
  title: 'What is your data management approach?',
  questionType: 'textArea',
  answerJson: null,
  sampleText: null,
  useSampleTextAsDefault: false,
  guidanceSources: [],
  comments: [],
  hasAnswer: true,
} as any;

const baseCapabilities = {
  canEditAnswers: true,
  canCustomizeGuidance: true,
  canComment: true,
  canModerateComments: false,
} as any;

const mockDataSource = {
  loadGuidance: jest.fn().mockResolvedValue(undefined),
  loadComments: jest.fn().mockResolvedValue(undefined),
  addComment: jest.fn().mockResolvedValue({ id: 99 }),
  updateComment: jest.fn().mockResolvedValue(undefined),
  deleteComment: jest.fn().mockResolvedValue(undefined),
} as any;

const defaultProps = {
  question: baseQuestion,
  capabilities: baseCapabilities,
  currentUserId: 1,
  dataSource: mockDataSource,
  onCustomizeGuidance: jest.fn(),
};

describe('PlanQuestion', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (usePlanQuestionController as jest.Mock).mockReturnValue(defaultControllerReturn);
    (getPlanSampleAnswers as jest.Mock).mockReturnValue([]);
    (resolveInitialAnswer as jest.Mock).mockReturnValue({ initial: true });
  });

  it('renders the question header and answer components', () => {
    render(<PlanQuestion {...defaultProps} />);

    expect(screen.getByTestId('question-header')).toHaveTextContent(baseQuestion.title);
    expect(screen.getByTestId('question-answer')).toBeInTheDocument();
  });

  it('sets the article id and aria-labelledby using questionAnchorId', () => {
    render(<PlanQuestion {...defaultProps} />);

    const article = screen.getByRole('article');
    expect(article).toHaveAttribute('id', 'question-42');
    expect(article).toHaveAttribute('aria-labelledby', 'question-42-title');
    expect(questionAnchorId).toHaveBeenCalledWith(baseQuestion.identity);
  });

  it('calls questionKey with the question identity', () => {
    render(<PlanQuestion {...defaultProps} />);

    expect(questionKey).toHaveBeenCalledWith(baseQuestion.identity);
  });

  it('resolves the initial answer via resolveInitialAnswer', () => {
    render(<PlanQuestion {...defaultProps} />);

    expect(resolveInitialAnswer).toHaveBeenCalledWith(baseQuestion);
  });

  it('passes disabled=true to the answer component when canEditAnswers is false', () => {
    render(
      <PlanQuestion
        {...defaultProps}
        capabilities={{ ...baseCapabilities, canEditAnswers: false }}
      />
    );

    expect(screen.getByTestId('question-answer')).toHaveAttribute('data-disabled', 'true');
  });

  it('passes disabled=false to the answer component when canEditAnswers is true', () => {
    render(<PlanQuestion {...defaultProps} />);

    expect(screen.getByTestId('question-answer')).toHaveAttribute('data-disabled', 'false');
  });

  it('calls controller.setMode("editing") when the answer signals onStartEditing', async () => {
    const user = userEvent.setup();
    render(<PlanQuestion {...defaultProps} />);

    await user.click(screen.getByRole('button', { name: 'Start editing' }));

    expect(mockSetMode).toHaveBeenCalledWith('editing');
  });

  describe('sample answers', () => {
    it('shows sample answers when question is textArea, editing is allowed, and samples exist', () => {
      (getPlanSampleAnswers as jest.Mock).mockReturnValue([{ html: '<p>a</p>' }]);

      render(
        <PlanQuestion
          {...defaultProps}
          question={{ ...baseQuestion, questionType: TEXT_AREA_QUESTION_TYPE }}
        />
      );

      expect(screen.getByTestId('sample-answers')).toBeInTheDocument();
    });

    it('hides sample answers when the question type is not textArea', () => {
      (getPlanSampleAnswers as jest.Mock).mockReturnValue([{ html: '<p>a</p>' }]);

      render(
        <PlanQuestion
          {...defaultProps}
          question={{ ...baseQuestion, questionType: 'radioButtons' }}
        />
      );

      expect(screen.queryByTestId('sample-answers')).not.toBeInTheDocument();
    });

    it('hides sample answers when canEditAnswers is false', () => {
      (getPlanSampleAnswers as jest.Mock).mockReturnValue([{ html: '<p>a</p>' }]);

      render(
        <PlanQuestion
          {...defaultProps}
          question={{ ...baseQuestion, questionType: TEXT_AREA_QUESTION_TYPE }}
          capabilities={{ ...baseCapabilities, canEditAnswers: false }}
        />
      );

      expect(screen.queryByTestId('sample-answers')).not.toBeInTheDocument();
    });

    it('hides sample answers when there are no samples', () => {
      (getPlanSampleAnswers as jest.Mock).mockReturnValue([]);

      render(
        <PlanQuestion
          {...defaultProps}
          question={{ ...baseQuestion, questionType: TEXT_AREA_QUESTION_TYPE }}
        />
      );

      expect(screen.queryByTestId('sample-answers')).not.toBeInTheDocument();
    });

    it('builds a sample answer draft and shows a success toast when a sample is used', async () => {
      (getPlanSampleAnswers as jest.Mock).mockReturnValue([{ html: '<p>sample html</p>' }]);
      const user = userEvent.setup();

      render(
        <PlanQuestion
          {...defaultProps}
          question={{ ...baseQuestion, questionType: TEXT_AREA_QUESTION_TYPE }}
        />
      );

      await user.click(screen.getByRole('button', { name: 'Use sample 0' }));

      expect(buildSampleAnswerDraft).toHaveBeenCalledWith(
        TEXT_AREA_QUESTION_TYPE,
        '<p>sample html</p>',
        defaultControllerReturn.draftAnswer
      );
      expect(mockSetDraftAnswer).toHaveBeenCalledWith({ fromSample: true, html: '<p>sample html</p>' });
      expect(mockToastAdd).toHaveBeenCalledWith(
        'PlanAuthoring.sampleAnswers.sampleTextAdded',
        { type: 'success', timeout: 3000 }
      );
    });
  });

  describe('save button', () => {
    it('shows the Save button when canEditAnswers is true', () => {
      render(<PlanQuestion {...defaultProps} />);

      expect(screen.getByRole('button', { name: 'Global.buttons.save' })).toBeInTheDocument();
    });

    it('hides the Save button when canEditAnswers is false', () => {
      render(
        <PlanQuestion
          {...defaultProps}
          capabilities={{ ...baseCapabilities, canEditAnswers: false }}
        />
      );

      expect(screen.queryByRole('button', { name: 'Global.buttons.save' })).not.toBeInTheDocument();
    });

    it('calls controller.saveNow when Save is clicked', async () => {
      const user = userEvent.setup();
      render(<PlanQuestion {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: 'Global.buttons.save' }));

      expect(mockSaveNow).toHaveBeenCalledTimes(1);
    });
  });

  it("renders the save status with the controller's current state and error message", () => {
    (usePlanQuestionController as jest.Mock).mockReturnValue({
      ...defaultControllerReturn,
      saveState: 'error',
      errorMessage: 'Something went wrong',
    });

    render(<PlanQuestion {...defaultProps} />);

    expect(screen.getByTestId('save-status')).toHaveTextContent('error:Something went wrong');
  });

  describe('sidebar wiring', () => {
    it('passes canComment=true only when capabilities.canComment and question.hasAnswer are both true', () => {
      render(
        <PlanQuestion
          {...defaultProps}
          question={{ ...baseQuestion, hasAnswer: true }}
          capabilities={{ ...baseCapabilities, canComment: true }}
        />
      );

      expect(screen.getByTestId('sidebar-can-comment')).toHaveTextContent('true');
    });

    it('passes canComment=false when the question has no answer yet', () => {
      render(
        <PlanQuestion
          {...defaultProps}
          question={{ ...baseQuestion, hasAnswer: false }}
          capabilities={{ ...baseCapabilities, canComment: true }}
        />
      );

      expect(screen.getByTestId('sidebar-can-comment')).toHaveTextContent('false');
    });

    it('passes canComment=false when capabilities.canComment is false', () => {
      render(
        <PlanQuestion
          {...defaultProps}
          question={{ ...baseQuestion, hasAnswer: true }}
          capabilities={{ ...baseCapabilities, canComment: false }}
        />
      );

      expect(screen.getByTestId('sidebar-can-comment')).toHaveTextContent('false');
    });

    it('passes canCustomize through from capabilities.canCustomizeGuidance', () => {
      render(
        <PlanQuestion
          {...defaultProps}
          capabilities={{ ...baseCapabilities, canCustomizeGuidance: false }}
        />
      );

      expect(screen.getByTestId('sidebar-can-customize')).toHaveTextContent('false');
    });

    it('calls dataSource.loadGuidance with the question key when requested', async () => {
      const user = userEvent.setup();
      render(<PlanQuestion {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: 'Load guidance' }));

      expect(mockDataSource.loadGuidance).toHaveBeenCalledWith('key-42');
    });

    it('calls dataSource.loadComments with the question key when requested', async () => {
      const user = userEvent.setup();
      render(<PlanQuestion {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: 'Load comments' }));

      expect(mockDataSource.loadComments).toHaveBeenCalledWith('key-42');
    });

    it('calls dataSource.addComment with the question key and text when a comment is added', async () => {
      const user = userEvent.setup();
      render(<PlanQuestion {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: 'Add comment' }));

      expect(mockDataSource.addComment).toHaveBeenCalledWith('key-42', 'a new comment');
    });

    it('calls dataSource.updateComment with the question key, comment id, and text', async () => {
      const user = userEvent.setup();
      render(<PlanQuestion {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: 'Update comment' }));

      expect(mockDataSource.updateComment).toHaveBeenCalledWith('key-42', 1, 'updated text');
    });

    it('calls dataSource.deleteComment with the question key and comment id', async () => {
      const user = userEvent.setup();
      render(<PlanQuestion {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: 'Delete comment' }));

      expect(mockDataSource.deleteComment).toHaveBeenCalledWith('key-42', 1);
    });
  });

  describe('resize handle', () => {
    it('renders a separator with the resize aria-label and title', () => {
      render(<PlanQuestion {...defaultProps} />);

      const handle = screen.getByRole('separator');
      expect(handle).toHaveAttribute('aria-label', 'PlanAuthoring.question.resizeAria');
      expect(handle).toHaveAttribute('title', 'PlanAuthoring.question.resizeHint');
      expect(handle).toHaveAttribute('aria-orientation', 'horizontal');
    });

    it('sets height to the 280px floor when starting from a zero-height shell (ArrowDown)', () => {
      render(<PlanQuestion {...defaultProps} />);

      const article = screen.getByRole('article');
      const handle = screen.getByRole('separator');

      fireEvent.keyDown(handle, { key: 'ArrowDown' });

      expect(article).toHaveAttribute('data-resized', 'true');
      expect(article.getAttribute('style')).toContain('height: 280px');
    });

    it('stays at the 280px floor when starting from a zero-height shell (ArrowUp)', () => {
      render(<PlanQuestion {...defaultProps} />);

      const article = screen.getByRole('article');
      const handle = screen.getByRole('separator');

      fireEvent.keyDown(handle, { key: 'ArrowUp' });

      expect(article.getAttribute('style')).toContain('height: 280px');
    });

    it('resets the height on double-click', () => {
      render(<PlanQuestion {...defaultProps} />);

      const article = screen.getByRole('article');
      const handle = screen.getByRole('separator');

      fireEvent.keyDown(handle, { key: 'ArrowDown' });
      expect(article).toHaveAttribute('data-resized', 'true');

      fireEvent.doubleClick(handle);
      expect(article).toHaveAttribute('data-resized', 'false');
    });

    it('resets the height on Home key press', () => {
      render(<PlanQuestion {...defaultProps} />);

      const article = screen.getByRole('article');
      const handle = screen.getByRole('separator');

      fireEvent.keyDown(handle, { key: 'ArrowDown' });
      expect(article).toHaveAttribute('data-resized', 'true');

      fireEvent.keyDown(handle, { key: 'Home' });
      expect(article).toHaveAttribute('data-resized', 'false');
    });

    it('does not have a resized style before any interaction', () => {
      render(<PlanQuestion {...defaultProps} />);

      const article = screen.getByRole('article');
      expect(article).toHaveAttribute('data-resized', 'false');
      expect(article).not.toHaveAttribute('style');
    });
  });

  it('applies an additional className alongside the base styles', () => {
    render(<PlanQuestion {...defaultProps} className="extra-class" />);

    expect(screen.getByRole('article')).toHaveClass('extra-class');
  });

  it('passes accessibility tests', async () => {
    const { container } = render(<PlanQuestion {...defaultProps} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});