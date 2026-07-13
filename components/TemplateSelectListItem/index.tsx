import { useTranslations } from "next-intl";
import Link from "next/link";
import classNames from "classnames";
import { Button, Dialog, DialogTrigger, Popover } from "react-aria-components";
import styles from "./TemplateSelectListItem.module.scss";
import { TransitionButton, TransitionLink } from "@/components/Form";
import { useToast } from "@/context/ToastContext";
import { toTitleCase } from "@/utils/general";
import { DmpIcon } from "@/components/Icons";

interface TemplateSelectListItemProps {
  onSelect?: (versionedTemplateId: number) => Promise<void>;
  item: {
    id?: number | null;
    link?: string | null;
    template?: {
      id?: number | null;
    };
    funder?: string | null;
    title: string;
    description?: string;
    lastRevisedBy?: string | null;
    lastUpdated?: string | null;
    publishStatus?: string | null;
    publishDate?: string | null;
    visibility?: string | null;
    latestPublishVisibility?: string | null;
    hasAdditionalGuidance?: boolean;
    bestPractices?: boolean;
  };
}

function TemplateSelectListItem({ item, onSelect }: TemplateSelectListItemProps) {
  const toastState = useToast();
  //Localization keys
  const SelectListItem = useTranslations("TemplateSelectListItem");
  const Global = useTranslations("Global");

  const bestPracticeTooltip = SelectListItem("messages.bestPracticeTooltip");
  const bestPracticeInfoAria = SelectListItem("messages.bestPracticeInfoAria");

  // Create unique IDs for ARIA relationships
  const headingId = `${item.title.toLowerCase().replace(/\s+/g, "-")}-heading`;

  const isBestPractice = Boolean(item.bestPractices);

  return (
    <div
      className={classNames(
        styles.templateItem,
        isBestPractice && styles.templateItemBestPractice
      )}
      role="listitem"
      data-testid="template-list-item"
    >
      {isBestPractice && (
        <div className={classNames(styles.bpBadge, styles.bpBadgeLeft)}>
          <DmpIcon
            icon="star"
            classes={styles.bpStar}
            width="16px"
            height="16px"
            aria-hidden="true"
          />
          <DialogTrigger>
            <Button className={styles.bpLink}>
              {SelectListItem("messages.bestPracticeLabel")}
            </Button>
            <Popover placement="bottom start" className={styles.bpPopover}>
              <Dialog className={styles.bpPopoverContent} aria-label={bestPracticeInfoAria}>
                {bestPracticeTooltip}
              </Dialog>
            </Popover>
          </DialogTrigger>
        </div>
      )}

      <div
        className={classNames(
          styles.templateItemWrapper,
          isBestPractice && styles.templateItemWrapperWithBadge
        )}
      >
        <div className={styles.TemplateItemInner}>
          <div className={styles.TemplateItemContent}>
            <div className={styles.funder}>{item.funder}</div>
            <h2
              className={styles.TemplateItemHeading}
              id={headingId}
            >
              {onSelect ? (
                item.title
              ) : item.link ? (
                <Link
                  href={item.link}
                  aria-label={`${Global("links.update")} ${item.title}`}
                  className={styles.titleLink}
                >
                  {item.title}
                </Link>
              ) : (
                item.title
              )}
            </h2>
            {item.description && <p className={styles.description}>{item.description}</p>}

            <div
              className={styles.metadata}
              data-testid="template-metadata"
            >
              <span>
                {Global("lastRevisedBy")}: {item.lastRevisedBy}
              </span>
              <span className={styles.separator}>
                {Global("lastUpdated")}: {item.lastUpdated}
              </span>
              {item.publishStatus && item.publishStatus.length > 0 && (
                <span className={styles.separator}>
                  {item.publishStatus}
                </span>
              )}

              {item.latestPublishVisibility ? (
                <span className={styles.separator}>
                  {Global("visibility")}: {toTitleCase(item.latestPublishVisibility)}
                </span>
              ) : item.visibility ? (
                <span className={styles.separator}>
                  {Global("visibility")}: {toTitleCase(item.visibility)}
                </span>
              ) : null}
            </div>

          </div>

          {onSelect ? (
            <TransitionButton
              className="primary"
              onPress={async () => {
                if (typeof item?.id === "number") {
                  await onSelect(item.id);
                } else {
                  toastState.add("Invalid template", { type: "error" });
                }
              }}
              loadingLabel={Global("buttons.selecting")}
              aria-label={`Select ${item.title}`}
              data-versioned-template-id={item?.id}
            >
              {Global("buttons.select")}
            </TransitionButton>
          ) : (
            <div className={styles.TemplateItemActions}>
              {item.link && (
                <TransitionLink
                  href={item.link}
                  aria-label={`${Global("links.update")} ${item.title}`}
                  className="button-link button--primary"
                >
                  {Global("links.update")}
                </TransitionLink>
              )}
            </div>
          )}
        </div>
      </div>

      {item.hasAdditionalGuidance && (
        <div className={styles.guidance}>
          <DmpIcon icon="check_circle" aria-hidden="true" />
          {SelectListItem("messages.additionalGuidance")}
        </div>
      )}
    </div>
  );
}

export default TemplateSelectListItem;
