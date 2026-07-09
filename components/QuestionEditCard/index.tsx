import React from "react";
import { useTranslations } from "next-intl";
import { Button } from "react-aria-components";

import { TransitionLink } from "@/components/Form";
// Utils
import { stripHtml } from "@/utils/general";
//Other
import styles from "./QuestionEditCard.module.scss";

interface QuestionChecklist {
  requirements: boolean;
  guidance: boolean;
  sampleText: boolean;
}

interface QuestionEditCardProps {
  id: string;
  text: string;
  link: string;
  name?: string;
  displayOrder?: number;
  handleDisplayOrderChange: (questionId: number, questionDisplayOrder: number) => void;
  questionAuthorType?: "funder" | "organization" | null;
  checklist?: QuestionChecklist;
}

const QuestionEditCard: React.FC<QuestionEditCardProps> = ({
  id,
  text,
  link,
  name,
  displayOrder,
  handleDisplayOrderChange,
  questionAuthorType,
  checklist,
}) => {
  const questionText = stripHtml(text);
  const questionId = Number(id);
  const questionDisplayOrder = Number(displayOrder);

  // Localization
  const EditQuestion = useTranslations("EditQuestion");

  // Determine eyebrow heading based on questionAuthorType
  const getEyebrowText = () => {
    switch (questionAuthorType) {
      case "funder":
        return EditQuestion("label.funderQuestion");
      case "organization":
        return EditQuestion("label.organizationQuestion");
      default:
        return EditQuestion("label.question");
    }
  };

  // Determine if this is an organization question for styling
  const isOrganizationQuestion = questionAuthorType === "organization";

  // Determine link text based on questionAuthorType
  const getLinkText = () => {
    switch (questionAuthorType) {
      case "funder":
        return EditQuestion("links.customizeQuestion");
      default:
        return EditQuestion("links.editQuestion");
    }
  };

  const UpArrowIcon = () => (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
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
      xmlns="http://www.w3.org/2000/svg"
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

  return (
    <div
      className={`${styles.questionEditCard} ${isOrganizationQuestion ? styles.organizationQuestion : ""}`}
      key={id}
      data-testid="question-edit-card"
    >
      <div
        className={styles.questionEditCard__content}
        aria-labelledby={`question-${id}`}
      >
        <p
          className={styles.questionEditCard__label}
          id={`question-label-${id}`}
        >
          {getEyebrowText()}
        </p>
        <div
          className={styles.questionEditCard__name}
          id={`question-${id}`}
        >
          <p>{questionText}</p>
        </div>
        {checklist && (
          <div
            className={styles.questionEditCard__checklist}
            role="group"
            aria-label="Question customization options"
          >
            <div className={`${styles.checklistItem} ${!checklist.requirements ? styles.unchecked : ""}`}>
              <span
                className={`${styles.checkIcon} ${checklist.requirements ? styles.checked : styles.unchecked}`}
                aria-hidden="true"
              >
                ✓
              </span>
              <span className={styles.checkLabel}>
                {EditQuestion("checklist.requirements")}
                <span className="hidden-accessibly">
                  {checklist.requirements
                    ? EditQuestion("checklist.completed")
                    : EditQuestion("checklist.notCompleted")}
                </span>
              </span>
            </div>
            <div className={`${styles.checklistItem} ${!checklist.guidance ? styles.unchecked : ""}`}>
              <span
                className={`${styles.checkIcon} ${checklist.guidance ? styles.checked : styles.unchecked}`}
                aria-hidden="true"
              >
                ✓
              </span>
              <span className={styles.checkLabel}>
                {EditQuestion("checklist.guidance")}
                <span className="hidden-accessibly">
                  {checklist.guidance ? EditQuestion("checklist.completed") : EditQuestion("checklist.notCompleted")}
                </span>
              </span>
            </div>
            <div className={`${styles.checklistItem} ${!checklist.sampleText ? styles.unchecked : ""}`}>
              <span
                className={`${styles.checkIcon} ${checklist.sampleText ? styles.checked : styles.unchecked}`}
                aria-hidden="true"
              >
                ✓
              </span>
              <span className={styles.checkLabel}>
                {EditQuestion("checklist.sampleText")}
                <span className="hidden-accessibly">
                  {checklist.sampleText ? EditQuestion("checklist.completed") : EditQuestion("checklist.notCompleted")}
                </span>
              </span>
            </div>
          </div>
        )}
      </div>
      <div
        className={styles.questionEditCard__actions}
        role="group"
        aria-label="Question actions"
      >
        <TransitionLink
          href={link}
          className={styles.questionEditCard__link}
          aria-label={`${getLinkText()}: ${name}`}
        >
          {getLinkText()}
        </TransitionLink>
        <div className={styles.orderButtons}>
          <Button
            className={`order-button ${styles.orderButton}`}
            aria-label={EditQuestion("buttons.moveUp", { name: text })}
            onPress={() => handleDisplayOrderChange(questionId, questionDisplayOrder - 1)}
          >
            <UpArrowIcon />
          </Button>
          <Button
            className={`order-button ${styles.orderButton}`}
            aria-label={EditQuestion("buttons.moveDown", { name: text })}
            onPress={() => handleDisplayOrderChange(questionId, questionDisplayOrder + 1)}
          >
            <DownArrowIcon />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default QuestionEditCard;
