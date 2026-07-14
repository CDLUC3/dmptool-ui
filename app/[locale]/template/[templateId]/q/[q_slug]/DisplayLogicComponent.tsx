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
  DisplayLogicCondition,
  TriggerQuestionOption,
} from '@/app/types/displayLogic';

import styles from './displayLogic.module.scss';

interface DisplayLogicComponentProps {
  triggerQuestions: TriggerQuestionOption[];
  displayLogic: DisplayLogic | null;
  onChange: (logic: DisplayLogic | null) => void;
}

const MAX_OPTION_LABEL_LENGTH = 40;

const truncateLabel = (label: string) =>
  label.length > MAX_OPTION_LABEL_LENGTH
    ? `${label.slice(0, MAX_OPTION_LABEL_LENGTH - 1)}…`
    : label;

const makeConditionId = () =>
  `cond-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

// FormSelect only accepts a static `items` array of { id, name } — it
// doesn't support <option> children like a native select.
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

const DisplayLogicComponent = ({
  triggerQuestions,
  displayLogic,
  onChange,
}: DisplayLogicComponentProps) => {
  const t = useTranslations('QuestionEdit');
  const Global = useTranslations('Global');
  const [isRemoveAllOpen, setRemoveAllOpen] = useState(false);

  const selectedTriggerQuestion = useMemo(
    () =>
      triggerQuestions.find((q) => q.id === displayLogic?.triggerQuestionId) ??
      null,
    [triggerQuestions, displayLogic?.triggerQuestionId]
  );

  const triggerQuestionItems = useMemo(
    () =>
      triggerQuestions.map((q) => ({
        id: q.id.toString(),
        name: q.questionText,
      })),
    [triggerQuestions]
  );

  const optionItems = useMemo(
    () =>
      selectedTriggerQuestion
        ? selectedTriggerQuestion.options.map((opt) => ({
          id: opt.value,
          name: truncateLabel(opt.label),
        }))
        : [],
    [selectedTriggerQuestion]
  );

  const updateLogic = (partial: Partial<DisplayLogic>) => {
    if (!displayLogic) return;
    onChange({ ...displayLogic, ...partial });
  };

  const handleAddDisplayLogic = () => {
    onChange({
      action: 'show',
      matchType: 'any',
      triggerQuestionId: null,
      conditions: [],
    });
  };

  const handleTriggerQuestionChange = (value: string) => {
    const newTriggerId = value ? Number(value) : null;
    // Changing the trigger question invalidates any existing conditions,
    // since they reference option values that belong to the old question.
    updateLogic({ triggerQuestionId: newTriggerId, conditions: [] });
  };

  const handleAddCondition = () => {
    if (!displayLogic || !selectedTriggerQuestion) return;
    const firstOption = selectedTriggerQuestion.options[0];
    const newCondition: DisplayLogicCondition = {
      id: makeConditionId(),
      operator: 'is',
      optionValue: firstOption ? firstOption.value : '',
    };
    updateLogic({ conditions: [...displayLogic.conditions, newCondition] });
  };

  const handleRemoveCondition = (conditionId: string) => {
    if (!displayLogic) return;
    updateLogic({
      conditions: displayLogic.conditions.filter((c) => c.id !== conditionId),
    });
  };

  const handleConditionChange = (
    conditionId: string,
    field: 'operator' | 'optionValue',
    value: string
  ) => {
    if (!displayLogic) return;
    updateLogic({
      conditions: displayLogic.conditions.map((c) =>
        c.id === conditionId ? { ...c, [field]: value } : c
      ),
    });
  };

  const handleRemoveAll = () => {
    onChange(null);
    setRemoveAllOpen(false);
  };

  // Initial state — just the description + "Add Display Logic" button.
  if (!displayLogic) {
    return (
      <div className={styles.displayLogicWrapper}>
        <p>{t('tabPanel.descriptions.displayLogic')}</p>
        <Button
          className={`react-aria-Button ${styles.addLogicButton}`}
          onPress={handleAddDisplayLogic}
        >
          {t('tabPanel.buttons.addDisplayLogic')}
        </Button>
      </div>
    );
  }

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

        <span className={styles.sentenceText}>
          {t('tabPanel.labels.thisQuestionIf')}
        </span>

        <FormSelect
          name="displayLogicMatchType"
          label={t('tabPanel.labels.displayLogicMatchType')}
          hideLabelVisually
          items={MATCH_TYPE_ITEMS}
          selectedKey={displayLogic.matchType}
          onChange={(value) => updateLogic({ matchType: value as 'any' | 'all' })}
        />

        <span className={styles.sentenceText}>
          {t('tabPanel.labels.ofTheFollowingMatch')}
        </span>
      </div>

      <FormSelect
        name="triggerQuestion"
        label={t('tabPanel.labels.triggerQuestion')}
        items={triggerQuestionItems}
        placeholder={t('tabPanel.options.selectQuestion')}
        selectedKey={displayLogic.triggerQuestionId?.toString()}
        onChange={handleTriggerQuestionChange}
      />

      {triggerQuestions.length === 0 && (
        <p className={styles.emptyStateText}>
          {t('tabPanel.helpText.noTriggerQuestionsAvailable')}
        </p>
      )}

      {selectedTriggerQuestion && (
        <div className={styles.conditionsWrapper}>
          {displayLogic.conditions.map((condition) => (
            <div key={condition.id} className={styles.conditionRow}>
              <FormSelect
                name={`operator-${condition.id}`}
                label={t('tabPanel.labels.conditionOperator')}
                hideLabelVisually
                items={OPERATOR_ITEMS}
                selectedKey={condition.operator}
                onChange={(value) =>
                  handleConditionChange(condition.id, 'operator', value)
                }
              />

              <FormSelect
                name={`option-${condition.id}`}
                label={t('tabPanel.labels.conditionOption')}
                hideLabelVisually
                items={optionItems}
                selectedKey={condition.optionValue}
                onChange={(value) =>
                  handleConditionChange(condition.id, 'optionValue', value)
                }
              />

              <Button
                className={`react-aria-Button ${styles.removeConditionButton}`}
                type="button"
                aria-label={t('tabPanel.buttons.removeCondition')}
                onPress={() => handleRemoveCondition(condition.id)}
              >
                ✕
              </Button>
            </div>
          ))}

          <Button
            className="react-aria-Button"
            type="button"
            onPress={handleAddCondition}
          >
            {t('tabPanel.buttons.addCondition')}
          </Button>
        </div>
      )}

      <div className={styles.removeAllWrapper}>
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
                      <Button
                        className="react-aria-Button"
                        autoFocus
                        onPress={close}
                      >
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