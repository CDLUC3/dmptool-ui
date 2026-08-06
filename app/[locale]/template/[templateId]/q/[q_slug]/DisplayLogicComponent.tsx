'use client';

import { useMemo, useState } from 'react';
import {
  Button,
  Dialog,
  DialogTrigger,
  Modal,
  ModalOverlay,
} from 'react-aria-components';
import { useTranslations } from 'next-intl';

import { FormSelect, TransitionButton } from '@/components/Form';
import {
  DisplayLogic,
  DisplayLogicGroup,
  TriggerQuestionOption,
} from '@/app/types/displayLogic';

import styles from './displayLogic.module.scss';
import { DmpIcon } from '@/components/Icons';
import Loading from '@/components/Loading';

interface DisplayLogicComponentProps {
  triggerQuestions: TriggerQuestionOption[]; // all applicable: options-type, before this question
  displayLogic: DisplayLogic | null;
  onDisplayLogicChange: (logic: DisplayLogic | null) => void;
  onDisplayLogicSave: () => Promise<void>;
  onDisplayLogicRemove: () => Promise<void>;
  isSaving?: boolean;
  isLoadingExistingLogic?: boolean;
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


/**
 * Renders the "Display Logic" tab panel for conditionally showing/hiding a question
 * based on how earlier questions were answered.
 *
 * Notes:
 * - Each trigger question can only be used by one group at a time; both the trigger
 *   question dropdown and "Add trigger question" button filter out ones already in use.
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
}: DisplayLogicComponentProps) => {
  // hooks
  const t = useTranslations('QuestionEdit');
  const Global = useTranslations('Global');

  // State
  const [isRemoveAllOpen, setRemoveAllOpen] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);


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

  // Questions not already used by another group — so the same trigger
  // question can't be picked twice, and so the "add trigger question"
  // control disappears once every applicable question is in use.
  const availableTriggerQuestions = (excludeGroupId?: string) => {
    const usedIds = new Set(
      (displayLogic?.groups ?? [])
        .filter((g) => g.id !== excludeGroupId)
        .map((g) => g.triggerQuestionId)
    );

    return triggerQuestions.filter((q) => !usedIds.has(q.id));
  };

  // Update the display logic state with a partial update (e.g., changing action or matchType)
  const updateLogic = (partial: Partial<DisplayLogic>) => {
    if (!displayLogic) return;
    onDisplayLogicChange({ ...displayLogic, ...partial });
  };

  // Update a single group with a partial update (e.g., changing trigger question or conditions)
  const updateGroup = (groupId: string, partial: Partial<DisplayLogicGroup>) => {
    if (!displayLogic) return;
    updateLogic({
      groups: displayLogic.groups.map((g) => (g.id === groupId ? { ...g, ...partial } : g)),
    });
  };

  // Adds a new display logic block with default values (show, any, no groups)
  const handleAddDisplayLogic = () => {
    onDisplayLogicChange({ action: 'show', matchType: 'any', groups: [] });
  };

  // Adds a new trigger-question box, defaulting to the first
  // not-yet-used applicable question.
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
    const firstOption = tq.options[0];
    updateGroup(group.id, {
      conditions: [
        ...group.conditions,
        { id: makeId('cond'), operator: 'is', optionValue: firstOption?.value ?? '' },
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

  // Removes all display logic (all groups and conditions)
  const handleRemoveAll = async () => {
    setIsRemoving(true);
    try {
      await onDisplayLogicRemove();
    } finally {
      setIsRemoving(false);
      setRemoveAllOpen(false);
    }
  };

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

  // Show "Add another trigger question" button only if there are still trigger questions 
  // available that aren't already used by another group.
  const canAddMoreTriggerQuestions = availableTriggerQuestions().length > 0;

  return (
    <div className={styles.tabPanelWrapper}>
      <div className={styles.displayLogicWrapper}>
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
            onChange={(value) => updateLogic({ matchType: value as DisplayLogic['matchType'] })}
          />
          <span className={styles.sentenceText}>{t('tabPanel.labels.ofTheFollowingMatch')}</span>
        </div>

        {/* One box per trigger question the user has added */}
        {displayLogic.groups.map((group, index) => {
          const tq = triggerQuestionMap.get(group.triggerQuestionId);
          if (!tq) return null;

          // Determine which operator items to show based on whether the trigger question is multi-value or single-value
          const operatorItems = tq.isMultiValue ? OPERATOR_ITEMS_MULTI : OPERATOR_ITEMS_SINGLE;

          const groupTriggerItems = availableTriggerQuestions(group.id).map(q => ({
            id: q.id.toString(),
            name: q.questionText,
          }));

          const optionItems = tq.options.map((opt) => ({
            id: opt.value,
            name: truncateLabel(opt.label),
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

                {group.conditions.map((condition) => {
                  const selectedOption = tq.options.find((opt) => opt.value === condition.optionValue);
                  const conditionLabel = t('tabPanel.buttons.removeConditionAriaLabel', {
                    operator: operatorItems.find((o) => o.id === condition.operator)?.name ?? '',
                    option: selectedOption ? truncateLabel(selectedOption.label) : '',
                  });


                  return (
                    <div key={condition.id} className={styles.conditionRow}>
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
                        isDisabled={group.conditions.length === 1}
                        onPress={() => handleRemoveCondition(group, condition.id)}
                      >
                        <DmpIcon icon="trashcan" classes={styles.trashcanIcon} />
                      </Button>
                    </div>
                  )
                })}

                <Button
                  className={`react-aria-Button link ${styles.addConditionButton}`}
                  type="button"
                  onPress={() => handleAddCondition(group, tq)}
                >
                  <span aria-hidden="true">+{' '}</span>
                  {t('tabPanel.buttons.addCondition')}
                </Button>
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
            onPress={onDisplayLogicSave}
            isDisabled={displayLogic.groups.length === 0 || displayLogic.groups.some((g) => g.conditions.length === 0) || isSaving}
            loadingLabel={Global('buttons.saving')}
            showLoading={isSaving}
          >
            {t('tabPanel.buttons.saveDisplayLogic')}
          </TransitionButton>
        </div>
      </div>

      {
        displayLogic.groups.length > 0 && (
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
                          <Button className="react-aria-Button" autoFocus onPress={close}>
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
        )
      }
    </div >
  );
};

export default DisplayLogicComponent;