"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "react-aria-components";
import OverviewSection from "@/components/OverviewSection";
import Loading from "@/components/Loading";
import NotificationHeader from "@/components/Notification";
import {
  ContentContainer,
  FullWidthSection,
  LayoutSplitPanel,
  LayoutWithPanel,
  SidebarPanel,
} from "@/components/Container";
import type { PlanAuthoringDataSource, PlanAuthoringState } from "../dataSource";
import type {
  PlanAuthoringVariant,
  PlanDocument,
  PlanSectionDefinition,
} from "../model";
import {
  collectLockedGuidanceOrgIds,
  questionKey,
  sectionKey,
} from "../model";
import { usePlanSectionNavigation } from "../usePlanSectionNavigation";
import { useSectionPickerShortcut } from "../useSectionPickerShortcut";
import { useUnsavedChangesRegistry } from "../useUnsavedChangesRegistry";
import PlanSectionNavigation from "../PlanSectionNavigation";
import PlanSectionPickerDialog from "../PlanSectionPickerDialog";
import PlanSection from "../PlanSection";
import PlanQuestion from "../PlanQuestion";
import PlanGuidanceCustomizeDialog from "../PlanGuidanceCustomizeDialog";
import PlanDocumentCard from "../PlanDocumentCard";
import PlanDocumentUploadDialog from "../PlanDocumentUploadDialog";
import styles from "./PlanAuthoringScreen.module.scss";

interface PlanAuthoringProps {
  dataSource: PlanAuthoringDataSource;
  className?: string;
  variant?: PlanAuthoringVariant;
  planDocument?: PlanDocument;
  idPrefix?: string;
  overview?: React.ReactNode;
}

const NO_SECTIONS: PlanSectionDefinition[] = [];

function fileTypeFromName(fileName: string): string {
  return fileName.split(".").pop()?.toUpperCase() || "FILE";
}

export default function PlanAuthoring({
  dataSource,
  className,
  variant = "questions",
  planDocument: initialPlanDocument,
  idPrefix = "plan-authoring",
  overview,
}: PlanAuthoringProps) {
  const t = useTranslations("PlanAuthoring");
  const Global = useTranslations("Global");
  const isDocument = variant === "document";
  const [state, setState] = useState<PlanAuthoringState>(() =>
    dataSource.getState()
  );
  const [pickerOpen, setPickerOpen] = useState(false);
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [planDocument, setPlanDocument] = useState<PlanDocument | undefined>(
    initialPlanDocument
  );

  useEffect(() => {
    setState(dataSource.getState());
    return dataSource.subscribe(() => {
      setState(dataSource.getState());
    });
  }, [dataSource]);

  const model = state.status === "ready" ? state.model : null;
  const sections = model?.sections ?? NO_SECTIONS;
  const registerUnsavedChange = useUnsavedChangesRegistry();

  useEffect(() => {
    setPlanDocument(initialPlanDocument);
  }, [initialPlanDocument]);

  useSectionPickerShortcut(
    useCallback(() => {
      if (!isDocument) {
        setPickerOpen((open) => !open);
      }
    }, [isDocument])
  );

  const navigation = usePlanSectionNavigation({ sections });

  const lockedOrgIds = useMemo(
    () => collectLockedGuidanceOrgIds(sections),
    [sections]
  );

  return (
    <div className={[styles.planAuthoring, className].filter(Boolean).join(" ")}>
      <LayoutSplitPanel>
        {overview ?? (
          <LayoutWithPanel>
            <ContentContainer>
              <div className="container">
                <div className={styles.planTitleBlock}>
                  <h1 className={styles.planTitle}>{model?.title}</h1>
                  {model ? (
                    <p className={styles.planTemplateMeta}>
                      {t("screen.basedOn", {
                        template: model.templateName,
                        funder: model.funderName,
                        version: model.templateVersion,
                      })}
                    </p>
                  ) : null}
                </div>
                <div className="project-overview">
                  <OverviewSection
                    heading={t("screen.fundingTitle")}
                    headingId={`${idPrefix}-funding`}
                    linkHref="#"
                    linkText={t("screen.adjustForPlan")}
                    linkAriaLabel={t("screen.adjustFundingAria")}
                    includeLink={false}
                  >
                    <p>{model?.funderName}</p>
                  </OverviewSection>
                  <OverviewSection
                    heading={t("screen.membersTitle")}
                    headingId={`${idPrefix}-members`}
                    linkHref="#"
                    linkText={t("screen.adjustForPlan")}
                    linkAriaLabel={t("screen.adjustMembersAria")}
                    includeLink={false}
                  >
                    <p>{model?.membersLabel}</p>
                  </OverviewSection>
                  <OverviewSection
                    heading={t("screen.relatedWorksTitle")}
                    headingId={`${idPrefix}-related-works`}
                    linkHref="#"
                    linkText={t("screen.adjustForPlan")}
                    linkAriaLabel={t("screen.adjustRelatedWorksAria")}
                    includeLink={false}
                  >
                    <p>{t("screen.relatedWorksEmpty")}</p>
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
                  <Button isDisabled>
                    {Global("buttons.publish")}
                  </Button>
                </div>
                <div className="side-panel-content">
                  <div className="panelRow mb-5">
                    <div>
                      <h3>{t("screen.template")}</h3>
                      <p>
                        {model
                          ? `${model.templateName} · ${model.templateVersion}`
                          : null}
                      </p>
                    </div>
                  </div>
                  <div className="panelRow mb-5">
                    <div>
                      <h3>{t("screen.affiliation")}</h3>
                      <p>{model?.affiliationName}</p>
                    </div>
                  </div>
                  <div className="panelRow mb-5">
                    <div>
                      <h3>{t("screen.progress")}</h3>
                      <p>
                        {t("screen.percentComplete", {
                          percent: model?.progress.percentComplete ?? 0,
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </SidebarPanel>
          </LayoutWithPanel>
        )}

        {isDocument ? (
          <FullWidthSection className={`${styles.writePlanRegion} ${styles.documentRegion}`}>
            <div className={styles.writePlanIntro}>
              <h2>{t("screen.planDocument")}</h2>
              <p>
                {t.rich("screen.planDocumentIntro", {
                  strong: (chunks) => <strong>{chunks}</strong>,
                })}
              </p>
            </div>
            {planDocument ? (
              <PlanDocumentCard
                planDocument={planDocument}
                onUpdate={() => setUploadOpen(true)}
                onDelete={() => {
                  setUploadOpen(false);
                  setPlanDocument(undefined);
                }}
              />
            ) : null}
          </FullWidthSection>
        ) : (
          <FullWidthSection className={styles.writePlanRegion}>
            {model && !model.capabilities.canEditAnswers ? (
              <div className={styles.readOnlyNotice}>
                <NotificationHeader title={t("screen.readOnlyTitle")}>
                  <p>{t("screen.readOnlyNotice")}</p>
                </NotificationHeader>
              </div>
            ) : null}
            <div className={styles.writePlanIntro}>
              <h2>{t("screen.writeYourPlan")}</h2>
              <p>{t("screen.writePlanIntro")}</p>
              {model ? (
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
              ) : null}
            </div>

            {state.status === "loading" ? (
              <Loading
                variant="inline"
                message={t("screen.loadingPlan")}
              />
            ) : null}

            {state.status === "error" ? (
              <div
                className={styles.loadError}
                role="alert"
              >
                <p>{t("screen.loadFailed")}</p>
                <p className={styles.loadErrorDetail}>{state.message}</p>
                <Button onPress={() => dataSource.reload()}>
                  {t("common.retry")}
                </Button>
              </div>
            ) : null}

            {model ? (
              <>
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
                          dataSource={dataSource}
                          onCustomizeGuidance={() => setCustomizeOpen(true)}
                          registerUnsavedChange={registerUnsavedChange}
                        />
                      ))}
                    </PlanSection>
                  ))}
                </div>
              </>
            ) : null}
          </FullWidthSection>
        )}
      </LayoutSplitPanel>

      {!isDocument && model ? (
        <>
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
        </>
      ) : null}

      {isDocument && planDocument ? (
        <PlanDocumentUploadDialog
          isOpen={uploadOpen}
          onOpenChange={setUploadOpen}
          fileName={planDocument.fileName}
          onUpload={(file) => {
            setPlanDocument((current) => ({
              ...(current ?? { fileName: file.name }),
              fileName: file.name,
              fileType: fileTypeFromName(file.name),
            }));
          }}
        />
      ) : null}
    </div>
  );
}
