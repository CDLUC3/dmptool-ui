"use client";

import { useState } from "react";
import { Button, Checkbox, Dialog, DialogTrigger, Heading, Modal, ModalOverlay } from "react-aria-components";

import FormInput from "@/components/Form/FormInput";
import { DmpIcon } from "@/components/Icons";
import { useTranslations } from "next-intl";
import { CHECKBOXES_QUESTION_TYPE } from "@/lib/constants";
import styles from "./optionsComponent.module.scss";

const UpArrowIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
  >
    <path
      d="M18 15L12 9L6 15"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const DownArrowIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
  >
    <path
      d="M6 9L12 15L18 9"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const PlusIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    aria-hidden="true"
  >
    <line
      x1="12"
      y1="5"
      x2="12"
      y2="19"
    />
    <line
      x1="5"
      y1="12"
      x2="19"
      y2="12"
    />
  </svg>
);

interface Row {
  id?: number | null;
  text: string;
  isSelected?: boolean | null;
}

interface ParsedOptionsQuestion {
  type?: string;
  attributes?: {
    multiple?: boolean;
  };
}

interface QuestionOptionsComponentProps {
  rows: Row[] | null;
  setRows: (rows: Row[]) => void;
  questionJSON?: string | ParsedOptionsQuestion;
  formSubmitted?: boolean;
  setFormSubmitted: React.Dispatch<React.SetStateAction<boolean>>;
}

/** Edits choices for radio, checkbox, select, and multi-select questions. */
const QuestionOptionsComponent: React.FC<QuestionOptionsComponentProps> = ({
  rows,
  setRows,
  questionJSON,
  formSubmitted,
  setFormSubmitted,
}) => {
  const [announcement, setAnnouncement] = useState<string>("");
  const [touchedRows, setTouchedRows] = useState<Set<number>>(new Set());
  const parsedQuestionJSON: ParsedOptionsQuestion =
    typeof questionJSON === "string" ? JSON.parse(questionJSON) : (questionJSON ?? {});
  const QuestionOptions = useTranslations("QuestionOptionsComponent");

  const addRow = () => {
    if (rows) {
      const nextNum = Math.max(0, ...rows.map((row) => row.id ?? 0)) + 1;

      const newRow = {
        id: nextNum,
        text: "",
        isSelected: false,
      };

      setRows([...rows, newRow]);
      setAnnouncement(QuestionOptions("announcements.rowAdded", { nextNum }));
      setFormSubmitted(false);
    }
  };

  const deleteRow = (rowIndex: number, position: number) => {
    const updatedRows = rows?.filter((_, index) => index !== rowIndex);
    setRows(updatedRows || []);
    setAnnouncement(QuestionOptions("announcements.rowRemoved", { number: position }));
  };

  const setDefault = (rowIndex: number, position: number) => {
    if (!rows) return;

    const selectedRow = rows[rowIndex];
    const willSelect = !selectedRow?.isSelected;

    if (parsedQuestionJSON.type === CHECKBOXES_QUESTION_TYPE || parsedQuestionJSON.attributes?.multiple === true) {
      setRows(rows.map((row, index) => (index === rowIndex ? { ...row, isSelected: willSelect } : row)));
    } else {
      setRows(
        rows.map((row, index) => ({
          ...row,
          isSelected: index === rowIndex ? willSelect : false,
        })),
      );
    }

    setAnnouncement(
      QuestionOptions(willSelect ? "announcements.rowDefault" : "announcements.rowDefaultCleared", {
        number: position,
      }),
    );
  };

  const updateChoiceText = (rowIndex: number, text: string) => {
    if (!rows) return;

    setRows(rows.map((row, index) => (index === rowIndex ? { ...row, text } : row)));
  };

  const moveRow = (index: number, direction: -1 | 1) => {
    if (!rows) return;

    const destinationIndex = index + direction;
    if (destinationIndex < 0 || destinationIndex >= rows.length) return;

    const updatedRows = [...rows];
    [updatedRows[index], updatedRows[destinationIndex]] = [updatedRows[destinationIndex], updatedRows[index]];

    setRows(updatedRows);
    setAnnouncement(
      QuestionOptions("announcements.rowMoved", {
        from: index + 1,
        to: destinationIndex + 1,
      }),
    );
    setFormSubmitted(false);
  };

  const markRowTouched = (rowId: number) => {
    setTouchedRows((current) => {
      const updated = new Set(current);
      updated.add(rowId);
      return updated;
    });
  };

  const hasVisibleChoiceErrors = rows?.some((row, index) => {
    const rowId = row.id ?? index;
    return !row.text.trim() && (formSubmitted || touchedRows.has(rowId));
  });

  return (
    <>
      <p
        id="answer-choice-instructions"
        className={styles.instructions}
      >
        {QuestionOptions("messages.instructions")}
      </p>
      {hasVisibleChoiceErrors && (
        <p
          className={styles.sectionError}
          role="alert"
        >
          {QuestionOptions("messages.choiceErrors")}
        </p>
      )}
      <div className={styles.tableContainer}>
        {rows &&
          rows.map((row, index) => {
            const rowId = row.id ?? index;
            const rowDomId = `choice-${rowId}`;
            const isChoiceInvalid = !row.text.trim() && (formSubmitted || touchedRows.has(rowId));

            return (
              <div
                key={rowDomId}
                className={`${styles.row} ${isChoiceInvalid ? styles.rowInvalid : ""}`}
                role="group"
                aria-labelledby={`${rowDomId}-label`}
                aria-describedby="answer-choice-instructions"
              >
                <span
                  id={`${rowDomId}-label`}
                  className="hidden-accessibly"
                >
                  {QuestionOptions("messages.rowInfo", { number: index + 1 })}
                </span>
                <div className={`${styles.cell} ${styles.text}`}>
                  <FormInput
                    id={`${rowDomId}-text`}
                    name="text"
                    type="text"
                    isRequired={true}
                    label={QuestionOptions("labels.choiceNumber", { number: index + 1 })}
                    labelClasses={styles.textFieldLabel}
                    value={row.text}
                    onChange={(e) => updateChoiceText(index, e.target.value)}
                    onBlur={() => markRowTouched(rowId)}
                    onInvalid={() => markRowTouched(rowId)}
                    placeholder={QuestionOptions("placeholder.text")}
                    isInvalid={isChoiceInvalid}
                    errorMessage={QuestionOptions("messages.choiceRequired", { number: index + 1 })}
                  />
                </div>
                <div className={`${styles.cell} ${styles.default}`}>
                  <Checkbox
                    id={`${rowDomId}-default`}
                    data-testid={`default-${rowId}`}
                    aria-label={QuestionOptions(row.isSelected ? "buttons.clearDefault" : "buttons.setDefault", {
                      number: index + 1,
                    })}
                    onChange={() => setDefault(index, index + 1)}
                    className={`${styles.optionsCheckbox} react-aria-Checkbox`}
                    isSelected={row.isSelected ? row.isSelected : false}
                  >
                    <div className={`${styles.checkBox} checkbox`}>
                      <svg
                        viewBox="0 0 18 18"
                        aria-hidden="true"
                      >
                        <polyline points="1 9 7 14 15 4" />
                      </svg>
                    </div>
                    <span>{QuestionOptions("labels.default")}</span>
                  </Checkbox>
                </div>
                <div className={styles.actions}>
                  <div
                    className={styles.orderButtons}
                    role="group"
                    aria-label={QuestionOptions("labels.reorder", { number: index + 1 })}
                  >
                    <Button
                      className={`order-button ${styles.orderButton}`}
                      onPress={() => moveRow(index, -1)}
                      isDisabled={index === 0}
                      aria-label={QuestionOptions("buttons.moveUp", { number: index + 1 })}
                    >
                      <UpArrowIcon />
                    </Button>
                    <Button
                      className={`order-button ${styles.orderButton}`}
                      onPress={() => moveRow(index, 1)}
                      isDisabled={index === rows.length - 1}
                      aria-label={QuestionOptions("buttons.moveDown", { number: index + 1 })}
                    >
                      <DownArrowIcon />
                    </Button>
                  </div>
                  <DialogTrigger>
                    <Button
                      aria-label={QuestionOptions("buttons.deleteRow", { count: index + 1 })}
                      className={styles.deleteButton}
                    >
                      <DmpIcon
                        icon="trashcan"
                        classes={styles.trashcanIcon}
                      />
                    </Button>
                    <ModalOverlay isDismissable>
                      <Modal>
                        <Dialog role="alertdialog">
                          {({ close }) => (
                            <>
                              <Heading slot="title">
                                {QuestionOptions("headings.removeChoice", { number: index + 1 })}
                              </Heading>
                              <p>{QuestionOptions("messages.confirmRemove", { number: index + 1 })}</p>
                              <div className={styles.dialogActions}>
                                <Button
                                  className="secondary"
                                  onPress={close}
                                >
                                  {QuestionOptions("buttons.cancel")}
                                </Button>
                                <Button
                                  className="danger"
                                  onPress={() => {
                                    deleteRow(index, index + 1);
                                    close();
                                  }}
                                >
                                  {QuestionOptions("buttons.confirmRemove")}
                                </Button>
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
          })}

        <div className={styles.addChoiceContainer}>
          <Button
            onPress={addRow}
            className={styles.addButton}
          >
            <PlusIcon />
            <span>{QuestionOptions("buttons.addRow")}</span>
          </Button>
        </div>
      </div>
      <p
        aria-live="polite"
        className="hidden-accessibly"
      >
        {announcement}
      </p>
    </>
  );
};

export default QuestionOptionsComponent;
