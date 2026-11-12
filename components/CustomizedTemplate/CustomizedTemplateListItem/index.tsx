import { useTranslations } from "next-intl";
import { Link } from "react-aria-components";

import { DmpIcon } from "@/components/Icons";
import styles from "./customizedTemplateListItem.module.scss";
import { CustomizedTemplatesProps } from '@/app/types';

interface CustomizedTemplateListItemProps {
  item: CustomizedTemplatesProps;
  handleAddCustomization: (item: CustomizedTemplatesProps) => Promise<void>;
}


function CustomizedTemplateListItem({
  item,
  handleAddCustomization
}: CustomizedTemplateListItemProps) {

  //Localization keys
  const Global = useTranslations("Global");
  const Customizable = useTranslations('CustomizableTemplates');
  // Create unique IDs for ARIA relationships
  const headingId = `${item?.title?.toLowerCase().replace(/\s+/g, "-")}-heading`;

  return (
    <div
      className={styles.templateItem}
      role="listitem"
      data-testid="template-list-item"
    >
      <div className={styles.templateItemWrapper}>
        <div className={styles.TemplateItemInner}>
          <div className={styles.TemplateItemContent}>
            <div className={styles.funder}>{item.funder}</div>
            <h3
              className={styles.TemplateItemHeading}
              id={headingId}
            >
              {/* A template that hasn't been customized has no customization page yet, so its title creates the
                  customization first, like the Update action */}
              <Link
                {...(item.link ? { href: item.link } : { onPress: () => handleAddCustomization(item) })}
                aria-label={`${Global("links.update")} ${item.title}`}
                className={styles.titleLink}
              >
                {item.title}
              </Link>
            </h3>

            {/**Display customization metadata */}
            <div
              className={styles.metadata}
              data-testid="template-metadata"
            >
              {item.lastCustomizedByName && (
                <span>
                  {Customizable("templateStatus.lastCustomizedBy")}:{' '}{item.lastCustomizedByName}
                </span>
              )}
              {item.lastCustomized && (
                <span className={item.lastCustomizedByName ? styles.separator : ''}>
                  {Customizable("templateStatus.lastCustomized")}:{' '}{item.lastCustomized}
                </span>
              )}
              {item.customizationStatus && item.customizationStatus.length > 0 && (
                <div className={styles.publishStatus}>
                  <span className={(item.lastCustomizedByName || item.lastCustomized) ? styles.separator : ''}>
                    {Customizable("templateStatus.customizationStatus")}:{' '}{item.customizationStatus}
                  </span>
                  <span className={`${styles.unpublishedChangesIcon} ${styles.warning} icon `}>
                    {item.customizationStatus === Customizable('templateStatus.hasChanged') ? (
                      <DmpIcon icon="warning" />
                    ) : item.customizationStatus === Customizable('templateStatus.unPublished') ? (
                      <DmpIcon icon="edit-square" />
                    ) : null}
                  </span>
                </div>
              )}
              {item.templateModified && (
                <span className={item.templateModified ? styles.separator : ''}>
                  {Customizable("templateStatus.templateLastUpdated")}:{' '}{item.templateModified}
                </span>
              )}
            </div>
          </div>

          <div className={styles.TemplateItemActions}>
            <Link
              aria-label={`${Global("links.update")} ${item.title}`}
              className="button-link button--primary"
              onPress={() => handleAddCustomization(item)}
            >
              {Global("links.update")}
            </Link>
          </div>

        </div>
      </div>
    </div >
  );
}

export default CustomizedTemplateListItem;
