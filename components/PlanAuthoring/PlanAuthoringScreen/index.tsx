"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "react-aria-components";
import OverviewSection from "@/components/OverviewSection";
import {
  ContentContainer,
  FullWidthSection,
  LayoutSplitPanel,
  LayoutWithPanel,
  SidebarPanel,
} from "@/components/Container";
import type { PlanAuthoringDataSource } from "../dataSource";
import type { PlanAuthoringModel } from "../model";
import {
  collectLockedGuidanceOrgIds,
  questionKey,
  sectionKey,
} from "../model";
import { usePlanSectionNavigation } from "../usePlanSectionNavigation";
import { useSectionPickerShortcut } from "../useSectionPickerShortcut";
import PlanSectionNavigation from "../PlanSectionNavigation";
import PlanSectionPickerDialog from "../PlanSectionPickerDialog";
import PlanSection from "../PlanSection";
import PlanQuestion from "../PlanQuestion";
import PlanGuidanceCustomizeDialog from "../PlanGuidanceCustomizeDialog";
import styles from "./PlanAuthoringScreen.module.scss";

interface PlanAuthoringProps {
  dataSource: PlanAuthoringDataSource;
  className?: string;
}

export default function PlanAuthoring({
  dataSource,
  className,
}: PlanAuthoringProps) {
  const t = useTranslations("PlanAuthoring");
  const Global = useTranslations("Global");
  const [model, setModel] = useState<PlanAuthoringModel>(() =>
    dataSource.getModel()
  );
  const [pickerOpen, setPickerOpen] = useState(false);
  const [customizeOpen, setCustomizeOpen] = useState(false);

  useEffect(() => {
    return dataSource.subscribe(() => {
      setModel(dataSource.getModel());
    });
  }, [dataSource]);

  useSectionPickerShortcut(
    useCallback(() => setPickerOpen((open) => !open), [])
  );

  const navigation = usePlanSectionNavigation({ sections: model.sections });

  const lockedOrgIds = useMemo(
    () => collectLockedGuidanceOrgIds(model.sections),
    [model.sections]
  );

  return (
    <div className={[styles.planAuthoring, className].filter(Boolean).join(" ")}>
      <LayoutSplitPanel>
        <LayoutWithPanel>
          <ContentContainer>
            <div className="container">
              <div className={styles.planTitleBlock}>
                <h1 className={styles.planTitle}>{model.title}</h1>
                <p className={styles.planTemplateMeta}>
                  {t("screen.basedOn", {
                    template: model.templateName,
                    funder: model.funderName,
                    version: model.templateVersion,
                  })}
                </p>
              </div>
              <div className="project-overview">
                <OverviewSection
                  heading={t("screen.fundingTitle")}
                  headingId="plan-authoring-funding"
                  linkHref="#"
                  linkText={t("screen.adjustForPlan")}
                  linkAriaLabel={t("screen.adjustFundingAria")}
                  includeLink={false}
                >
                  <p>{model.funderName}</p>
                </OverviewSection>
                <OverviewSection
                  heading={t("screen.membersTitle")}
                  headingId="plan-authoring-members"
                  linkHref="#"
                  linkText={t("screen.adjustForPlan")}
                  linkAriaLabel={t("screen.adjustMembersAria")}
                  includeLink={false}
                >
                  <p>{model.membersLabel}</p>
                </OverviewSection>
                <OverviewSection
                  heading={t("screen.relatedWorksTitle")}
                  headingId="plan-authoring-related-works"
                  linkHref="#"
                  linkText={t("screen.adjustForPlan")}
                  linkAriaLabel={t("screen.adjustRelatedWorksAria")}
                  includeLink={false}
                >
                  <p>{model.relatedWorksLabel}</p>
                </OverviewSection>
              </div>
            </div>
          </ContentContainer>

          <SidebarPanel>
            <div className="status-panel-content side-panel">
              <div className="buttonContainer withBorder mb-5">
                <Button
                  className="react-aria-Button react-aria-Button--secondary"
                  isDisabled
                >
                  {Global("buttons.preview")}
                </Button>
                <Button isDisabled={!model.capabilities.canPublish}>
                  {Global("buttons.publish")}
                </Button>
              </div>
              <div className="side-panel-content">
                <div className="panelRow mb-5">
                  <div>
                    <h3>{t("screen.template")}</h3>
                    <p>
                      {model.templateName} · {model.templateVersion}
                    </p>
                  </div>
                </div>
                <div className="panelRow mb-5">
                  <div>
                    <h3>{t("screen.affiliation")}</h3>
                    <p>{model.affiliationName}</p>
                  </div>
                </div>
                <div className="panelRow mb-5">
                  <div>
                    <h3>{t("screen.progress")}</h3>
                    <p>
                      {t("screen.percentComplete", {
                        percent: model.progress.percentComplete,
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </SidebarPanel>
        </LayoutWithPanel>

        <FullWidthSection className={styles.writePlanRegion}>
          <div className={styles.writePlanIntro}>
            <h2>{t("screen.writeYourPlan")}</h2>
            <p>{t("screen.writePlanIntro")}</p>
            <p className={styles.progressSummary}>
              {t("screen.questionsAnswered", {
                answered: model.progress.answeredQuestions,
                total: model.progress.totalQuestions,
              })}
              <span>
                {" "}
                · {model.progress.percentComplete}%
              </span>
            </p>
          </div>

          <PlanSectionNavigation
            sections={model.sections}
            activeSection={navigation.activeSection}
            activeIndex={navigation.activeIndex}
            activeSectionProgress={navigation.activeSectionProgress}
            onOpenPicker={() => setPickerOpen(true)}
            onSelectSection={navigation.jumpToSection}
          />

          <div className={styles.sectionsStack}>
            {model.sections.map((section, index) => (
              <PlanSection
                key={sectionKey(section.identity)}
                section={section}
                index={index}
                total={model.sections.length}
              >
                {section.questions.map((question) => (
                  <PlanQuestion
                    key={questionKey(question.identity)}
                    question={question}
                    capabilities={model.capabilities}
                    currentUserId={model.currentUserId}
                    dataSource={dataSource}
                    onCustomizeGuidance={() => setCustomizeOpen(true)}
                  />
                ))}
              </PlanSection>
            ))}
          </div>
        </FullWidthSection>
      </LayoutSplitPanel>

      <PlanSectionPickerDialog
        isOpen={pickerOpen}
        onOpenChange={setPickerOpen}
        sections={model.sections}
        activeSectionKey={navigation.activeSectionKey}
        onSelect={navigation.jumpToSection}
      />

      <PlanGuidanceCustomizeDialog
        isOpen={customizeOpen}
        onOpenChange={setCustomizeOpen}
        selectedOrgIds={model.selectedGuidanceOrgIds}
        lockedOrgIds={lockedOrgIds}
        availableOrgs={model.availableGuidanceOrgs}
        onSearch={(term) => dataSource.searchGuidanceOrgs(term)}
        onSave={async (orgIds) => {
          await dataSource.setSelectedGuidanceOrgs(orgIds);
        }}
      />
    </div>
  );
}
