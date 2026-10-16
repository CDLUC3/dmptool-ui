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
  // Trigger questions to highlight, e.g. when linked from a message about a move that this question's display logic
  // is blocking. The first highlighted trigger question is scrolled into view and focused
  highlightedTriggerQuestionIds?: number[];
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


// Conditions within a group are always joined with OR (the any/all match type only applies
// between groups), so each option can only be used once per group. Otherwise a group could contain
// opposite conditions like "includes: California" OR "does not include: California", which is always true.
// The option dropdowns enforce this, so duplicates can't be created.

// Returns the option values already used by other conditions in the group
const getOptionValuesUsedByOthers = (group: DisplayLogicGroup, conditionId?: string) =>
  new Set(
    group.conditions
      .filter((c) => c.id !== conditionId)
      .map((c) => c.optionValue)
      .filter(Boolean)
  );

// Returns the options a condition can choose from: its own option plus any option not used elsewhere in the group
const getAvailableConditionOptions = (
  group: DisplayLogicGroup,
  conditionId: string,
  tq: TriggerQuestionOption
) => {
  const currentValue = group.conditions.find((c) => c.id === conditionId)?.optionValue;
  const usedByOthers = getOptionValuesUsedByOthers(group, conditionId);
  // Always keep the condition's own option, so previously saved duplicates still show their selection
  return tq.options.filter((opt) => opt.value === currentValue || !usedByOthers.has(opt.value));
};

// Returns the first option not yet used in the group, if any
const getFirstUnusedOption = (group: DisplayLogicGroup, tq: TriggerQuestionOption) => {
  const used = getOptionValuesUsedByOthers(group);
  return tq.options.find((opt) => !used.has(opt.value));
};

// Returns true if a new condition can be added to a group, i.e. the trigger question still has an unused option
const canAddConditionForGroup = (
  group: DisplayLogicGroup,
  tq: TriggerQuestionOption
) => getFirstUnusedOption(group, tq) !== undefined;


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
  highlightedTriggerQuestionIds = [],
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

  // Adds a new condition to a group, defaulting to "is" and the first option not already used in the group
  const handleAddCondition = (group: DisplayLogicGroup, tq: TriggerQuestionOption) => {
    const firstOption = getFirstUnusedOption(group, tq);
    if (!firstOption) return;

    updateGroup(group.id, {
      conditions: [
        ...group.conditions,
        { id: makeId('cond'), operator: 'is', optionValue: firstOption.value },
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

  // The match type only changes how groups are joined (AND/OR), so it never affects the conditions within a group
  const handleMatchTypeChange = (value: string) => {
    updateLogic({ matchType: value as DisplayLogic['matchType'] });
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
  }, [triggerQuestions, displayLogic, triggerQuestionMap, onDisplayLogicChange, toastState, t]);

  // Scroll to and focus the first highlighted trigger question once it is shown, so the user is taken straight to it
  const firstHighlightedGroupId = displayLogic?.groups.find(
    (g) => triggerQuestionMap.has(g.triggerQuestionId) && highlightedTriggerQuestionIds.includes(g.triggerQuestionId)
  )?.id;
  const firstHighlightedGroupRef = useRef<HTMLDivElement | null>(null);
  const hasFocusedHighlightedGroup = useRef(false);
  useEffect(() => {
    if (hasFocusedHighlightedGroup.current || !firstHighlightedGroupId || !firstHighlightedGroupRef.current) return;

    hasFocusedHighlightedGroup.current = true;
    firstHighlightedGroupRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    firstHighlightedGroupRef.current.focus({ preventScroll: true });
  }, [firstHighlightedGroupId]);

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

        {/* One box per trigger question the user has added */}
        {displayLogic.groups.map((group, index) => {
          const tq = triggerQuestionMap.get(group.triggerQuestionId);
          if (!tq) return null;

          const isHighlighted = highlightedTriggerQuestionIds.includes(group.triggerQuestionId);

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
                  {displayLogic.matchType === 'all' ? t('tabPanel.labels.joinerAnd') : t('tabPanel.labels.joinerOr')}
                </div>
              )}
              <div
                className={`${styles.conditionsWrapper} ${isHighlighted ? styles.highlightedGroup : ''}`}
                ref={group.id === firstHighlightedGroupId ? firstHighlightedGroupRef : undefined}
                tabIndex={isHighlighted ? -1 : undefined}
                data-testid={isHighlighted ? 'highlighted-trigger-question' : undefined}
              >
                {isHighlighted && (
                  <p className={styles.highlightedGroupMessage}>{t('tabPanel.messages.blockingTriggerQuestion')}</p>
                )}
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
                    group,
                    condition.id,
                    tq
                  );

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
                      {/* Conditions within a group are always joined with OR, regardless of the match type */}
                      {conditionIndex > 0 && (
                        <div className={styles.conditionJoiner} aria-hidden="true">
                          {t('tabPanel.labels.joinerOr')}
                        </div>
                      )}
                      <div className={styles.conditionRow}>
                        <FormSelect
                          name={`operator-${condition.id}`}
                          label={t('tabPanel.labels.conditionOperator')}
                          selectClasses={styles.conditionOperator}
                          hideLabelVisually
                          items={operatorItems}
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

                {canAddConditionForGroup(group, tq) && (
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