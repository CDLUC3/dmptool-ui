'use client';

import { useMemo, useState } from 'react';
import {
  Button,
  Dialog,
  DialogTrigger,
  Label,
  SelectValue,
  Modal,
  ModalOverlay,
  Popover,
  Collection,
  ListBox,
  ListBoxItem,
  Select
} from 'react-aria-components';
import { useTranslations } from 'next-intl';

import { FormSelect, TransitionButton } from '@/components/Form';
import {
  DisplayLogic,
  DisplayLogicCondition,
  DisplayLogicGroup,
  TriggerQuestionOption,
} from '@/app/types/displayLogic';

import styles from './displayLogic.module.scss';

interface DisplayLogicComponentProps {
  triggerQuestions: TriggerQuestionOption[]; // all applicable: options-type, before this question
  displayLogic: DisplayLogic | null;
  onChange: (logic: DisplayLogic | null) => void;
  onSave: () => Promise<void>;
  isSaving?: boolean;
}

const MAX_OPTION_LABEL_LENGTH = 40;
const truncateLabel = (label: string) =>
  label.length > MAX_OPTION_LABEL_LENGTH
    ? `${label.slice(0, MAX_OPTION_LABEL_LENGTH - 1)}…`
    : label;

const makeId = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const ACTION_ITEMS = [
  { id: 'show', name: 'Show' },
  { id: 'hide', name: 'Hide' },
];
const MATCH_TYPE_ITEMS = [
  { id: 'any', name: 'Any' },
  { id: 'all', name: 'All' },
];
const OPERATOR_ITEMS = [
  { id: 'is', name: 'Is selected' },
  { id: 'is_not', name: 'Is NOT selected' },
];

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

const DisplayLogicComponent = ({
  triggerQuestions,
  displayLogic,
  onChange,
  onSave,
  isSaving = false,
}: DisplayLogicComponentProps) => {
  const t = useTranslations('QuestionEdit');
  const Global = useTranslations('Global');
  const [isRemoveAllOpen, setRemoveAllOpen] = useState(false);

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

  const updateLogic = (partial: Partial<DisplayLogic>) => {
    if (!displayLogic) return;
    onChange({ ...displayLogic, ...partial });
  };

  const updateGroup = (groupId: string, partial: Partial<DisplayLogicGroup>) => {
    if (!displayLogic) return;
    updateLogic({
      groups: displayLogic.groups.map((g) => (g.id === groupId ? { ...g, ...partial } : g)),
    });
  };

  const handleAddDisplayLogic = () => {
    onChange({ action: 'show', matchType: 'any', groups: [] });
  };

  // Adds a new trigger-question box, defaulting to the first
  // not-yet-used applicable question.
  const handleAddTriggerQuestion = () => {
    if (!displayLogic) return;
    const next = availableTriggerQuestions()[0];
    if (!next) return;
    updateLogic({ groups: [...displayLogic.groups, makeGroup(next.id, next)] });
  };

  const handleTriggerQuestionChange = (groupId: string, value: string) => {
    const tq = triggerQuestionMap.get(Number(value));
    if (!tq) return;
    // Changing the trigger question invalidates that group's conditions,
    // since they reference option values on the old question.
    updateGroup(groupId, { triggerQuestionId: tq.id, conditions: makeGroup(tq.id, tq).conditions });
  };

  const handleRemoveGroup = (groupId: string) => {
    if (!displayLogic) return;
    updateLogic({ groups: displayLogic.groups.filter((g) => g.id !== groupId) });
  };

  const handleAddCondition = (group: DisplayLogicGroup, tq: TriggerQuestionOption) => {
    const firstOption = tq.options[0];
    updateGroup(group.id, {
      conditions: [
        ...group.conditions,
        { id: makeId('cond'), operator: 'is', optionValue: firstOption?.value ?? '' },
      ],
    });
  };

  const handleRemoveCondition = (group: DisplayLogicGroup, conditionId: string) => {
    updateGroup(group.id, { conditions: group.conditions.filter((c) => c.id !== conditionId) });
  };

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

  const handleRemoveAll = () => {
    onChange(null);
    setRemoveAllOpen(false);
  };

  if (!displayLogic) {
    return (
      <div className={styles.displayLogicWrapper}>
        <p>{t('tabPanel.descriptions.displayLogic')}</p>
        {triggerQuestions.length === 0 ? (
          <p className={styles.emptyStateText}>
            {t('tabPanel.helpText.noTriggerQuestionsAvailable')}
          </p>
        ) : (
          <Button
            className={`react-aria-Button ${styles.addLogicButton}`}
            onPress={handleAddDisplayLogic}
          >
            {t('tabPanel.buttons.addDisplayLogic')}
          </Button>
        )}
      </div>
    );
  }

  const canAddMoreTriggerQuestions = availableTriggerQuestions().length > 0;

  return (
    <div className={styles.displayLogicWrapper}>
      <p>{t('tabPanel.descriptions.displayLogic')}</p>

      <div className={styles.logicSentence}>
        <FormSelect
          name="displayLogicAction"
          label={t('tabPanel.labels.displayLogicAction')}
          hideLabelVisually
          items={ACTION_ITEMS}
          selectedKey={displayLogic.action}
          onChange={(value) => updateLogic({ action: value as 'show' | 'hide' })}
        />
        <span className={styles.sentenceText}>{t('tabPanel.labels.thisQuestionIf')}</span>
        <FormSelect
          name="displayLogicMatchType"
          label={t('tabPanel.labels.displayLogicMatchType')}
          hideLabelVisually
          items={MATCH_TYPE_ITEMS}
          selectedKey={displayLogic.matchType}
          onChange={(value) => updateLogic({ matchType: value as 'any' | 'all' })}
        />
        <span className={styles.sentenceText}>{t('tabPanel.labels.ofTheFollowingMatch')}</span>
      </div>

      {/* One box per trigger question the user has added */}
      {displayLogic.groups.map((group) => {
        const tq = triggerQuestionMap.get(group.triggerQuestionId);
        if (!tq) return null;

        const groupTriggerItems = availableTriggerQuestions(group.id).map(q => ({
          id: q.id.toString(),
          name: q.questionText,
        }));

        const optionItems = tq.options.map((opt) => ({
          id: opt.value,
          name: truncateLabel(opt.label),
        }));

        return (
          <div key={group.id} className={styles.conditionsWrapper}>
            <Button
              className={`react-aria-Button link ${styles.removeGroupButton}`}
              type="button"
              onPress={() => handleRemoveGroup(group.id)}
            >
              {Global('buttons.delete')}
            </Button>

            <FormSelect
              name={`triggerQuestion-${group.id}`}
              label={t('tabPanel.labels.triggerQuestion')}
              items={groupTriggerItems}
              selectedKey={group.triggerQuestionId.toString()}
              onChange={(value) => handleTriggerQuestionChange(group.id, value)}
            />

            {group.conditions.map((condition) => (
              <div key={condition.id} className={styles.conditionRow}>
                <FormSelect
                  name={`operator-${condition.id}`}
                  label={t('tabPanel.labels.conditionOperator')}
                  selectClasses={styles.conditionOperatorSelect}
                  hideLabelVisually
                  items={OPERATOR_ITEMS}
                  selectedKey={condition.operator}
                  onChange={(value) => handleConditionChange(group, condition.id, 'operator', value)}
                />
                <FormSelect
                  name={`option-${condition.id}`}
                  label={t('tabPanel.labels.conditionOption')}
                  selectClasses={styles.conditionOperatorSelect}
                  hideLabelVisually
                  items={optionItems}
                  selectedKey={condition.optionValue}
                  onChange={(value) => handleConditionChange(group, condition.id, 'optionValue', value)}
                />
                <Button
                  className={`react-aria-Button ${styles.removeConditionButton}`}
                  type="button"
                  aria-label={t('tabPanel.buttons.removeCondition')}
                  onPress={() => handleRemoveCondition(group, condition.id)}
                >
                  <span aria-hidden="true">&times;</span>
                </Button>
              </div>
            ))}

            <Button
              className="react-aria-Button link"
              type="button"
              onPress={() => handleAddCondition(group, tq)}
            >
              {t('tabPanel.buttons.addCondition')}
            </Button>
          </div>
        );
      })}

      {canAddMoreTriggerQuestions && (
        <Button className="react-aria-Button link" type="button" onPress={handleAddTriggerQuestion}>
          {t('tabPanel.buttons.addTriggerQuestion')}
        </Button>
      )}

      <div className={styles.actionButtonsWrapper}>
        <TransitionButton
          type="button"
          onPress={onSave}
          isDisabled={displayLogic.groups.length === 0 || isSaving}
          loadingLabel={Global('buttons.saving')}
          showLoading={isSaving}
        >
          {t('tabPanel.buttons.saveDisplayLogic')}
        </TransitionButton>

        <DialogTrigger isOpen={isRemoveAllOpen} onOpenChange={setRemoveAllOpen}>
          <Button className="danger" type="button">
            {t('tabPanel.buttons.removeDisplayLogic')}
          </Button>
          <ModalOverlay>
            <Modal>
              <Dialog>
                {({ close }) => (
                  <>
                    <h3>{t('tabPanel.headings.confirmRemoveAllDisplayLogic')}</h3>
                    <p>{t('tabPanel.descriptions.removeAllDisplayLogicWarning')}</p>
                    <div className={styles.removeAllConfirmButtons}>
                      <Button className="react-aria-Button" autoFocus onPress={close}>
                        {Global('buttons.cancel')}
                      </Button>
                      <TransitionButton
                        className="danger"
                        onPress={async () => {
                          handleRemoveAll();
                          close();
                        }}
                        loadingLabel={Global('buttons.confirming')}
                        showLoading={false}
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
    </div>
  );
};

export default DisplayLogicComponent;