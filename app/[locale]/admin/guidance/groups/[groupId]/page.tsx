"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Breadcrumb,
  Breadcrumbs,
  Button,
  Dialog,
  DialogTrigger,
  Link,
  OverlayArrow,
  Popover,
  Tooltip,
  TooltipTrigger
} from "react-aria-components";
import { useParams, useRouter } from "next/navigation";

import { useQuery } from '@apollo/client/react';

// GraphQL
import {
  MeDocument,
  GuidanceGroupDocument,
  GuidanceByGroupDocument,
  TagsDocument,
} from '@/generated/graphql';
import {
  addGuidanceTextAction,
  publishGuidanceGroupAction,
  unPublishGuidanceGroupAction,
  updateGuidanceAction
} from "./actions";

// Components
import PageHeader from "@/components/PageHeader";
import { Card, } from "@/components/Card/card";
import TinyMCEEditor from "@/components/TinyMCEEditor";
import { DmpIcon } from "@/components/Icons";
import Loading from "@/components/Loading";
import ErrorMessages from "@/components/ErrorMessages";

// Hooks
import { useFormatDate } from '@/hooks/useFormatDate';

// Utils, other
import { ContentContainer, LayoutWithPanel, SidebarPanel } from "@/components/Container";
import { stripHtmlTags } from '@/utils/general';
import { routePath } from "@/utils/routes";
import { useToast } from "@/context/ToastContext";
import logECS from "@/utils/clientLogger";
import { extractErrors } from "@/utils/errorHandler";

// Types
import {
  GuidanceGroup,
  GuidanceText,
  TagGuidanceItem,
  AddGuidanceResponse,
  UpdateGuidanceTextErrors,
  AddGuidanceTextErrors,
  PublishGuidanceGroupErrors,
  GuidanceGroupStatus
} from "@/app/types/guidance";

import styles from "./guidanceGroupIndex.module.scss";

const GuidanceGroupIndexPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const toastState = useToast();
  const formatDate = useFormatDate();

  const groupId = String(params.groupId);

  //For scrolling to error in page
  const errorRef = useRef<HTMLDivElement | null>(null);

  // States for guidance group and texts
  const [guidanceGroup, setGuidanceGroup] = useState<GuidanceGroup>();
  const [guidanceTexts, setGuidanceTexts] = useState<GuidanceText[]>([]);
  const [tagGuidanceList, setTagGuidanceList] = useState<TagGuidanceItem[]>([]);
  const [savingGuidanceId, setSavingGuidanceId] = useState<string | null>(null);
  // State for error messages
  const [errorMessages, setErrorMessages] = useState<string[]>([]);
  // Track whether there are unsaved changes
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);

  // For translations
  const t = useTranslations("Guidance");
  const Global = useTranslations("Global");

  // Set URLs
  const GROUP_EDIT_URL = routePath("admin.guidance.groups.edit", { groupId });

  // Helper function to get translated status label
  const getStatusLabel = (status: GuidanceGroupStatus): string => {
    switch (status) {
      case GuidanceGroupStatus.DRAFT:
        return t('status.draft');
      case GuidanceGroupStatus.PUBLISHED:
        return t('status.published');
      case GuidanceGroupStatus.UNPUBLISHED_CHANGES:
        return t('status.unpublishedChanges');
      default:
        return status;
    }
  };

  // Query for all tags
  const { data: tagsData, loading: tagsLoading } = useQuery(TagsDocument);

  // Run me query to get user's name
  const { data: me, loading: meLoading } = useQuery(MeDocument);

  // Fetch guidance group data
  const { data: guidanceGroupData, loading: guidanceGroupLoading } = useQuery(GuidanceGroupDocument, {
    variables: {
      guidanceGroupId: Number(groupId)
    },
    fetchPolicy: "cache-and-network",
  });

  // Fetch Guidance Texts by Group Id
  const { data: guidance, loading: guidanceLoading } = useQuery(GuidanceByGroupDocument, {
    variables: {
      guidanceGroupId: Number(groupId)
    },
    fetchPolicy: "cache-and-network",
  });

  // Handler to update guidance text in state
  const handleGuidanceTextChange = (tagId: number, newText: string) => {
    setTagGuidanceList(prevList =>
      prevList.map(item => {
        if (item.tag.id === tagId) {
          if (item.guidance) {
            // Update existing guidance
            return { ...item, guidance: { ...item.guidance, guidanceText: newText } };
          } else {
            // Create temporary guidance object for tags without existing guidance
            return {
              ...item,
              guidance: {
                id: `temp-${tagId}`,
                guidanceText: newText,
                lastUpdated: '',
                lastUpdatedBy: '',
                url: '',
                tagId,
              }
            };
          }
        }
        return item;
      })
    );
  };

  const handleUnpublish = useCallback(async () => {
    setErrorMessages([]);

    if (hasUnsavedChanges) {
      const confirmProceed = window.confirm(
        Global("messaging.unsavedChangesWarning") + " " + Global("messaging.continueAnyway")
      );
      if (!confirmProceed) {
        return;
      }
    }

    if (guidanceGroup?.guidanceGroupId === undefined) {
      setErrorMessages(['Guidance Group ID is undefined']);
      return;
    }

    const response = await unPublishGuidanceGroupAction({
      guidanceGroupId: guidanceGroup.guidanceGroupId
    });

    if (response.redirect) {
      router.push(response.redirect);
      return;
    }

    if (!response.success) {
      setErrorMessages(
        response.errors?.length ? response.errors : [Global("messaging.somethingWentWrong")]
      )
      logECS("error", "Unpublishing Guidance Group", {
        errors: response.errors,
        url: { path: routePath("admin.guidance.groups.create") },
      });
      return;
    } else {
      if (response?.data?.errors) {
        const errs = extractErrors<PublishGuidanceGroupErrors>(response?.data?.errors, ["general", "affiliationId", "bestPractice", "name", "description"]);

        if (errs.length > 0) {
          setErrorMessages(errs);
          logECS("error", "Unpublishing Guidance Group", {
            errors: errs,
            url: { path: routePath("admin.guidance.groups.create") },
          });
        } else {
          const successMessage = t("messages.success.guidanceGroupUnpublished", { groupName: guidanceGroup?.name });
          toastState.add(successMessage, { type: "success" });
          router.push(routePath("admin.guidance.index"));
        }
      }
    }
  }, [guidanceGroup, Global, router, hasUnsavedChanges, t, toastState]);


  const handlePublish = useCallback(async () => {
    setErrorMessages([]);

    if (hasUnsavedChanges) {
      const confirmProceed = window.confirm(
        Global("messaging.unsavedChangesWarning") + " " + Global("messaging.continueAnyway")
      );
      if (!confirmProceed) {
        return;
      }
    }

    if (guidanceGroup?.guidanceGroupId === undefined) {
      setErrorMessages(['Guidance Group ID is undefined']);
      return;
    }

    const response = await publishGuidanceGroupAction({
      guidanceGroupId: guidanceGroup.guidanceGroupId
    });

    if (response.redirect) {
      router.push(response.redirect);
      return;
    }

    if (!response.success) {
      setErrorMessages(
        response.errors?.length ? response.errors : [Global("messaging.somethingWentWrong")]
      )
      logECS("error", "publishing Guidance Group", {
        errors: response.errors,
        url: { path: routePath("admin.guidance.groups.create") },
      });
      return;
    } else {
      if (response?.data?.errors) {
        const errs = extractErrors<PublishGuidanceGroupErrors>(response?.data?.errors, ["general", "affiliationId", "bestPractice", "name", "description"]);

        if (errs.length > 0) {
          setErrorMessages(errs);
          logECS("error", "publishing Guidance Group", {
            errors: errs,
            url: { path: routePath("admin.guidance.groups.create") },
          });
        } else {
          const successMessage = t("messages.success.guidanceGroupPublished", { groupName: guidanceGroup?.name });
          toastState.add(successMessage, { type: "success" });
          router.push(routePath("admin.guidance.index"));
        }
      }
    }
  }, [guidanceGroup, Global, router, hasUnsavedChanges, t, toastState]);

  // Handler to update guidance or add new one based on the tagId
  const handleSaveGuidance = async (tagId: number) => {
    setErrorMessages([]);

    // Find the guidance based on the tagId
    const tagItem = tagGuidanceList.find(item => item.tag.id === tagId);

    // If none exists then return
    if (!tagItem) {
      return;
    }

    // Get the text to save from the guidance object
    const textToSave = tagItem.guidance?.guidanceText ?? "";

    // Use a temporary ID for new guidance that's being saved
    const savingId = tagItem.guidance?.id ?? `new-${tagId}`;
    setSavingGuidanceId(savingId);

    // Check if this is a real guidance (has a numeric ID) or a temporary one
    const isExistingGuidance = tagItem.guidance && !tagItem.guidance.id.startsWith('temp-');

    // If guidance exists, update it; otherwise, create new guidance
    if (isExistingGuidance && tagItem.guidance) {
      // Don't need a try-catch block here, as the error is handled in the action
      const response = await updateGuidanceAction({
        guidanceId: parseInt(tagItem.guidance.id, 10),
        guidanceText: textToSave,
        tagId,
      });

      if (response.redirect) {
        router.push(response.redirect);
        return;
      }

      if (!response.success) {
        setErrorMessages(
          response.errors?.length ? response.errors : [Global("messaging.somethingWentWrong")]
        )
        logECS("error", "updating Guidance text", {
          errors: response.errors,
          url: { path: routePath("admin.guidance.groups.index", { groupId }) },
        });
        return;
      } else {
        // Check if there are any GraphQL errors
        if (response?.data?.errors) {
          const errs = extractErrors<UpdateGuidanceTextErrors>(response?.data?.errors, ["general", "guidanceGroupId", "guidanceText", "tagId"]);

          if (errs.length > 0) {
            setErrorMessages(errs);
            logECS("error", "updating Guidance text", {
              errors: errs,
              url: { path: routePath("admin.guidance.groups.index", { groupId }) },
            });
            return; // Don't show success if there are errors
          }
        }

        // Success case - no errors
        setHasUnsavedChanges(false);
        const successMessage = t("messages.success.guidanceTextUpdated", { tagName: tagItem.tag.name });
        toastState.add(successMessage, { type: "success" });

        // Optimistically update guidance group status if it was previously published
        setGuidanceGroup(prev => prev && prev.status === GuidanceGroupStatus.PUBLISHED
          ? { ...prev, status: GuidanceGroupStatus.UNPUBLISHED_CHANGES }
          : prev);
      }
    } else {
      // Create new guidance since none exists for this tag
      // Don't need a try-catch block here, as the error is handled in the action
      const response = await addGuidanceTextAction({
        guidanceGroupId: Number(groupId),
        guidanceText: textToSave,
        tagId,
      });

      if (response.redirect) {
        router.push(response.redirect);
        return;
      }

      if (!response.success) {
        setErrorMessages(
          response.errors?.length ? response.errors : [Global("messaging.somethingWentWrong")]
        )
        logECS("error", "adding Guidance text", {
          errors: response.errors,
          url: { path: routePath("admin.guidance.groups.index", { groupId }) },
        });
        return;
      } else {
        // Check if there are any GraphQL errors
        if (response?.data?.errors) {
          const errs = extractErrors<AddGuidanceTextErrors>(response?.data?.errors, ["general", "guidanceGroupId", "guidanceText", "tagId"]);

          if (errs.length > 0) {
            setErrorMessages(errs);
            logECS("error", "adding Guidance text", {
              errors: errs,
              url: { path: routePath("admin.guidance.groups.index", { groupId }) },
            });
            return; // Don't show success if there are errors
          }
        }
        // Success case - no errors
        setHasUnsavedChanges(false);
        // Optimistically update the local state to reflect the new guidance
        const newGuidanceId = String((response as AddGuidanceResponse)?.data?.id);
        if (newGuidanceId) {
          const newGuidance: GuidanceText = {
            id: newGuidanceId,
            guidanceText: textToSave,
            lastUpdated: '',
            lastUpdatedBy: `${me?.me?.givenName || ""} ${me?.me?.surName || ""}`.trim(),
            url: routePath("admin.guidance.groups.texts.edit", { groupId, textId: Number(newGuidanceId) }),
            tagId,
          };

          // Update guidanceTexts array
          setGuidanceTexts(prev => [...prev, newGuidance]);

          // Update tagGuidanceList to link the new guidance to this tag
          setTagGuidanceList(prev =>
            prev.map(item =>
              item.tag.id === tagId
                ? { ...item, guidance: newGuidance }
                : item
            )
          );
        }

        // Optimistically update guidance group status if it was previously published
        setGuidanceGroup(prev => prev && prev.status === GuidanceGroupStatus.PUBLISHED
          ? { ...prev, status: GuidanceGroupStatus.UNPUBLISHED_CHANGES }
          : prev);

        const successMessage = t("messages.success.guidanceTextAdded", { tagName: tagItem.tag.name });
        toastState.add(successMessage, { type: "success" });
      }

    }
    setSavingGuidanceId(null);
  };

  // Set Guidance Texts data in state when fetched
  useEffect(() => {
    if (guidance && guidance.guidanceByGroup.length > 0) {
      const transformedGuidanceTexts = guidance.guidanceByGroup.map((g) => ({
        id: String(g.id),
        guidanceText: g.guidanceText || "",
        lastUpdated: g.modified ? formatDate(g.modified) : "",
        lastUpdatedBy: `${g.modifiedBy?.givenName} ${g.modifiedBy?.surName}`,
        url: routePath("admin.guidance.groups.texts.edit", { groupId, textId: Number(g.id) }),
        tagId: typeof g.tagId === 'number' ? g.tagId : 0,
      }));

      setGuidanceTexts(transformedGuidanceTexts);
    }
  }, [guidance]);

  // Build the tag-guidance mapping whenever tags or guidance data changes
  // while preserving any unsaved changes
  useEffect(() => {
    if (tagsData?.tags && guidanceTexts) {
      // Only include tags that have a valid numeric id to avoid runtime/type errors downstream
      const validTags = tagsData.tags.filter((tag) => typeof tag.id === 'number');

      setTagGuidanceList(prevList => {
        const tagGuidanceMap: TagGuidanceItem[] = validTags.map(tag => {
          // Find the guidance from the graphql query that has this tag
          const matchingGuidance = guidanceTexts.find(g => g.tagId === (tag.id as number));

          // Check if there's an existing item in the previous list (could include unsaved guidance) for this tag
          const existingItem = prevList.find(item => item.tag.id === tag.id);

          // Determine which saved guidance to compare to for unsaved changes:
          let guidanceToUse = matchingGuidance || null;

          if (existingItem?.guidance) {
            // Check if the content stored in state is unsaved (different from the saved version)
            const isTempGuidance = existingItem.guidance.id.startsWith('temp-');

            // Check if the content has been modified from the saved version
            const hasUnsavedChanges = matchingGuidance &&
              existingItem.guidance.guidanceText !== matchingGuidance.guidanceText;

            // Preserve unsaved changes
            if (isTempGuidance || hasUnsavedChanges) {
              guidanceToUse = existingItem.guidance;
            }
          }

          return {
            tag: {
              id: tag.id as number,
              name: tag.name,
              description: tag.description || undefined,
            },
            guidance: guidanceToUse,
          };
        });

        return tagGuidanceMap;
      });
    }
  }, [tagsData, guidanceTexts]);

  useEffect(() => {
    // Set Guidance Group data in state when fetched. We need this for publishing the group
    if (guidanceGroupData && guidanceGroupData.guidanceGroup) {

      // Get the latest version and check if it's active
      const latestVersion = guidanceGroupData.guidanceGroup.versionedGuidanceGroup?.[0];
      const isLatestVersionActive = latestVersion?.active ?? false;

      // Publish status is determined based on isDirty and latestPublishedDate, and on whether the latest version of versionedGuidanceGroup is active
      const currentStatus = guidanceGroupData.guidanceGroup.isDirty && guidanceGroupData.guidanceGroup.latestPublishedDate
        ? GuidanceGroupStatus.UNPUBLISHED_CHANGES
        : !guidanceGroupData.guidanceGroup.latestPublishedDate || !isLatestVersionActive
          ? GuidanceGroupStatus.DRAFT
          : GuidanceGroupStatus.PUBLISHED;

      const transformedGuidanceGroup: GuidanceGroup = {
        guidanceGroupId: Number(guidanceGroupData.guidanceGroup?.id),
        name: guidanceGroupData.guidanceGroup.name || 'Untitled Guidance Group',
        description: guidanceGroupData.guidanceGroup.description || '',
        optionalSubset: guidanceGroupData.guidanceGroup.optionalSubset || false,
        bestPractice: guidanceGroupData.guidanceGroup.bestPractice || false,
        status: currentStatus,
        lastPublishedDate: guidanceGroupData.guidanceGroup.latestPublishedDate ? formatDate(guidanceGroupData.guidanceGroup.latestPublishedDate) : '',
      }

      setGuidanceGroup(transformedGuidanceGroup);
    };
  }, [guidanceGroupData]);

  // Intercept browser back/forward navigation to warn user of unsaved changes
  useEffect(() => {
    if (!hasUnsavedChanges) return;

    const handlePopState = () => {
      const confirmLeave = window.confirm(
        Global("messaging.unsavedChangesWarning"));

      if (!confirmLeave) {
        // Push current state back to prevent navigation
        window.history.pushState(null, '', window.location.href);
      } else {
        // User confirmed - allow navigation by going back
        setHasUnsavedChanges(false);
        window.history.back();
      }
    };

    // Push a state to enable popstate detection
    window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [hasUnsavedChanges, Global]);

  // Warn user of unsaved changes if they try to leave the page if they click on links or refresh/close the tab
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = ''; // Required for Chrome/Firefox to show the confirm dialog
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasUnsavedChanges]);


  // Determine button disabled states
  const isUnpublishUnavailable =
    !guidanceGroup || guidanceGroup.status === GuidanceGroupStatus.DRAFT;

  const isPublishUnavailable = !guidanceGroup || guidanceGroup.status === GuidanceGroupStatus.PUBLISHED;

  return (
    <>
      <PageHeader
        title={t("pages.groupIndex.title", { groupName: guidanceGroup?.name || "" })}
        description={t("pages.groupIndex.description")}
        showBackButton={false}
        breadcrumbs={
          <Breadcrumbs>
            <Breadcrumb>
              <Link href={routePath("app.home")}>{Global("breadcrumbs.home")}</Link>
            </Breadcrumb>
            <Breadcrumb>
              <Link href={routePath("admin.guidance.index")}>{t("breadcrumbs.guidanceGroups")}</Link>
            </Breadcrumb>
            <Breadcrumb>{t("breadcrumbs.group")}</Breadcrumb>
          </Breadcrumbs>
        }
        actions={
          <>
            <Link
              href={GROUP_EDIT_URL}
              className={`react-aria-Button--link ${styles.editGroupButton}`}
            >
              {t("pages.groupIndex.editGroup")}
            </Link>
          </>
        }
        className="page-guidance-group-index"
      />

      <ErrorMessages ref={errorRef} errors={errorMessages} />

      <LayoutWithPanel>
        <ContentContainer>
          {(tagsLoading || guidanceLoading || meLoading || guidanceGroupLoading) ? (
            <Loading message={Global("messaging.loading")} />
          ) : (
            <Card data-testid='guidance-card'>
              {tagGuidanceList
                .filter((it) => typeof it.tag.id === 'number')
                .map((item) => {
                  const tagId = item.tag.id as number;
                  return (
                    <div
                      key={tagId}
                      className={styles.guidanceListCard}
                    >

                      <div className={styles.tagWrapper}>
                        <h2 id={`contentLabel-${item.tag.id}`} className="h3">
                          {item.tag.name}
                        </h2>
                        {/*Display tooltip to user when they click the info icon*/}
                        <DialogTrigger>
                          <Button className="popover-btn" aria-label="Click for more info"><div className="icon info"><DmpIcon icon="info" /></div></Button>
                          <Popover className={`${styles.tagInfoPopover} react-aria-Popover`}>
                            <OverlayArrow>
                              <svg width={12} height={12} viewBox="0 0 12 12">
                                <path d="M0 0 L6 6 L12 0" />
                              </svg>
                            </OverlayArrow>
                            <Dialog>
                              <div className={styles.tagDescription}>
                                {stripHtmlTags(item.tag.description)}
                              </div>
                            </Dialog>
                          </Popover>
                        </DialogTrigger>
                      </div>


                      <div>
                        <TinyMCEEditor
                          content={item.guidance?.guidanceText ?? ""}
                          setContent={(value) => {
                            handleGuidanceTextChange(tagId, value);
                            setHasUnsavedChanges(true);
                          }}
                          id={`content-${tagId}`}
                          labelId={`contentLabel-${tagId}`}
                        />
                      </div>

                      <div className={styles.buttonWrapper}>
                        <Button
                          onPress={() => handleSaveGuidance(tagId)}
                          isDisabled={savingGuidanceId === item.guidance?.id || savingGuidanceId === `new-${tagId}`}
                          className="button--primary"
                        >
                          {(savingGuidanceId === item.guidance?.id || savingGuidanceId === `new-${tagId}`)
                            ? Global("buttons.saving") || "Saving..."
                            : Global("buttons.save") || "Save"}
                        </Button>
                      </div>
                    </div>
                  )
                })}

              {tagGuidanceList.length === 0 && (
                <div style={{ padding: '2rem', textAlign: 'center' }}>
                  <p>{t("pages.groupIndex.noTags") || "No tags available."}</p>
                </div>
              )}
            </Card>
          )}
        </ContentContainer>
        <SidebarPanel>
          <div className="status-panel-content side-panel">
            <div className="button-container withBorder  mb-5">
              {/*Unpublish Button*/}
              {(isUnpublishUnavailable) ? (
                <>
                  <TooltipTrigger delay={0}>
                    <Button
                      className={`${styles.buttonSmallDisabled} secondary`}
                      aria-disabled={true}
                      aria-describedby="unpublish-help"
                      onPress={() => {
                        // Block activation when disabled
                        return;
                      }}
                    >
                      {Global("buttons.unpublish")}
                    </Button>
                    <Tooltip
                      placement="bottom"
                      className={`${styles.tooltip} py-2 px-2`}
                    >
                      {t('messages.unPublishBtnTooltipMessage')}
                    </Tooltip>
                  </TooltipTrigger>
                  {/* Persistent description for screen readers */}
                  <span id="unpublish-help" className="hidden-accessibly">
                    {t('messages.unPublishBtnTooltipMessage')}
                  </span>
                </>
              ) : (
                <Button
                  onPress={handleUnpublish}
                  className="secondary"
                >
                  {Global("buttons.unpublish")}
                </Button>
              )}

              {/*Publish Button*/}
              {(isPublishUnavailable) ? (
                <>
                  <TooltipTrigger delay={0}>
                    <Button
                      className={`${styles.buttonSmallDisabled}`}
                      aria-disabled={true}
                      aria-describedby="publish-help"
                      onPress={() => {
                        // Block activation when disabled
                        return;
                      }}
                    >
                      {Global("buttons.publish")}
                    </Button>
                    <Tooltip
                      placement="bottom"
                      className={`${styles.tooltip} py-2 px-2`}
                    >
                      {t('messages.publishBtnTooltipMessage')}
                    </Tooltip>
                  </TooltipTrigger>
                  {/* Persistent description for screen readers */}
                  <span id="publish-help" className="hidden-accessibly">
                    {t('messages.publishBtnTooltipMessage')}
                  </span>
                </>
              ) : (
                <Button
                  onPress={handlePublish}
                >
                  {Global("buttons.publish")}
                </Button>
              )}
            </div>
            <div className="side-panel-content">
              <div className={`panelRow mb-5`}>
                <div>
                  <h3>{t('status.publicationStatus')}</h3>
                  <p>{guidanceGroup?.status ? getStatusLabel(guidanceGroup.status) : ''}</p>
                </div>
              </div>
            </div>

            <div className={`panelRow mb-5`}>
              <div>
                <h3>{t('status.lastPublished')}</h3>
                <p>{guidanceGroup?.lastPublishedDate || t('status.notYetPublished')}</p>
              </div>
            </div>
          </div>
        </SidebarPanel>
      </LayoutWithPanel >
    </>
  );
};

export default GuidanceGroupIndexPage;
