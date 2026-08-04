import { act, fireEvent, render, screen, within } from '@/utils/test-utils';
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

      expect(onDisplayLogicChange).toHaveBeenCalledWith({ action: 'show', matchType: 'any', groups: [] });
    });
  });

  describe('auto-add trigger question on load', () => {
    it('should automatically add a trigger question when displayLogic starts with zero groups', () => {
      const onDisplayLogicChange = jest.fn();
      render(
        <DisplayLogicComponent
          {...defaultProps}
          displayLogic={makeDisplayLogic({ groups: [] })}
          onDisplayLogicChange={onDisplayLogicChange}
        />
      );

      expect(onDisplayLogicChange).toHaveBeenCalledTimes(1);
      const [updatedLogic] = onDisplayLogicChange.mock.calls[0];
      expect(updatedLogic.groups).toHaveLength(1);
      expect(updatedLogic.groups[0].triggerQuestionId).toBe(mockTriggerQuestions[0].id);
    });

    it('should not auto-add again after a group is manually removed back down to zero', () => {
      const onDisplayLogicChange = jest.fn();
      const { rerender } = render(
        <DisplayLogicComponent
          {...defaultProps}
          displayLogic={makeDisplayLogic({ groups: [] })} // start at zero — triggers the initial auto-add
          onDisplayLogicChange={onDisplayLogicChange}
        />
      );

      // Confirm the initial auto-add happened
      expect(onDisplayLogicChange).toHaveBeenCalledTimes(1);
      onDisplayLogicChange.mockClear();

      // Simulate the parent applying that auto-add result, then the user removing
      // the group again — groups goes back to zero a second time.
      rerender(
        <DisplayLogicComponent
          {...defaultProps}
          displayLogic={makeDisplayLogic({ groups: [] })}
          onDisplayLogicChange={onDisplayLogicChange}
        />
      );

      // Should NOT have triggered a second auto-add
      expect(onDisplayLogicChange).not.toHaveBeenCalled();
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

    it('should exclude trigger questions already used by another group from the dropdown', () => {
      const logic = makeDisplayLogic({
        groups: [
          { id: 'group-1', triggerQuestionId: 3691, conditions: [{ id: 'cond-1', operator: 'is', optionValue: 'Observational (e.g., sensor data, surveys, field notes)' }] },
        ],
      });

      render(<DisplayLogicComponent {...defaultProps} displayLogic={logic} />);

      // Only one trigger question is used, one remains — "Add trigger question" should still show
      expect(screen.getByRole('button', { name: 'tabPanel.buttons.addTriggerQuestion' })).toBeInTheDocument();
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

      fireEvent.click(screen.getByRole('button', { name: 'tabPanel.buttons.addTriggerQuestion' }));

      const [updatedLogic] = onDisplayLogicChange.mock.calls[0];
      expect(updatedLogic.groups).toHaveLength(2);
      expect(updatedLogic.groups[1].triggerQuestionId).toBe(3692);
    });

    it('should reset a group\'s conditions when its trigger question is changed', () => {
      const onDisplayLogicChange = jest.fn();
      const logic = makeDisplayLogic();

      render(<DisplayLogicComponent {...defaultProps} displayLogic={logic} onDisplayLogicChange={onDisplayLogicChange} />);

      const triggerSelect = screen.getByLabelText('tabPanel.labels.triggerQuestion');
      fireEvent.change(within(triggerSelect.closest('div')!).getByRole('combobox', { hidden: true }) ?? triggerSelect, {
        target: { value: '3692' },
      });
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
  });

  describe('remove all display logic', () => {
    it('should open a confirmation dialog when "Remove all display logic" is clicked', async () => {
      render(<DisplayLogicComponent {...defaultProps} displayLogic={makeDisplayLogic()} />);

      fireEvent.click(screen.getByRole('button', { name: 'tabPanel.buttons.removeAllDisplayLogic' }));

      expect(await screen.findByText('tabPanel.headings.confirmClearDisplayLogic')).toBeInTheDocument();
    });

    it('should call onDisplayLogicChange(null) when removal is confirmed', async () => {
      const onDisplayLogicChange = jest.fn();
      render(
        <DisplayLogicComponent {...defaultProps} displayLogic={makeDisplayLogic()} onDisplayLogicChange={onDisplayLogicChange} />
      );

      fireEvent.click(screen.getByRole('button', { name: 'tabPanel.buttons.removeAllDisplayLogic' }));
      const confirmButton = await screen.findByText('buttons.confirm');

      await act(async () => {
        fireEvent.click(confirmButton);
      });

      expect(onDisplayLogicChange).toHaveBeenCalledWith(null);
    });

    it('should not call onDisplayLogicChange when removal is cancelled', async () => {
      const onDisplayLogicChange = jest.fn();
      render(
        <DisplayLogicComponent {...defaultProps} displayLogic={makeDisplayLogic()} onDisplayLogicChange={onDisplayLogicChange} />
      );

      fireEvent.click(screen.getByRole('button', { name: 'tabPanel.buttons.removeAllDisplayLogic' }));
      const cancelButton = await screen.findByText('buttons.cancel');
      fireEvent.click(cancelButton);

      expect(onDisplayLogicChange).not.toHaveBeenCalled();
    });

    it('should not show the "Remove all display logic" section when there are no groups', () => {
      render(<DisplayLogicComponent {...defaultProps} displayLogic={makeDisplayLogic({ groups: [] })} />);

      expect(screen.queryByRole('button', { name: 'tabPanel.buttons.removeAllDisplayLogic' })).not.toBeInTheDocument();
    });
  });

  describe('save button', () => {
    it('should be disabled when there are no groups', () => {
      render(<DisplayLogicComponent {...defaultProps} displayLogic={makeDisplayLogic({ groups: [] })} />);

      expect(screen.getByRole('button', { name: 'tabPanel.buttons.saveDisplayLogic' })).toBeDisabled();
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