'use client';

import { useMemo, useEffect, useRef, useState } from 'react';
import {
  Button,
  Dialog,
  DialogTrigger,
  Modal,
  ModalOverlay,
} from 'react-aria-components';
import { useTranslations } from 'next-intl';

import {
  DisplayLogic,
  DisplayLogicGroup,
  TriggerQuestionOption,
} from '@/app/types/displayLogic';

// Components
import { FormSelect, TransitionButton } from '@/components/Form';
import { DmpIcon } from '@/components/Icons';
import Loading from '@/components/Loading';
import ErrorMessages from '@/components/ErrorMessages';

// Utils and other
import { useToast } from '@/context/ToastContext';
import styles from './displayLogic.module.scss';


interface DisplayLogicComponentProps {
  triggerQuestions: TriggerQuestionOption[]; // all applicable: options-type, before this question
  displayLogic: DisplayLogic | null;
  onDisplayLogicChange: (logic: DisplayLogic | null) => void;
  onDisplayLogicSave: () => Promise<void>;
  onDisplayLogicRemove: () => Promise<void>;
  isSaving?: boolean;
  isLoadingExistingLogic?: boolean;
  // True once display logic has actually been persisted server-side (either
  // hydrated from an existing save, or saved successfully in this session).
  // Lets "Remove all" skip the backend call when there's nothing there yet
  // to delete — the user is just discarding a local, never-saved draft.
  hasSavedDisplayLogic?: boolean;
}

const MAX_OPTION_LABEL_LENGTH = 60; // Max length for a select option label before truncating with ellipsis.

// Shorten the length of the option to whatever the max option length is set to
const truncateLabel = (label: string) =>
  label.length > MAX_OPTION_LABEL_LENGTH
    ? `${label.slice(0, MAX_OPTION_LABEL_LENGTH - 1)}…`
    : label;

// Generates a unique ID for a new group or condition.
const makeId = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

// Creates a new DisplayLogicGroup with a single condition, defaulting to the first option of the trigger question.
// Temporary id is generated client-side since the backend doesn't provide one.
const makeGroup = (triggerQuestionId: number, tq: TriggerQuestionOption): DisplayLogicGroup => {
  const firstOption = tq.options[0];
  return {
    id: makeId('group'),
    triggerQuestionId,
    conditions: [
      { id: makeId('cond'), operator: 'is', optionValue: firstOption?.value ?? '' },
    ],
  };
};


// In "ALL" mode, each option value can only appear once per group. 
// This prevents contradictory pairs like "is selected: Yes" and "is NOT selected: Yes" 
// in the same group.
const hasDuplicateOptionValues = (group: DisplayLogicGroup) => {
  const seen = new Set<string>();
  for (const condition of group.conditions) {
    const value = condition.optionValue;
    if (!value) continue;
    if (seen.has(value)) return true;
    seen.add(value);
  }
  return false;
};

// In "ANY" mode, each condition in a group must be unique (no duplicate operator + option pairs).
const conditionPairKey = (operator: 'is' | 'is_not', optionValue: string) =>
  `${operator}::${optionValue}`;


// In "ANY" mode, each condition in a group must be unique (no duplicate operator + option pairs).
const hasDuplicateConditionPairs = (group: DisplayLogicGroup) => {
  const seen = new Set<string>();
  for (const condition of group.conditions) {
    const key = conditionPairKey(condition.operator, condition.optionValue);
    if (seen.has(key)) return true;
    seen.add(key);
  }
  return false;
};

// Returns the list of operators available for a given trigger question.
const getOperatorsForQuestion = (
  _tq: TriggerQuestionOption
): ('is' | 'is_not')[] => {
  return ['is', 'is_not'];
};

// In ALL mode, each option value can only appear once per group.
// In ANY mode, each operator + option pair can only appear once per group.
// This prevents contradictory pairs like "is selected: Yes" and
// "is NOT selected: Yes" in the same group.
const getAvailableConditionOptions = (
  matchType: DisplayLogic['matchType'],
  group: DisplayLogicGroup,
  conditionId: string,
  tq: TriggerQuestionOption
) => {
  const currentCondition = group.conditions.find((c) => c.id === conditionId);
  const currentValue = currentCondition?.optionValue;

  if (matchType === 'all') {
    const usedByOtherConditions = new Set(
      group.conditions
        .filter((c) => c.id !== conditionId)
        .map((c) => c.optionValue)
        .filter(Boolean)
    );
    return tq.options.filter(
      (opt) => opt.value === currentValue || !usedByOtherConditions.has(opt.value)
    );
  }

  // In ANY mode, each operator + option pair can only appear once per group.
  const currentOperator = currentCondition?.operator ?? 'is';
  const usedPairsByOthers = new Set(
    group.conditions
      .filter((c) => c.id !== conditionId)
      .map((c) => conditionPairKey(c.operator, c.optionValue))
  );

  return tq.options.filter(
    (opt) =>
      opt.value === currentValue ||
      !usedPairsByOthers.has(conditionPairKey(currentOperator, opt.value))
  );
};

// Returns the operator options available for a given condition — excludes any
// operator that would create a duplicate (operator, optionValue) pair with
// another condition in the same group, based on this condition's CURRENT option value.
const getAvailableOperatorOptions = (
  group: DisplayLogicGroup,
  conditionId: string,
  allOperatorItems: { id: string; name: string }[]
) => {
  const condition = group.conditions.find((c) => c.id === conditionId);
  if (!condition) return allOperatorItems;

  const usedPairsByOthers = new Set(
    group.conditions
      .filter((c) => c.id !== conditionId)
      .map((c) => conditionPairKey(c.operator, c.optionValue))
  );

  return allOperatorItems.filter(
    (item) =>
      item.id === condition.operator ||
      !usedPairsByOthers.has(conditionPairKey(item.id as 'is' | 'is_not', condition.optionValue))
  );
};
// Returns true if a new condition can be added to a group, based on the match type 
// and the trigger question's options.
const canAddConditionForGroup = (
  matchType: DisplayLogic['matchType'],
  group: DisplayLogicGroup,
  tq: TriggerQuestionOption
) => {
  if (matchType === 'all') {
    const usedValues = new Set(group.conditions.map((c) => c.optionValue).filter(Boolean));
    return tq.options.some((opt) => !usedValues.has(opt.value));
  }

  const operators = getOperatorsForQuestion(tq);
  const usedPairs = new Set(group.conditions.map((c) => conditionPairKey(c.operator, c.optionValue)));
  return tq.options.some((opt) =>
    operators.some((operator) => !usedPairs.has(conditionPairKey(operator, opt.value)))
  );
};


/**
 * Renders the "Display Logic" tab panel for conditionally showing/hiding a question
 * based on how earlier questions were answered.
 *
 * Notes:
 * - Trigger questions can be reused across groups so authors can explicitly model
 *   mixed logic by repeating a question with different conditions.
 * - This is a controlled component: all `displayLogic` state lives in the parent;
 *   `onDisplayLogicChange` must be wired up to actually persist changes.
 */
const DisplayLogicComponent = ({
  triggerQuestions,
  displayLogic,
  onDisplayLogicChange,
  onDisplayLogicSave,
  onDisplayLogicRemove,
  isSaving = false,
  isLoadingExistingLogic = false,
  hasSavedDisplayLogic = false,
}: DisplayLogicComponentProps) => {
  // hooks
  const t = useTranslations('QuestionEdit');
  const Global = useTranslations('Global');
  const toastState = useToast();
  //For scrolling to error in page
  const errorRef = useRef<HTMLDivElement | null>(null);

  // State
  const [isRemoveAllOpen, setRemoveAllOpen] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [pendingMatchType, setPendingMatchType] = useState<DisplayLogic['matchType'] | null>(null);


  const ACTION_ITEMS = [
    { id: 'show', name: t('tabPanel.actionItemShow') },
    { id: 'hide', name: t('tabPanel.actionItemHide') },
  ];
  const MATCH_TYPE_ITEMS = [
    { id: 'any', name: t('tabPanel.matchTypeItemAny') },
    { id: 'all', name: t('tabPanel.matchTypeItemAll') },
  ];
  const OPERATOR_ITEMS_SINGLE = [
    { id: 'is', name: t('tabPanel.operatorItemIsSelected') },
    { id: 'is_not', name: t('tabPanel.operatorItemIsNotSelected') },
  ];
  const OPERATOR_ITEMS_MULTI = [
    { id: 'is', name: t('tabPanel.operatorItemIncludes') },
    { id: 'is_not', name: t('tabPanel.operatorItemDoesNotInclude') },
  ];

  // Memoized map of trigger questions for quick lookup by ID
  const triggerQuestionMap = useMemo(
    () => new Map(triggerQuestions.map((q) => [q.id, q])),
    [triggerQuestions]
  );

  // Returns trigger questions not already used by another group.
  const availableTriggerQuestions = (excludeGroupId?: string) => {
    if (!displayLogic) return triggerQuestions;

    const usedIds = new Set(
      displayLogic.groups
        .filter((g) => g.id !== excludeGroupId)
        .map((g) => g.triggerQuestionId)
    );

    return triggerQuestions.filter((q) => !usedIds.has(q.id));
  };

  // Update the display logic state with a partial update (e.g., changing action or matchType)
  const updateLogic = (partial: Partial<DisplayLogic>) => {
    if (!displayLogic) return;
    setErrors([]);
    onDisplayLogicChange({ ...displayLogic, ...partial });
  };

  const handleSave = async () => {
    if (!displayLogic) return;

    if (
      displayLogic.matchType === 'all' &&
      displayLogic.groups.some((group) => hasDuplicateOptionValues(group))
    ) {
      setErrors([
        t('tabPanel.messages.allMatchTypeRule')
      ]);
      return;
    }

    if (
      displayLogic.matchType === 'any' &&
      displayLogic.groups.some((group) => hasDuplicateConditionPairs(group))
    ) {
      setErrors([
        t('tabPanel.messages.anyMatchTypeRule')
      ]);
      return;
    }

    setErrors([]);
    await onDisplayLogicSave();
  };

  // Update a single group with a partial update (e.g., changing trigger question or conditions)
  const updateGroup = (groupId: string, partial: Partial<DisplayLogicGroup>) => {
    if (!displayLogic) return;
    updateLogic({
      groups: displayLogic.groups.map((g) => (g.id === groupId ? { ...g, ...partial } : g)),
    });
  };

  // Adds a new display logic block, pre-populated with one condition group
  // on the first available trigger question — so the user immediately sees
  // an example of what a condition group looks like, rather than a blank
  // "Add trigger question" prompt.
  const handleAddDisplayLogic = () => {
    const first = triggerQuestions[0];
    if (!first) return; // safety net — button only renders when triggerQuestions.length > 0
    onDisplayLogicChange({ action: 'show', matchType: 'any', groups: [makeGroup(first.id, first)] });
  };

  // Adds a new trigger-question box, defaulting to the first trigger question.
  const handleAddTriggerQuestion = () => {
    if (!displayLogic) return;
    const next = availableTriggerQuestions()[0];
    if (!next) return;
    updateLogic({ groups: [...displayLogic.groups, makeGroup(next.id, next)] });
  };

  // Updates a group's trigger question, and resets that group's conditions to a single
  const handleTriggerQuestionChange = (groupId: string, value: string) => {
    const tq = triggerQuestionMap.get(Number(value));
    if (!tq) return;
    // Changing the trigger question invalidates that group's conditions,
    // since they reference option values on the old question.
    updateGroup(groupId, { triggerQuestionId: tq.id, conditions: makeGroup(tq.id, tq).conditions });
  };

  // Removes a group entirely (trigger question + conditions)
  const handleRemoveGroup = (groupId: string) => {
    if (!displayLogic) return;
    updateLogic({ groups: displayLogic.groups.filter((g) => g.id !== groupId) });
  };

  // Adds a new condition to a group, defaulting to the first option of that group's trigger question
  const handleAddCondition = (group: DisplayLogicGroup, tq: TriggerQuestionOption) => {
    const usedValuesInGroup = new Set(group.conditions.map((c) => c.optionValue).filter(Boolean));

    let nextOperator: 'is' | 'is_not' = 'is';
    let firstOption: TriggerQuestionOption['options'][number] | undefined = tq.options[0];

    if (displayLogic?.matchType === 'all') {
      firstOption = tq.options.find((opt) => !usedValuesInGroup.has(opt.value));
    } else {
      const operators = getOperatorsForQuestion(tq);
      const usedPairs = new Set(group.conditions.map((c) => conditionPairKey(c.operator, c.optionValue)));

      firstOption = undefined;
      for (const operator of operators) {
        const candidate = tq.options.find((opt) => !usedPairs.has(conditionPairKey(operator, opt.value)));
        if (candidate) {
          nextOperator = operator;
          firstOption = candidate;
          break;
        }
      }
    }

    if (!firstOption) return;

    updateGroup(group.id, {
      conditions: [
        ...group.conditions,
        { id: makeId('cond'), operator: nextOperator, optionValue: firstOption?.value ?? '' },
      ],
    });
  };

  // Removes a condition from a group
  const handleRemoveCondition = (group: DisplayLogicGroup, conditionId: string) => {
    updateGroup(group.id, { conditions: group.conditions.filter((c) => c.id !== conditionId) });
  };

  // Updates a single condition in a group (operator or option value)
  const handleConditionChange = (
    group: DisplayLogicGroup,
    conditionId: string,
    field: 'operator' | 'optionValue',
    value: string
  ) => {
    updateGroup(group.id, {
      conditions: group.conditions.map((c) =>
        c.id === conditionId ? { ...c, [field]: value } : c
      ),
    });
  };

  // Removes all display logic. If nothing has actually been saved
  // server-side yet, this is just discarding a local draft — no need to
  // hit the backend for something that was never persisted.
  const handleRemoveAll = async () => {
    if (!hasSavedDisplayLogic) {
      onDisplayLogicChange(null);
      setRemoveAllOpen(false);
      return;
    }

    setIsRemoving(true);
    try {
      await onDisplayLogicRemove();
    } finally {
      setIsRemoving(false);
      setRemoveAllOpen(false);
    }
  };

  const groupsWithDuplicates = (matchType: DisplayLogic['matchType']) => {
    if (!displayLogic || matchType !== 'all') return [];
    return displayLogic.groups.filter((g) => hasDuplicateOptionValues(g));
  };

  const handleMatchTypeChange = (value: string) => {
    if (!displayLogic) return;
    const newMatchType = value as DisplayLogic['matchType'];

    if (groupsWithDuplicates(newMatchType).length > 0) {
      setPendingMatchType(newMatchType); // opens confirm dialog instead of applying immediately
      return;
    }

    updateLogic({ matchType: newMatchType });
  };

  const confirmMatchTypeChange = () => {
    if (!pendingMatchType || !displayLogic) return;

    const cleanedGroups = displayLogic.groups.map((group) => {
      const seen = new Set<string>();
      return {
        ...group,
        conditions: group.conditions.filter((c) => {
          if (!c.optionValue || seen.has(c.optionValue)) return false;
          seen.add(c.optionValue);
          return true;
        }),
      };
    });

    updateLogic({ matchType: pendingMatchType, groups: cleanedGroups });
    setPendingMatchType(null);
  };

  // If the display logic references trigger questions that no longer exist
  //  (e.g., the user deleted a question that was previously used as a trigger), 
  // remove those groups and show a warning toast.
  useEffect(() => {
    if (!displayLogic || triggerQuestions.length === 0) return;

    const validGroups = displayLogic.groups.filter((g) => triggerQuestionMap.has(g.triggerQuestionId));

    if (validGroups.length !== displayLogic.groups.length) {
      onDisplayLogicChange({ ...displayLogic, groups: validGroups });
      toastState.add(t('tabPanel.messages.removedUnavailableTriggerQuestions'));
    }
  }, [triggerQuestions]);

  // If there's no display logic yet, show the "Add display logic" button (or a message if there are no trigger questions)
  if (!displayLogic) {
    return (
      <div className={styles.displayLogicWrapper}>
        <p>{t('tabPanel.descriptions.displayLogic')}</p>
        {isLoadingExistingLogic ? (
          <Loading message={Global('messaging.loading')} />
        ) : triggerQuestions.length === 0 ? (
          <p className={styles.emptyStateText}>{t('tabPanel.helpText.noTriggerQuestionsAvailable')}</p>
        ) : (
          <Button className={`react-aria-Button ${styles.addLogicButton}`} onPress={handleAddDisplayLogic}>
            {t('tabPanel.buttons.addDisplayLogic')}
          </Button>
        )}
      </div>
    );
  }

  // Show add link only while there are unused trigger questions remaining.
  const canAddMoreTriggerQuestions = availableTriggerQuestions().length > 0;

  return (
    <div className={styles.tabPanelWrapper}>
      <div className={styles.displayLogicWrapper}>
        <ErrorMessages errors={errors} ref={errorRef} />
        <p>{t('tabPanel.descriptions.displayLogic')}</p>

        <div className={styles.logicSentenceWrapper}>
          <FormSelect
            name="displayLogicAction"
            label={t('tabPanel.labels.displayLogicAction')}
            hideLabelVisually
            items={ACTION_ITEMS}
            selectedKey={displayLogic.action}
            onChange={(value) => updateLogic({ action: value as DisplayLogic['action'] })}
          />
          <span className={styles.sentenceText}>{t('tabPanel.labels.thisQuestionIf')}</span>
          <FormSelect
            name="displayLogicMatchType"
            label={t('tabPanel.labels.displayLogicMatchType')}
            hideLabelVisually
            items={MATCH_TYPE_ITEMS}
            selectedKey={displayLogic.matchType}
            onChange={handleMatchTypeChange}
          />
          <span className={styles.sentenceText}>{t('tabPanel.labels.ofTheFollowingMatch')}</span>
        </div>

        <ModalOverlay
          isOpen={pendingMatchType !== null}
          onOpenChange={(open) => {
            if (!open) setPendingMatchType(null);
          }}
        >
          <Modal>
            <Dialog aria-labelledby="confirm-match-type-change-title">
              {({ close }) => (
                <>
                  <h3>{t('tabPanel.headings.confirmMatchTypeChange')}</h3>
                  <p>{t('tabPanel.descriptions.matchTypeChangeWarning')}</p>

                  <div className={styles.removeAllConditionsDialogButtons}>
                    <Button
                      className="tertiary"
                      autoFocus
                      onPress={() => {
                        setPendingMatchType(null);
                        close();
                      }}
                    >
                      {Global('buttons.cancel')}
                    </Button>

                    <Button
                      className="danger"
                      onPress={async () => {
                        confirmMatchTypeChange();
                      }}
                    >
                      {Global('buttons.confirm')}
                    </Button>
                  </div>
                </>
              )}
            </Dialog>
          </Modal>
        </ModalOverlay>

        {/* One box per trigger question the user has added */}
        {displayLogic.groups.map((group, index) => {
          const tq = triggerQuestionMap.get(group.triggerQuestionId);
          if (!tq) return null;

          // Determine which operator items to show based on whether the trigger question is multi-value or single-value
          const operatorItems = tq.isMultiValue ? OPERATOR_ITEMS_MULTI : OPERATOR_ITEMS_SINGLE;

          const groupTriggerItems = triggerQuestions.map(q => ({
            id: q.id.toString(),
            name: q.questionText,
          }));

          return (
            <div key={group.id}>
              {index > 0 && (
                <div className={styles.groupJoiner} aria-hidden="true">
                  {displayLogic.matchType === 'all' ? 'AND' : 'OR'}
                </div>
              )}
              <div className={styles.conditionsWrapper}>
                <Button
                  className={`react-aria-Button ${styles.removeGroupButton}`}
                  type="button"
                  aria-label={t('tabPanel.buttons.removeGroupAriaLabel', { triggerQuestion: tq.questionText })}
                  onPress={() => handleRemoveGroup(group.id)}
                >
                  <span aria-hidden="true">&times;</span>
                </Button>

                <FormSelect
                  name={`triggerQuestion-${group.id}`}
                  label={t('tabPanel.labels.triggerQuestion')}
                  items={groupTriggerItems}
                  selectedKey={group.triggerQuestionId.toString()}
                  onChange={(value) => handleTriggerQuestionChange(group.id, value)}
                />

                {group.conditions.map((condition, conditionIndex) => {
                  const conditionOptions = getAvailableConditionOptions(
                    displayLogic.matchType,
                    group,
                    condition.id,
                    tq
                  );

                  const availableOperatorItems = getAvailableOperatorOptions(group, condition.id, operatorItems);

                  const selectedOption = tq.options.find((opt) => opt.value === condition.optionValue);
                  const conditionLabel = t('tabPanel.buttons.removeConditionAriaLabel', {
                    operator: operatorItems.find((o) => o.id === condition.operator)?.name ?? '',
                    option: selectedOption ? truncateLabel(selectedOption.label) : '',
                  });
                  const optionItems = conditionOptions.map((opt) => ({
                    id: opt.value,
                    name: truncateLabel(opt.label),
                  }));


                  return (
                    <div key={condition.id}>
                      {conditionIndex > 0 && (
                        <div className={styles.conditionJoiner} aria-hidden="true">
                          {displayLogic.matchType === 'all' ? 'AND' : 'OR'}
                        </div>
                      )}
                      <div className={styles.conditionRow}>
                        <FormSelect
                          name={`operator-${condition.id}`}
                          label={t('tabPanel.labels.conditionOperator')}
                          selectClasses={styles.conditionOperator}
                          hideLabelVisually
                          items={availableOperatorItems}
                          selectedKey={condition.operator}
                          onChange={(value) => handleConditionChange(group, condition.id, 'operator', value)}
                        />
                        <FormSelect
                          name={`option-${condition.id}`}
                          label={t('tabPanel.labels.conditionOption')}
                          selectClasses={styles.conditionOption}
                          hideLabelVisually
                          items={optionItems}
                          selectedKey={condition.optionValue}
                          onChange={(value) => handleConditionChange(group, condition.id, 'optionValue', value)}
                        />
                        <Button
                          className={`react-aria-Button ${styles.removeConditionButton}`}
                          type="button"
                          aria-label={conditionLabel}
                          onPress={() => handleRemoveCondition(group, condition.id)}
                        >
                          <DmpIcon icon="trashcan" classes={styles.trashcanIcon} />
                        </Button>
                      </div>
                    </div>
                  )
                })}

                {canAddConditionForGroup(displayLogic.matchType, group, tq) && (
                  <Button
                    className={`react-aria-Button link ${styles.addConditionButton}`}
                    type="button"
                    onPress={() => handleAddCondition(group, tq)}
                  >
                    <span aria-hidden="true">+{' '}</span>
                    {t('tabPanel.buttons.addCondition')}
                  </Button>
                )}
              </div>
            </div>
          );
        })}

        {canAddMoreTriggerQuestions && (
          <Button
            className={`react-aria-Button link ${styles.addTriggerQuestionButton}`}
            type="button"
            onPress={handleAddTriggerQuestion}
          >
            {displayLogic.groups.length > 0
              ? t('tabPanel.buttons.addAnotherTriggerQuestion')
              : t('tabPanel.buttons.addTriggerQuestion')}

          </Button>
        )}

        <div className={styles.saveButtonWrapper}>
          <TransitionButton
            type="button"
            onPress={handleSave}
            isDisabled={isSaving}
            loadingLabel={Global('buttons.saving')}
            showLoading={isSaving}
          >
            {t('tabPanel.buttons.saveDisplayLogic')}
          </TransitionButton>
        </div>
      </div>

      <div className={styles.removeDisplayLogicSection}>
        <DialogTrigger isOpen={isRemoveAllOpen} onOpenChange={setRemoveAllOpen}>
          <Button className={`${styles.removeDisplayLogicButton} danger`} type="button">
            {t('tabPanel.buttons.removeAllDisplayLogic')}
          </Button>
          <ModalOverlay>
            <Modal>
              <Dialog>
                {({ close }) => (
                  <>
                    <h3>{t('tabPanel.headings.confirmClearDisplayLogic')}</h3>
                    <p>{t('tabPanel.descriptions.clearDisplayLogicWarning')}</p>
                    <div className={styles.removeAllConditionsDialogButtons}>
                      <Button className="tertiary" autoFocus onPress={close}>
                        {Global('buttons.cancel')}
                      </Button>
                      <TransitionButton
                        className="danger"
                        onPress={async () => {
                          await handleRemoveAll();
                        }}
                        loadingLabel={Global('buttons.confirming')}
                        isDisabled={isRemoving}
                      >
                        {Global('buttons.confirm')}
                      </TransitionButton>
                    </div>
                  </>
                )}
              </Dialog>
            </Modal>
          </ModalOverlay>
        </DialogTrigger>
      </div>
    </div >
  );
};

export default DisplayLogicComponent;