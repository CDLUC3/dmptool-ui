import { act, fireEvent, render, screen } from '@/utils/test-utils';
import { axe, toHaveNoViolations } from 'jest-axe';
import DisplayLogicComponent from '../DisplayLogicComponent';
import { DisplayLogic, TriggerQuestionOption } from '@/app/types/displayLogic';

expect.extend(toHaveNoViolations);

const mockTriggerQuestions: TriggerQuestionOption[] = [
  {
    id: 3691,
    questionText: 'What type and format of data will your project generate or collect?',
    questionType: 'radioButtons',
    isMultiValue: false,
    options: [
      { label: 'Observational (e.g., sensor data, surveys, field notes)', value: 'Observational (e.g., sensor data, surveys, field notes)' },
      { label: 'Experimental (e.g., lab protocols, genetic sequencing)', value: 'Experimental (e.g., lab protocols, genetic sequencing)' },
    ],
  },
  {
    id: 3692,
    questionText: 'Which primary file formats will your data use?',
    questionType: 'radioButtons',
    isMultiValue: false,
    options: [
      { label: 'CSV', value: 'CSV' },
      { label: 'JSON', value: 'JSON' },
    ],
  },
];

// Multi-value trigger question, to exercise the OPERATOR_ITEMS_MULTI branch
// (single-value questions in mockTriggerQuestions only exercise OPERATOR_ITEMS_SINGLE).
const multiValueTriggerQuestion: TriggerQuestionOption = {
  id: 3693,
  questionText: 'Which file formats will you use? (select all that apply)',
  questionType: 'checkBoxes',
  isMultiValue: true,
  options: [
    { label: 'CSV', value: 'CSV' },
    { label: 'JSON', value: 'JSON' },
  ],
};

// Option label over MAX_OPTION_LABEL_LENGTH (60 chars), to exercise the truncation
// branch of truncateLabel — none of the mock labels above are long enough to hit it.
const LONG_OPTION_LABEL =
  'This is a very long option label that goes well past the sixty character limit';
const longLabelTriggerQuestion: TriggerQuestionOption = {
  id: 3694,
  questionText: 'A question with a long option label',
  questionType: 'radioButtons',
  isMultiValue: false,
  options: [{ label: LONG_OPTION_LABEL, value: 'long-option' }],
};

const makeDisplayLogic = (overrides?: Partial<DisplayLogic>): DisplayLogic => ({
  action: 'show',
  matchType: 'any',
  groups: [
    {
      id: 'group-1',
      triggerQuestionId: 3691,
      conditions: [
        { id: 'cond-1', operator: 'is', optionValue: 'Observational (e.g., sensor data, surveys, field notes)' },
      ],
    },
  ],
  ...overrides,
});

const defaultProps = {
  triggerQuestions: mockTriggerQuestions,
  onDisplayLogicChange: jest.fn(),
  onDisplayLogicSave: jest.fn().mockResolvedValue(undefined),
  onDisplayLogicRemove: jest.fn().mockResolvedValue(undefined),
  isSaving: false,
};

describe('DisplayLogicComponent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('empty state', () => {
    it('should show the "Add Display Logic" button when displayLogic is null and trigger questions exist', () => {
      render(<DisplayLogicComponent {...defaultProps} displayLogic={null} />);

      expect(screen.getByText('tabPanel.descriptions.displayLogic')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'tabPanel.buttons.addDisplayLogic' })).toBeInTheDocument();
    });

    it('should show a loading indicator instead of the add button while existing logic is loading', () => {
      render(<DisplayLogicComponent {...defaultProps} displayLogic={null} isLoadingExistingLogic />);

      expect(screen.getByText('messaging.loading')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'tabPanel.buttons.addDisplayLogic' })).not.toBeInTheDocument();
    });

    it('should show a message instead of the add button when there are no trigger questions', () => {
      render(<DisplayLogicComponent {...defaultProps} displayLogic={null} triggerQuestions={[]} />);

      expect(screen.getByText('tabPanel.helpText.noTriggerQuestionsAvailable')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'tabPanel.buttons.addDisplayLogic' })).not.toBeInTheDocument();
    });

    it('should call onDisplayLogicChange with a default DisplayLogic object when "Add Display Logic" is clicked', () => {
      const onDisplayLogicChange = jest.fn();
      render(
        <DisplayLogicComponent {...defaultProps} displayLogic={null} onDisplayLogicChange={onDisplayLogicChange} />
      );

      fireEvent.click(screen.getByRole('button', { name: 'tabPanel.buttons.addDisplayLogic' }));

      expect(onDisplayLogicChange).toHaveBeenCalledWith({
        action: 'show',
        matchType: 'any',
        groups: [
          {
            id: expect.any(String),
            triggerQuestionId: mockTriggerQuestions[0].id,
            conditions: [
              {
                id: expect.any(String),
                operator: 'is',
                optionValue: mockTriggerQuestions[0].options[0].value,
              },
            ],
          },
        ],
      });
    });
  });

  describe('top-level action and match type', () => {
    it('should update the action when the show/hide select changes', () => {
      const onDisplayLogicChange = jest.fn();
      const logic = makeDisplayLogic();

      const { container } = render(
        <DisplayLogicComponent {...defaultProps} displayLogic={logic} onDisplayLogicChange={onDisplayLogicChange} />
      );

      const actionSelect = container.querySelector('select[name="displayLogicAction"]') as HTMLSelectElement;
      fireEvent.change(actionSelect, { target: { value: 'hide' } });

      expect(onDisplayLogicChange).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'hide' })
      );
    });

    it('should update the match type when the any/all select changes', () => {
      const onDisplayLogicChange = jest.fn();
      const logic = makeDisplayLogic();

      const { container } = render(
        <DisplayLogicComponent {...defaultProps} displayLogic={logic} onDisplayLogicChange={onDisplayLogicChange} />
      );

      const matchTypeSelect = container.querySelector('select[name="displayLogicMatchType"]') as HTMLSelectElement;
      fireEvent.change(matchTypeSelect, { target: { value: 'all' } });

      expect(onDisplayLogicChange).toHaveBeenCalledWith(
        expect.objectContaining({ matchType: 'all' })
      );
    });
  });

  describe('group management', () => {
    it('should remove the correct group when its remove button is clicked', () => {
      const onDisplayLogicChange = jest.fn();
      const logic = makeDisplayLogic({
        groups: [
          { id: 'group-1', triggerQuestionId: 3691, conditions: [{ id: 'cond-1', operator: 'is', optionValue: 'Observational (e.g., sensor data, surveys, field notes)' }] },
          { id: 'group-2', triggerQuestionId: 3692, conditions: [{ id: 'cond-2', operator: 'is', optionValue: 'CSV' }] },
        ],
      });

      render(<DisplayLogicComponent {...defaultProps} displayLogic={logic} onDisplayLogicChange={onDisplayLogicChange} />);

      const removeButtons = screen.getAllByRole('button', { name: /tabPanel.buttons.removeGroupAriaLabel/ });
      fireEvent.click(removeButtons[0]);

      expect(onDisplayLogicChange).toHaveBeenCalledWith(
        expect.objectContaining({
          groups: [expect.objectContaining({ id: 'group-2' })],
        })
      );
    });

    it('should show "Add trigger question" when at least one trigger question is still unused', () => {
      const logic = makeDisplayLogic({
        groups: [
          { id: 'group-1', triggerQuestionId: 3691, conditions: [{ id: 'cond-1', operator: 'is', optionValue: 'Observational (e.g., sensor data, surveys, field notes)' }] },
        ],
      });

      render(<DisplayLogicComponent {...defaultProps} displayLogic={logic} />);

      // Only one trigger question is used, one remains — the "add another" button should still show
      expect(screen.getByRole('button', { name: 'tabPanel.buttons.addAnotherTriggerQuestion' })).toBeInTheDocument();
    });

    it('should hide "Add trigger question" once every trigger question is already in use', () => {
      const logic = makeDisplayLogic({
        groups: [
          { id: 'group-1', triggerQuestionId: 3691, conditions: [{ id: 'cond-1', operator: 'is', optionValue: 'Observational (e.g., sensor data, surveys, field notes)' }] },
          { id: 'group-2', triggerQuestionId: 3692, conditions: [{ id: 'cond-2', operator: 'is', optionValue: 'CSV' }] },
        ],
      });

      render(<DisplayLogicComponent {...defaultProps} displayLogic={logic} />);

      expect(screen.queryByRole('button', { name: 'tabPanel.buttons.addTriggerQuestion' })).not.toBeInTheDocument();
    });

    it('should add a new group with the next available trigger question when "Add trigger question" is clicked', () => {
      const onDisplayLogicChange = jest.fn();
      const logic = makeDisplayLogic({
        groups: [
          { id: 'group-1', triggerQuestionId: 3691, conditions: [{ id: 'cond-1', operator: 'is', optionValue: 'Observational (e.g., sensor data, surveys, field notes)' }] },
        ],
      });

      render(<DisplayLogicComponent {...defaultProps} displayLogic={logic} onDisplayLogicChange={onDisplayLogicChange} />);

      // A group already exists, so the button renders as "add another", not "add"
      fireEvent.click(screen.getByRole('button', { name: 'tabPanel.buttons.addAnotherTriggerQuestion' }));

      const [updatedLogic] = onDisplayLogicChange.mock.calls[0];
      expect(updatedLogic.groups).toHaveLength(2);
      expect(updatedLogic.groups[1].triggerQuestionId).toBe(3692);
    });

    it("should reset a group's conditions when its trigger question is changed", () => {
      const onDisplayLogicChange = jest.fn();
      const logic = makeDisplayLogic({
        groups: [
          {
            id: 'group-1',
            triggerQuestionId: 3691,
            conditions: [
              { id: 'cond-1', operator: 'is', optionValue: 'Observational (e.g., sensor data, surveys, field notes)' },
              { id: 'cond-2', operator: 'is_not', optionValue: 'Experimental (e.g., lab protocols, genetic sequencing)' },
            ],
          },
        ],
      });

      const { container } = render(
        <DisplayLogicComponent {...defaultProps} displayLogic={logic} onDisplayLogicChange={onDisplayLogicChange} />
      );

      const triggerSelect = container.querySelector('select[name="triggerQuestion-group-1"]') as HTMLSelectElement;
      fireEvent.change(triggerSelect, { target: { value: '3692' } });

      const [updatedLogic] = onDisplayLogicChange.mock.calls[0];
      expect(updatedLogic.groups[0].triggerQuestionId).toBe(3692);
      // Old conditions referenced option values on question 3691 — they must be reset,
      // not carried over, to a single default condition on the new question's first option.
      expect(updatedLogic.groups[0].conditions).toEqual([
        expect.objectContaining({ operator: 'is', optionValue: 'CSV' }),
      ]);
    });
  });

  describe('option label and operator rendering', () => {
    it('should use the "includes/does not include" operator labels for a multi-value trigger question', () => {
      const logic = makeDisplayLogic({
        groups: [
          {
            id: 'group-1',
            triggerQuestionId: multiValueTriggerQuestion.id,
            conditions: [{ id: 'cond-1', operator: 'is', optionValue: 'CSV' }],
          },
        ],
      });

      const { container } = render(
        <DisplayLogicComponent
          {...defaultProps}
          triggerQuestions={[multiValueTriggerQuestion]}
          displayLogic={logic}
        />
      );

      const operatorSelect = container.querySelector('select[name="operator-cond-1"]') as HTMLSelectElement;
      const optionLabels = Array.from(operatorSelect.options)
        .map((o) => o.textContent)
        .filter((text) => text?.trim());

      expect(optionLabels).toEqual([
        'tabPanel.operatorItemIncludes',
        'tabPanel.operatorItemDoesNotInclude',
      ]);
    });

    it('should use the "is/is not selected" operator labels for a single-value trigger question', () => {
      const logic = makeDisplayLogic({
        groups: [
          {
            id: 'group-1',
            triggerQuestionId: 3691,
            conditions: [{ id: 'cond-1', operator: 'is', optionValue: 'Observational (e.g., sensor data, surveys, field notes)' }],
          },
        ],
      });

      const { container } = render(<DisplayLogicComponent {...defaultProps} displayLogic={logic} />);

      const operatorSelect = container.querySelector('select[name="operator-cond-1"]') as HTMLSelectElement;
      const optionLabels = Array.from(operatorSelect.options)
        .map((o) => o.textContent)
        .filter((text) => text?.trim());

      expect(optionLabels).toEqual([
        'tabPanel.operatorItemIsSelected',
        'tabPanel.operatorItemIsNotSelected',
      ]);
    });

    it('should truncate an option label longer than 60 characters with an ellipsis', () => {
      const logic = makeDisplayLogic({
        groups: [
          {
            id: 'group-1',
            triggerQuestionId: longLabelTriggerQuestion.id,
            conditions: [{ id: 'cond-1', operator: 'is', optionValue: 'long-option' }],
          },
        ],
      });

      const { container } = render(
        <DisplayLogicComponent
          {...defaultProps}
          triggerQuestions={[longLabelTriggerQuestion]}
          displayLogic={logic}
        />
      );

      const optionSelect = container.querySelector('select[name="option-cond-1"]') as HTMLSelectElement;
      const renderedLabel = Array.from(optionSelect.options).find((o) => o.value === 'long-option')
        ?.textContent;

      expect(renderedLabel).toBe(`${LONG_OPTION_LABEL.slice(0, 59)}…`);
      expect(renderedLabel).not.toBe(LONG_OPTION_LABEL);
    });

    it('should not truncate an option label at or under 60 characters', () => {
      // 'CSV' from mockTriggerQuestions is well under the limit — confirms the
      // false branch of the truncation condition still renders the label as-is.
      const logic = makeDisplayLogic({
        groups: [
          { id: 'group-1', triggerQuestionId: 3692, conditions: [{ id: 'cond-1', operator: 'is', optionValue: 'CSV' }] },
        ],
      });

      const { container } = render(<DisplayLogicComponent {...defaultProps} displayLogic={logic} />);

      const optionSelect = container.querySelector('select[name="option-cond-1"]') as HTMLSelectElement;
      const renderedLabel = Array.from(optionSelect.options).find((o) => o.value === 'CSV')?.textContent;

      expect(renderedLabel).toBe('CSV');
    });
  });

  describe('condition management', () => {
    it('should add a new condition when "+ Add condition" is clicked', () => {
      const onDisplayLogicChange = jest.fn();
      const logic = makeDisplayLogic();

      render(<DisplayLogicComponent {...defaultProps} displayLogic={logic} onDisplayLogicChange={onDisplayLogicChange} />);

      fireEvent.click(screen.getByRole('button', { name: /tabPanel.buttons.addCondition/ }));

      const [updatedLogic] = onDisplayLogicChange.mock.calls[0];
      expect(updatedLogic.groups[0].conditions).toHaveLength(2);
    });

    it('should remove the correct condition when its remove button is clicked', () => {
      const onDisplayLogicChange = jest.fn();
      const logic = makeDisplayLogic({
        groups: [
          {
            id: 'group-1',
            triggerQuestionId: 3691,
            conditions: [
              { id: 'cond-1', operator: 'is', optionValue: 'Observational (e.g., sensor data, surveys, field notes)' },
              { id: 'cond-2', operator: 'is_not', optionValue: 'Experimental (e.g., lab protocols, genetic sequencing)' },
            ],
          },
        ],
      });

      render(<DisplayLogicComponent {...defaultProps} displayLogic={logic} onDisplayLogicChange={onDisplayLogicChange} />);

      const removeConditionButtons = screen.getAllByRole('button', { name: /tabPanel.buttons.removeConditionAriaLabel/ });
      fireEvent.click(removeConditionButtons[0]);

      const [updatedLogic] = onDisplayLogicChange.mock.calls[0];
      expect(updatedLogic.groups[0].conditions).toEqual([
        expect.objectContaining({ id: 'cond-2' }),
      ]);
    });

    it('should update only the operator of the matching condition, leaving other conditions untouched', () => {
      const onDisplayLogicChange = jest.fn();
      const logic = makeDisplayLogic({
        groups: [
          {
            id: 'group-1',
            triggerQuestionId: 3691,
            conditions: [
              { id: 'cond-1', operator: 'is', optionValue: 'Observational (e.g., sensor data, surveys, field notes)' },
              { id: 'cond-2', operator: 'is', optionValue: 'Experimental (e.g., lab protocols, genetic sequencing)' },
            ],
          },
        ],
      });

      const { container } = render(
        <DisplayLogicComponent {...defaultProps} displayLogic={logic} onDisplayLogicChange={onDisplayLogicChange} />
      );

      // Target the second condition's operator select specifically, so cond-1 exercises
      // the "no match, pass through unchanged" branch of the ternary.
      const operatorSelect = container.querySelector('select[name="operator-cond-2"]') as HTMLSelectElement;
      fireEvent.change(operatorSelect, { target: { value: 'is_not' } });

      const [updatedLogic] = onDisplayLogicChange.mock.calls[0];
      expect(updatedLogic.groups[0].conditions).toEqual([
        expect.objectContaining({ id: 'cond-1', operator: 'is' }),
        expect.objectContaining({ id: 'cond-2', operator: 'is_not' }),
      ]);
    });

    it('should update only the optionValue of the matching condition, leaving other conditions untouched', () => {
      const onDisplayLogicChange = jest.fn();
      const logic = makeDisplayLogic({
        groups: [
          {
            id: 'group-1',
            triggerQuestionId: 3691,
            conditions: [
              { id: 'cond-1', operator: 'is', optionValue: 'Observational (e.g., sensor data, surveys, field notes)' },
              { id: 'cond-2', operator: 'is', optionValue: 'Experimental (e.g., lab protocols, genetic sequencing)' },
            ],
          },
        ],
      });

      const { container } = render(
        <DisplayLogicComponent {...defaultProps} displayLogic={logic} onDisplayLogicChange={onDisplayLogicChange} />
      );

      const optionSelect = container.querySelector('select[name="option-cond-1"]') as HTMLSelectElement;
      fireEvent.change(optionSelect, {
        target: { value: 'Experimental (e.g., lab protocols, genetic sequencing)' },
      });

      const [updatedLogic] = onDisplayLogicChange.mock.calls[0];
      expect(updatedLogic.groups[0].conditions).toEqual([
        expect.objectContaining({ id: 'cond-1', optionValue: 'Experimental (e.g., lab protocols, genetic sequencing)' }),
        expect.objectContaining({ id: 'cond-2', optionValue: 'Experimental (e.g., lab protocols, genetic sequencing)' }),
      ]);
    });
  });

  describe('remove all display logic', () => {
    it('should open a confirmation dialog when "Remove all display logic" is clicked', async () => {
      render(<DisplayLogicComponent {...defaultProps} displayLogic={makeDisplayLogic()} />);

      fireEvent.click(screen.getByRole('button', { name: 'tabPanel.buttons.removeAllDisplayLogic' }));

      expect(await screen.findByText('tabPanel.headings.confirmClearDisplayLogic')).toBeInTheDocument();
    });

    it('should call onDisplayLogicRemove when removal is confirmed', async () => {
      const onDisplayLogicRemove = jest.fn().mockResolvedValue(undefined);
      render(
        <DisplayLogicComponent
          {...defaultProps}
          displayLogic={makeDisplayLogic()}
          onDisplayLogicRemove={onDisplayLogicRemove}
          hasSavedDisplayLogic={true}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: 'tabPanel.buttons.removeAllDisplayLogic' }));
      const confirmButton = await screen.findByText('buttons.confirm');

      await act(async () => {
        fireEvent.click(confirmButton);
      });

      expect(onDisplayLogicRemove).toHaveBeenCalledTimes(1);
    });

    it('should not call onDisplayLogicRemove when removal is cancelled', async () => {
      const onDisplayLogicRemove = jest.fn().mockResolvedValue(undefined);
      render(
        <DisplayLogicComponent
          {...defaultProps}
          displayLogic={makeDisplayLogic()}
          onDisplayLogicRemove={onDisplayLogicRemove}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: 'tabPanel.buttons.removeAllDisplayLogic' }));
      const cancelButton = await screen.findByText('buttons.cancel');
      fireEvent.click(cancelButton);

      expect(onDisplayLogicRemove).not.toHaveBeenCalled();
    });

    it('should still show the "Remove all display logic" button even when there are no groups', () => {
      render(<DisplayLogicComponent {...defaultProps} displayLogic={makeDisplayLogic({ groups: [] })} />);
      expect(screen.getByRole('button', { name: 'tabPanel.buttons.removeAllDisplayLogic' })).toBeInTheDocument();
    });
  });

  describe('save button', () => {
    it('should be enabled even when there are no groups, since isDisabled only tracks isSaving', () => {
      render(<DisplayLogicComponent {...defaultProps} displayLogic={makeDisplayLogic({ groups: [] })} />);

      expect(screen.getByRole('button', { name: 'tabPanel.buttons.saveDisplayLogic' })).not.toBeDisabled();
    });

    it('should be disabled while isSaving is true', () => {
      render(<DisplayLogicComponent {...defaultProps} displayLogic={makeDisplayLogic()} isSaving />);

      expect(screen.getByRole('button', { name: /tabPanel.buttons.saveDisplayLogic|buttons.saving/ })).toBeDisabled();
    });

    it('should call onDisplayLogicSave when clicked', async () => {
      const onDisplayLogicSave = jest.fn().mockResolvedValue(undefined);
      render(
        <DisplayLogicComponent {...defaultProps} displayLogic={makeDisplayLogic()} onDisplayLogicSave={onDisplayLogicSave} />
      );

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'tabPanel.buttons.saveDisplayLogic' }));
      });

      expect(onDisplayLogicSave).toHaveBeenCalledTimes(1);
    });
  });

  describe('accessibility', () => {
    it('should have no axe violations in the empty state', async () => {
      const { container } = render(<DisplayLogicComponent {...defaultProps} displayLogic={null} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no axe violations with groups and conditions present', async () => {
      const { container } = render(<DisplayLogicComponent {...defaultProps} displayLogic={makeDisplayLogic()} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});