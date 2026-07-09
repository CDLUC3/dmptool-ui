import React from "react";
import { useTranslations } from "next-intl";
import styles from "./SectionHeaderEdit.module.scss";
import { Button } from "react-aria-components";
import { TransitionLink } from "@/components/Form";

interface SectionChecklist {
  requirements: boolean;
  guidance: boolean;
}

interface SectionHeaderEditProps {
  title: string;
  sectionNumber: number;
  editUrl: string;
  onMoveUp?: (() => void) | undefined;
  onMoveDown?: (() => void) | undefined;
  sectionAuthorType?: "funder" | "organization" | null;
  checklist?: SectionChecklist;
  isCustomizationTemplate?: boolean;
}

const SectionHeaderEdit: React.FC<SectionHeaderEditProps> = ({
  title,
  sectionNumber,
  editUrl,
  onMoveUp,
  onMoveDown,
  sectionAuthorType,
  checklist,
  isCustomizationTemplate = false,
}) => {
  const Sections = useTranslations("Sections");
  const Global = useTranslations("Global");

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
      className={styles.sectionHeader}
      data-testid="section-edit-card"
    >
      <div className={styles.sectionHeaderContent}>
        <h2 className={styles.sectionTitle}>
          <span className={styles.sectionNumber}>
            {Sections("labels.section")} {sectionNumber}{" "}
          </span>
          {title}
        </h2>
        {sectionAuthorType && checklist && (
          <div
            className={styles.sectionChecklist}
            role="group"
            aria-label="Section customization options"
          >
            <div className={`${styles.checklistItem} ${!checklist.requirements ? styles.unchecked : ""}`}>
              <span
                className={`${styles.checkIcon} ${checklist.requirements ? styles.checked : styles.unchecked}`}
                aria-hidden="true"
              >
                ✓
              </span>
              <span className={styles.checkLabel}>
                {Sections("checklist.requirements")}
                <span className="hidden-accessibly">
                  {checklist.requirements ? Sections("checklist.completed") : Sections("checklist.notCompleted")}
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
                {Sections("checklist.guidance")}
                <span className="hidden-accessibly">
                  {checklist.guidance ? Sections("checklist.completed") : Sections("checklist.notCompleted")}
                </span>
              </span>
            </div>
          </div>
        )}
      </div>

      <div className={styles.buttonGroup}>
        <TransitionLink
          href={editUrl}
          className={styles.editButton}
        >
          {isCustomizationTemplate && sectionAuthorType === "funder"
            ? Global("buttons.customize")
            : Sections("links.editSection")}
        </TransitionLink>


        <div className={styles.orderButtons}>
          {onMoveUp && (
            <Button
              className={`order-button ${styles.orderButton}`}
              onPress={onMoveUp}
              aria-label={Sections("buttons.moveUp", { title })}
            >
              <UpArrowIcon />
            </Button>
          )}

          {onMoveDown && (
            <Button
              className={`order-button ${styles.orderButton}`}
              onPress={onMoveDown}
              aria-label={Sections("buttons.moveDown", { title })}
            >
              <DownArrowIcon />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SectionHeaderEdit;
