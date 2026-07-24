"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
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
import { sectionKey } from "../model";
import { usePlanSectionNavigation } from "../usePlanSectionNavigation";
import { useSectionPickerShortcut } from "../useSectionPickerShortcut";
import PlanSectionNavigation from "../PlanSectionNavigation";
import PlanSectionPickerDialog from "../PlanSectionPickerDialog";
import PlanSection from "../PlanSection";
import PlanQuestion from "../PlanQuestion";
import PlanGuidanceCustomizeDialog from "../PlanGuidanceCustomizeDialog";
import styles from "../PlanAuthoring.module.scss";

interface PlanAuthoringProps {
  dataSource: PlanAuthoringDataSource;
  className?: string;
}

export default function PlanAuthoring({
  dataSource,
  className,
}: PlanAuthoringProps) {
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

  // Cmd+K (mac) / Ctrl+K (windows, linux) toggles the section picker.
  useSectionPickerShortcut(
    useCallback(() => setPickerOpen((open) => !open), [])
  );

  const navigation = usePlanSectionNavigation({ sections: model.sections });

  const lockedOrgIds = useMemo(() => {
    const locked = new Set<string>();
    model.sections.forEach((section) => {
      section.questions.forEach((question) => {
        question.guidanceSources.forEach((source) => {
          if (source.locked) {
            locked.add(source.id);
          }
        });
      });
    });
    return Array.from(locked);
  }, [model.sections]);

  return (
    <div className={[styles.planAuthoring, className].filter(Boolean).join(" ")}>
      <LayoutSplitPanel>
        <LayoutWithPanel>
          <ContentContainer>
            <div className="container">
              <div className={styles.planTitleBlock}>
                <h1 className={styles.planTitle}>{model.title}</h1>
                <p className={styles.planTemplateMeta}>
                  This plan is based on the &ldquo;{model.templateName}&rdquo;
                  provided by {model.funderName} — Version:{" "}
                  {model.templateVersion}.
                </p>
              </div>
              <div className="project-overview">
                <OverviewSection
                  heading="Funding for this plan"
                  headingId="plan-authoring-funding"
                  linkHref="#"
                  linkText="Adjust for this plan"
                  linkAriaLabel="Adjust funding for this plan"
                  includeLink={false}
                >
                  <p>{model.funderName}</p>
                </OverviewSection>
                <OverviewSection
                  heading="Plan members for this plan"
                  headingId="plan-authoring-members"
                  linkHref="#"
                  linkText="Adjust for this plan"
                  linkAriaLabel="Adjust members for this plan"
                  includeLink={false}
                >
                  <p>{model.membersLabel}</p>
                </OverviewSection>
                <OverviewSection
                  heading="Related works for this plan"
                  headingId="plan-authoring-related-works"
                  linkHref="#"
                  linkText="Adjust for this plan"
                  linkAriaLabel="Adjust related works for this plan"
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
                  Preview
                </Button>
                <Button isDisabled={!model.capabilities.canPublish}>
                  Publish
                </Button>
              </div>
              <div className="side-panel-content">
                <div className="panelRow mb-5">
                  <div>
                    <h3>Template</h3>
                    <p>
                      {model.templateName} · {model.templateVersion}
                    </p>
                  </div>
                </div>
                <div className="panelRow mb-5">
                  <div>
                    <h3>Affiliation</h3>
                    <p>{model.affiliationName}</p>
                  </div>
                </div>
                <div className="panelRow mb-5">
                  <div>
                    <h3>Progress</h3>
                    <p>{model.progress.percentComplete}% complete</p>
                  </div>
                </div>
              </div>
            </div>
          </SidebarPanel>
        </LayoutWithPanel>

        <FullWidthSection className={styles.writePlanRegion}>
          <div className={styles.writePlanIntro}>
            <h2>Write your plan</h2>
            <p>
              Work through each section below — answers save automatically. Use
              Jump to section or the section title above to move between
              sections.
            </p>
            <p className={styles.progressSummary}>
              {model.progress.answeredQuestions} of{" "}
              {model.progress.totalQuestions} questions answered
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
                    key={
                      question.identity.kind === "base"
                        ? `base-${question.identity.versionedQuestionId}`
                        : `custom-${question.identity.customQuestionId}`
                    }
                    question={question}
                    capabilities={model.capabilities}
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
