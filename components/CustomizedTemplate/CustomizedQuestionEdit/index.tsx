import React from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "react-aria-components";

// Utils
import { stripHtml } from "@/utils/general";
//Other
import styles from "./customizedQuestionEdit.module.scss";

interface CustomizedQuestionEditProps {
  id: string;
  text: string;
  link: string;
  displayOrder: number;
  questionType: 'BASE' | 'CUSTOM';
  hasCustomGuidance: boolean;
  hasCustomSampleAnswer: boolean;
  handleDisplayOrderChange: (questionId: number, newDisplayOrder: number) => void;
}


const CustomizedQuestionEdit: React.FC<CustomizedQuestionEditProps> = ({
  id,
  text,
  link,
  displayOrder,
  handleDisplayOrderChange,
  questionType,
  hasCustomGuidance,
  hasCustomSampleAnswer,
}) => {

  const questionText = stripHtml(text);
  const questionId = Number(id);
  const questionDisplayOrder = Number(displayOrder);

  // Localization
  const EditQuestion = useTranslations("EditQuestion");
  const CustomizableTemplates = useTranslations("CustomizableTemplates");
  const Global = useTranslations("Global");

  const eyebrowText = questionType === 'BASE'
    ? EditQuestion("label.funderQuestion")
    : EditQuestion("label.organizationQuestion");

  const linkText = questionType === 'BASE'
    ? Global("buttons.customize")
    : EditQuestion("links.editQuestion");

  const isOrganizationQuestion = questionType === 'CUSTOM';

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
          {eyebrowText}
        </p>
        <div
          className={styles.questionEditCard__name}
          id={`question-${id}`}
        >
          <p>{questionText}</p>
        </div>
        {questionType === 'BASE' && (
          <div className={styles.questionEditCard__checklist} role="group" aria-label="Question customization options">
            <dl>
              <div className={styles.checklistItem}>
                <dt><strong>{EditQuestion("checklist.guidance")}:{' '}</strong></dt>
                <dd>{hasCustomGuidance ? CustomizableTemplates("status.completed") : CustomizableTemplates("status.notCompleted")}</dd>
              </div>
              <div className={styles.checklistItem}>
                <dt><strong>{EditQuestion("checklist.sampleText")}:{' '}</strong></dt>
                <dd>{hasCustomSampleAnswer ? CustomizableTemplates("status.added") : CustomizableTemplates("status.notAdded")}</dd>
              </div>
            </dl>
          </div>
        )}
      </div>
      <div
        className={styles.questionEditCard__actions}
        role="group"
        aria-label="Question actions"
      >
        <Link
          href={link}
          className={styles.questionEditCard__link}
          aria-label={`${linkText}: ${questionText}`}
        >
          {linkText}
        </Link>
        {questionType === 'CUSTOM' && (
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
        )}
      </div>
    </div>
  );
};

export default CustomizedQuestionEdit;
