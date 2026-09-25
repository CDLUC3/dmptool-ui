/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { axe, toHaveNoViolations } from 'jest-axe';
import {
  RESEARCH_OUTPUT_QUESTION_TYPE,
  TEXT_AREA_QUESTION_TYPE,
  TEXT_FIELD_QUESTION_TYPE,
} from '@/lib/constants';
import PlanQuestionAnswer from '../index';
import type { PlanQuestionDefinition } from '../../model';

expect.extend(toHaveNoViolations);

jest.mock('next-intl', () => ({
  useTranslations: jest.fn((namespace: string) => (key: string) => `${namespace}.${key}`),
}));

jest.mock('react-aria-components', () => ({
  Button: ({ children, onPress, className }: any) => (
    <button type="button" className={className} onClick={onPress}>
      {children}
    </button>
  ),
}));

jest.mock('@/components/hooks/useRenderQuestionField', () => ({
  useRenderQuestionField: jest.fn(() => <div data-testid="question-field" />),
}));

jest.mock('@/components/Form/FormTextArea', () => {
  const MockFormTextArea = ({ label, value, onChange }: any) => (
    <label>
      {label}
      <textarea value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
  MockFormTextArea.displayName = 'MockFormTextArea';
  return MockFormTextArea;
});

jest.mock('@/components/SafeHtml', () => {
  const MockSafeHtml = ({ html }: any) => <div data-testid="safe-html">{html}</div>;
  MockSafeHtml.displayName = 'MockSafeHtml';
  return MockSafeHtml;
});

jest.mock('@/components/Form/ResearchOutputAnswerComponent', () => {
  const MockResearchOutputAnswerComponent = ({ rows, onSave, isDisabled, rowNavigation }: any) => (
    <div
      data-testid="research-output-list"
      data-row-count={rows.length}
      data-disabled={String(isDisabled)}
      data-add-href={rowNavigation?.addHref ?? ''}
    >
      <button type="button" onClick={() => onSave([])}>
        Remove all outputs
      </button>
    </div>
  );
  MockResearchOutputAnswerComponent.displayName = 'MockResearchOutputAnswerComponent';
  return MockResearchOutputAnswerComponent;
});

const researchOutputColumns = [
  {
    heading: 'Title',
    commonStandardId: 'title',
    content: { type: 'text', meta: { schemaVersion: '1.0' }, attributes: {} },
  },
];

const researchOutputRow = {
  columns: [
    {
      type: 'text',
      commonStandardId: 'title',
      meta: { schemaVersion: '1.0' },
      answer: 'Dataset A',
    },
  ],
};

const researchOutputQuestion = {
  identity: { kind: 'base', versionedQuestionId: 104 },
  sectionIdentity: { kind: 'base', versionedSectionId: 1 },
  title: 'Research outputs for this award',
  required: true,
  questionType: RESEARCH_OUTPUT_QUESTION_TYPE,
  parsedJson: { type: RESEARCH_OUTPUT_QUESTION_TYPE, columns: researchOutputColumns },
  answerJson: { type: RESEARCH_OUTPUT_QUESTION_TYPE, answer: [researchOutputRow] },
  hasAnswer: true,
  guidanceSources: [],
  comments: [],
  displayOrder: 1,
} as PlanQuestionDefinition;

const textQuestion = {
  ...researchOutputQuestion,
  identity: { kind: 'base', versionedQuestionId: 101 },
  title: 'Describe your data',
  questionType: TEXT_FIELD_QUESTION_TYPE,
  parsedJson: { type: TEXT_FIELD_QUESTION_TYPE },
  answerJson: { type: TEXT_FIELD_QUESTION_TYPE, answer: 'Some text' },
} as PlanQuestionDefinition;

const defaultProps = {
  onChange: jest.fn(),
  onStartEditing: jest.fn(),
};

describe('PlanQuestionAnswer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('research output question', () => {
    it('renders the research output list with rows from the draft answer', () => {
      render(
        <PlanQuestionAnswer
          {...defaultProps}
          question={researchOutputQuestion}
          mode="editing"
          draftAnswer={researchOutputQuestion.answerJson}
        />
      );

      const list = screen.getByTestId('research-output-list');
      expect(list).toHaveAttribute('data-row-count', '1');
      expect(list).toHaveAttribute('data-disabled', 'false');
      expect(screen.queryByTestId('question-field')).not.toBeInTheDocument();
    });

    it('passes row navigation and disabled state through to the list', () => {
      render(
        <PlanQuestionAnswer
          {...defaultProps}
          question={researchOutputQuestion}
          mode="editing"
          draftAnswer={researchOutputQuestion.answerJson}
          disabled
          rowNavigation={{ editHref: (index) => `/edit/${index}`, addHref: '/edit/new' }}
        />
      );

      const list = screen.getByTestId('research-output-list');
      expect(list).toHaveAttribute('data-add-href', '/edit/new');
      expect(list).toHaveAttribute('data-disabled', 'true');
    });

    it('rebuilds the answer JSON and saves when the list changes', async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();
      const onSaveNow = jest.fn().mockResolvedValue(true);

      render(
        <PlanQuestionAnswer
          {...defaultProps}
          onChange={onChange}
          onSaveNow={onSaveNow}
          question={researchOutputQuestion}
          mode="editing"
          draftAnswer={researchOutputQuestion.answerJson}
        />
      );

      await user.click(screen.getByRole('button', { name: 'Remove all outputs' }));

      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({
          type: RESEARCH_OUTPUT_QUESTION_TYPE,
          columnHeadings: ['Title'],
          answer: [],
        })
      );
      expect(onSaveNow).toHaveBeenCalledTimes(1);
    });

    it('still updates the draft when no onSaveNow is supplied', async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();

      render(
        <PlanQuestionAnswer
          {...defaultProps}
          onChange={onChange}
          question={researchOutputQuestion}
          mode="editing"
          draftAnswer={researchOutputQuestion.answerJson}
        />
      );

      await user.click(screen.getByRole('button', { name: 'Remove all outputs' }));

      expect(onChange).toHaveBeenCalledTimes(1);
    });

    it('falls back to the shared field when the question JSON has no columns', () => {
      render(
        <PlanQuestionAnswer
          {...defaultProps}
          question={{
            ...researchOutputQuestion,
            parsedJson: { type: RESEARCH_OUTPUT_QUESTION_TYPE },
          }}
          mode="editing"
          draftAnswer={null}
        />
      );

      expect(screen.queryByTestId('research-output-list')).not.toBeInTheDocument();
      expect(screen.getByTestId('question-field')).toBeInTheDocument();
    });

    it('has no accessibility violations', async () => {
      const { container } = render(
        <PlanQuestionAnswer
          {...defaultProps}
          question={researchOutputQuestion}
          mode="editing"
          draftAnswer={researchOutputQuestion.answerJson}
        />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('other question types', () => {
    it('renders the shared question field while editing', () => {
      render(
        <PlanQuestionAnswer
          {...defaultProps}
          question={textQuestion}
          mode="editing"
          draftAnswer={textQuestion.answerJson}
        />
      );

      expect(screen.getByTestId('question-field')).toBeInTheDocument();
    });

    it('shows the additional comment field when the question asks for it', async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();

      render(
        <PlanQuestionAnswer
          {...defaultProps}
          onChange={onChange}
          question={{
            ...textQuestion,
            parsedJson: { type: TEXT_FIELD_QUESTION_TYPE, showCommentField: true },
          }}
          mode="editing"
          draftAnswer={textQuestion.answerJson}
        />
      );

      await user.type(screen.getByLabelText('Global.labels.additionalComments'), 'x');

      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({ answer: 'Some text', comment: 'x' })
      );
    });
  });

  describe('view mode', () => {
    it('shows the plain answer and an edit control', async () => {
      const user = userEvent.setup();
      const onStartEditing = jest.fn();

      render(
        <PlanQuestionAnswer
          {...defaultProps}
          onStartEditing={onStartEditing}
          question={textQuestion}
          mode="view"
          draftAnswer={textQuestion.answerJson}
        />
      );

      expect(screen.getByText('Some text')).toBeInTheDocument();
      await user.click(screen.getByRole('button', { name: 'PlanAuthoring.answer.editAnswer' }));
      expect(onStartEditing).toHaveBeenCalledTimes(1);
    });

    it('renders rich text answers as HTML', () => {
      render(
        <PlanQuestionAnswer
          {...defaultProps}
          question={{ ...textQuestion, questionType: TEXT_AREA_QUESTION_TYPE }}
          mode="view"
          draftAnswer={{ type: TEXT_AREA_QUESTION_TYPE, answer: '<p>Rich</p>' }}
        />
      );

      expect(screen.getByTestId('safe-html')).toHaveTextContent('<p>Rich</p>');
    });

    it('joins list answers and shows any additional comment', () => {
      render(
        <PlanQuestionAnswer
          {...defaultProps}
          question={textQuestion}
          mode="view"
          draftAnswer={{ type: TEXT_FIELD_QUESTION_TYPE, answer: ['a', 'b'], comment: 'Because' }}
        />
      );

      expect(screen.getByText('a, b')).toBeInTheDocument();
      expect(screen.getByText('Global.labels.additionalComments')).toBeInTheDocument();
      expect(screen.getByText('Because')).toBeInTheDocument();
    });

    it('shows a not-answered message and hides edit when disabled', () => {
      render(
        <PlanQuestionAnswer
          {...defaultProps}
          question={textQuestion}
          mode="view"
          draftAnswer={null}
          disabled
        />
      );

      expect(screen.getByText('PlanAuthoring.answer.notAnsweredYet')).toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: 'PlanAuthoring.answer.editAnswer' })
      ).not.toBeInTheDocument();
    });
  });
});
