import {
  RelatedWorksIdentifierType,
  RelatedWorkStatus
} from "@/generated/graphql";
import { RelatedWorksList, RelatedWorksPlanScope } from "@/components/RelatedWorksList";
import { Key, Tab, TabList, TabPanel, Tabs } from "react-aria-components";
import React, { ReactNode, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import styles from "./RelatedWorksTabs.module.scss";

// Also used as URL hashes (#maybe), so links to a tab break if these change
const TAB_KEYS = ["related", "maybe", "dismissed"] as const;
export type RelatedWorksTabKey = (typeof TAB_KEYS)[number];
const DEFAULT_TAB: RelatedWorksTabKey = "maybe";

const isTabKey = (value: string): value is RelatedWorksTabKey => (TAB_KEYS as readonly string[]).includes(value);

interface RelatedWorksTabsProps {
  identifierType: RelatedWorksIdentifierType;
  identifier: number;
  /** false: hide Dismissed and show unpublishedContent. undefined: still loading */
  hasPublishedPlan?: boolean;
  unpublishedContent?: ReactNode;
  unpublishedPlanIds?: number[];
  planScope?: RelatedWorksPlanScope;
  addHref?: string;
}

export const RelatedWorksTabs = ({
  identifierType,
  identifier,
  hasPublishedPlan,
  unpublishedContent,
  unpublishedPlanIds,
  planScope,
  addHref,
}: RelatedWorksTabsProps) => {
  const t = useTranslations("RelatedWorksTabs");
  const [selectedTab, setSelectedTab] = useState<RelatedWorksTabKey>(DEFAULT_TAB);
  const tabsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const syncFromHash = () => {
      const hash = window.location.hash.replace("#", "");
      if (isTabKey(hash)) {
        setSelectedTab(hash);
      }
    };
    syncFromHash();
    window.addEventListener("hashchange", syncFromHash);
    return () => window.removeEventListener("hashchange", syncFromHash);
  }, []);

  const isUnpublished = hasPublishedPlan === false;
  const activeTab = isUnpublished && selectedTab === "dismissed" ? DEFAULT_TAB : selectedTab;

  const handleSelectionChange = (key: Key) => {
    const tab = String(key);
    if (!isTabKey(tab)) return;
    setSelectedTab(tab);
    window.history.replaceState(window.history.state, "", `#${tab}`);
  };

  // The button that called this is in the panel being replaced, so focus the new tab
  const reviewMatches = () => {
    handleSelectionChange("maybe");
    requestAnimationFrame(() => {
      tabsRef.current?.querySelector<HTMLElement>('[role="tab"][aria-selected="true"]')?.focus();
    });
  };

  const listProps = {
    identifierType,
    identifier,
    unpublishedPlanIds,
    planScope,
    addHref,
    onReviewMatches: isUnpublished ? undefined : reviewMatches,
  };

  return (
    <Tabs
      ref={tabsRef}
      className={`react-aria-Tabs ${styles.tabs}`}
      selectedKey={activeTab}
      onSelectionChange={handleSelectionChange}
    >
      <TabList aria-label={t("ariaLabel")}>
        <Tab id="related">{t("tabs.accepted")}</Tab>
        <Tab id="maybe">{t("tabs.pending")}</Tab>
        {!isUnpublished && <Tab id="dismissed">{t("tabs.rejected")}</Tab>}
      </TabList>

      <TabPanel id="related">
        <h2 className="hidden-accessibly">{t("tabs.accepted")}</h2>
        <RelatedWorksList
          {...listProps}
          status={RelatedWorkStatus.Accepted}
        />
      </TabPanel>
      <TabPanel id="maybe">
        <h2 className="hidden-accessibly">{t("tabs.pending")}</h2>
        {isUnpublished && unpublishedContent ? (
          unpublishedContent
        ) : (
          <RelatedWorksList
            {...listProps}
            status={RelatedWorkStatus.Pending}
          />
        )}
      </TabPanel>
      {!isUnpublished && (
        <TabPanel id="dismissed">
          <h2 className="hidden-accessibly">{t("tabs.rejected")}</h2>
          <RelatedWorksList
            {...listProps}
            status={RelatedWorkStatus.Rejected}
          />
        </TabPanel>
      )}
    </Tabs>
  );
};
