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
import { useParams } from "next/navigation";
import { useRouter } from "@/i18n/routing";

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

const AUTOSAVE_DELAY_MS = 3000;
const MINUTE_MS = 60 * 1000;

interface GuidanceSaveStatus {
  isDirty: boolean;
  isSaving: boolean;
  lastSavedAt: Date | null;
}

const EMPTY_SAVE_STATUS: GuidanceSaveStatus = { isDirty: false, isSaving: false, lastSavedAt: null };

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
  // State for error messages
  const [errorMessages, setErrorMessages] = useState<string[]>([]);
  // Per-tag autosave status (unsaved, saving, last saved)
  const [saveStatusByTag, setSaveStatusByTag] = useState<Record<number, GuidanceSaveStatus>>({});
  // Used to refresh the "Last saved X minutes ago" text
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  // Refs so autosave timers and window listeners always see the latest data
  const tagGuidanceListRef = useRef<TagGuidanceItem[]>([]);
  const savedTextByTagRef = useRef<Record<number, string>>({});
  const autoSaveTimeoutsRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());
  const inFlightSavesRef = useRef<Map<number, Promise<void>>>(new Map());
  const saveGuidanceRef = useRef<(tagId: number, isAutoSave?: boolean) => Promise<void>>(async () => { });
  const hasUnsavedChangesRef = useRef<boolean>(false);
  const historyGuardAddedRef = useRef<boolean>(false);
  const skipUnloadWarningRef = useRef<boolean>(false);

  const hasUnsavedChanges = Object.values(saveStatusByTag).some(s => s.isDirty || s.isSaving);

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

  const updateSaveStatus = useCallback((tagId: number, changes: Partial<GuidanceSaveStatus>) => {
    setSaveStatusByTag(prev => ({
      ...prev,
      [tagId]: { ...EMPTY_SAVE_STATUS, ...prev[tagId], ...changes },
    }));
  }, []);

  const getCurrentText = (tagId: number) =>
    tagGuidanceListRef.current.find(item => item.tag.id === tagId)?.guidance?.guidanceText ?? "";

  const getSavedText = (tagId: number) => savedTextByTagRef.current[tagId] ?? "";

  const clearAutoSaveTimeout = (tagId: number) => {
    const timeout = autoSaveTimeoutsRef.current.get(tagId);
    if (timeout) {
      clearTimeout(timeout);
      autoSaveTimeoutsRef.current.delete(tagId);
    }
  };

  const scheduleAutoSave = (tagId: number) => {
    clearAutoSaveTimeout(tagId);
    autoSaveTimeoutsRef.current.set(tagId, setTimeout(() => {
      autoSaveTimeoutsRef.current.delete(tagId);
      void saveGuidanceRef.current(tagId, true);
    }, AUTOSAVE_DELAY_MS));
  };

  // Save anything waiting on the autosave timer, then wait for all saves to finish
  const flushPendingSaves = useCallback(async () => {
    const pendingTagIds = Array.from(autoSaveTimeoutsRef.current.keys());
    await Promise.all(pendingTagIds.map(tagId => saveGuidanceRef.current(tagId, true)));
    await Promise.all(Array.from(inFlightSavesRef.current.values()));
  }, []);

  const hasUnsavedGuidanceText = useCallback(() =>
    tagGuidanceListRef.current.some(item =>
      (item.guidance?.guidanceText ?? "") !== (savedTextByTagRef.current[item.tag.id as number] ?? "")
    ), []);

  // Handler to update guidance text in state
  const handleGuidanceTextChange = (tagId: number, newText: string) => {
    // TinyMCE also reports content on blur, so ignore events that don't change anything
    if (newText === getCurrentText(tagId)) {
      return;
    }

    const isDirty = newText !== getSavedText(tagId);
    updateSaveStatus(tagId, { isDirty });
    if (isDirty) {
      scheduleAutoSave(tagId);
    } else {
      clearAutoSaveTimeout(tagId);
    }

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

    await flushPendingSaves();

    if (hasUnsavedGuidanceText()) {
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
  }, [guidanceGroup, Global, router, flushPendingSaves, hasUnsavedGuidanceText, t, toastState]);


  const handlePublish = useCallback(async () => {
    setErrorMessages([]);

    await flushPendingSaves();

    if (hasUnsavedGuidanceText()) {
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
  }, [guidanceGroup, Global, router, flushPendingSaves, hasUnsavedGuidanceText, t, toastState]);

  // Update guidance or add a new one for the tag. Returns true when the save succeeded.
  const persistGuidance = async (tagItem: TagGuidanceItem, textToSave: string, isAutoSave: boolean): Promise<boolean> => {
    const tagId = tagItem.tag.id as number;

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
        return false;
      }

      if (!response.success) {
        setErrorMessages(
          response.errors?.length ? response.errors : [Global("messaging.somethingWentWrong")]
        )
        logECS("error", "updating Guidance text", {
          errors: response.errors,
          url: { path: routePath("admin.guidance.groups.index", { groupId }) },
        });
        return false;
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
            return false; // Don't show success if there are errors
          }
        }

        // Success case - no errors
        if (!isAutoSave) {
          const successMessage = t("messages.success.guidanceTextUpdated", { tagName: tagItem.tag.name });
          toastState.add(successMessage, { type: "success" });
        }

        // Optimistically update guidance group status if it was previously published
        setGuidanceGroup(prev => prev && prev.status === GuidanceGroupStatus.PUBLISHED
          ? { ...prev, status: GuidanceGroupStatus.UNPUBLISHED_CHANGES }
          : prev);
        return true;
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
        return false;
      }

      if (!response.success) {
        setErrorMessages(
          response.errors?.length ? response.errors : [Global("messaging.somethingWentWrong")]
        )
        logECS("error", "adding Guidance text", {
          errors: response.errors,
          url: { path: routePath("admin.guidance.groups.index", { groupId }) },
        });
        return false;
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
            return false; // Don't show success if there are errors
          }
        }
        // Success case - no errors
        // Optimistically update the local state to reflect the new guidance
        const newGuidanceIdValue = (response as AddGuidanceResponse)?.data?.id;
        if (newGuidanceIdValue != null) {
          const newGuidanceId = String(newGuidanceIdValue);
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

          // Link the new guidance to this tag, keeping anything typed while the save was in progress.
          // The ref is updated immediately so a queued save updates this guidance instead of adding a duplicate.
          const linkNewGuidance = (list: TagGuidanceItem[]) =>
            list.map(item =>
              item.tag.id === tagId
                ? { ...item, guidance: { ...newGuidance, guidanceText: item.guidance?.guidanceText ?? textToSave } }
                : item
            );
          tagGuidanceListRef.current = linkNewGuidance(tagGuidanceListRef.current);
          setTagGuidanceList(linkNewGuidance);
        }

        // Optimistically update guidance group status if it was previously published
        setGuidanceGroup(prev => prev && prev.status === GuidanceGroupStatus.PUBLISHED
          ? { ...prev, status: GuidanceGroupStatus.UNPUBLISHED_CHANGES }
          : prev);

        if (!isAutoSave) {
          const successMessage = t("messages.success.guidanceTextAdded", { tagName: tagItem.tag.name });
          toastState.add(successMessage, { type: "success" });
        }
        return true;
      }
    }
  };

  // Save the guidance for a tag, either from the Save button or from autosave
  const saveGuidance = async (tagId: number, isAutoSave = false): Promise<void> => {
    clearAutoSaveTimeout(tagId);

    // Only one save per tag at a time, otherwise a new guidance could be created twice
    const inFlightSave = inFlightSavesRef.current.get(tagId);
    if (inFlightSave) {
      return inFlightSave.then(() => saveGuidanceRef.current(tagId, isAutoSave));
    }

    const tagItem = tagGuidanceListRef.current.find(item => item.tag.id === tagId);
    if (!tagItem) {
      return;
    }

    const textToSave = tagItem.guidance?.guidanceText ?? "";

    if (isAutoSave && textToSave === getSavedText(tagId)) {
      updateSaveStatus(tagId, { isDirty: false });
      return;
    }

    setErrorMessages([]);
    updateSaveStatus(tagId, { isSaving: true });

    const savePromise = (async () => {
      const success = await persistGuidance(tagItem, textToSave, isAutoSave);

      if (success) {
        savedTextByTagRef.current[tagId] = textToSave;
        updateSaveStatus(tagId, {
          isSaving: false,
          isDirty: getCurrentText(tagId) !== textToSave,
          lastSavedAt: new Date(),
        });
      } else {
        updateSaveStatus(tagId, { isSaving: false, isDirty: true });
      }
    })().finally(() => {
      inFlightSavesRef.current.delete(tagId);
    });

    inFlightSavesRef.current.set(tagId, savePromise);
    return savePromise;
  };
  saveGuidanceRef.current = saveGuidance;

  // Screen reader announcement only changes with the save state, so the minute count isn't read out every minute
  const getSaveAnnouncement = (tagId: number) => {
    const status = saveStatusByTag[tagId];
    if (status?.isSaving) return Global('buttons.saving');
    if (status?.isDirty) return t('messages.unsavedChanges');
    if (status?.lastSavedAt) return t('messages.savedJustNow');
    return '';
  };

  // Helper function to format the last saved messaging, matching the plan question page
  const getLastSavedText = (tagId: number) => {
    const status = saveStatusByTag[tagId];
    if (!status) {
      return '';
    }

    if (status.isSaving) {
      return Global('buttons.saving');
    }

    if (status.isDirty) {
      return t('messages.unsavedChanges');
    }

    if (!status.lastSavedAt) {
      return '';
    }

    const diffInMinutes = Math.floor(Math.max(currentTime.getTime() - status.lastSavedAt.getTime(), 0) / MINUTE_MS);

    if (diffInMinutes === 0) {
      return t('messages.savedJustNow');
    } else if (diffInMinutes === 1) {
      return t('messages.lastSavedOneMinuteAgo');
    } else {
      return t('messages.lastSavedMinutesAgo', { minutes: diffInMinutes });
    }
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

      transformedGuidanceTexts.forEach(g => {
        savedTextByTagRef.current[g.tagId] = g.guidanceText;
      });

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

  useEffect(() => {
    tagGuidanceListRef.current = tagGuidanceList;
  }, [tagGuidanceList]);

  useEffect(() => {
    hasUnsavedChangesRef.current = hasUnsavedChanges;
  }, [hasUnsavedChanges]);

  // Push a single history entry the first time there are unsaved changes, so back navigation can be intercepted.
  // Pushing on every edit would stack up entries now that changes are saved (and become clean) automatically.
  useEffect(() => {
    if (!hasUnsavedChanges || historyGuardAddedRef.current) return;
    historyGuardAddedRef.current = true;
    window.history.pushState(null, '', window.location.href);
  }, [hasUnsavedChanges]);

  // Intercept browser back/forward navigation to warn user of unsaved changes
  useEffect(() => {
    const handlePopState = () => {
      if (!historyGuardAddedRef.current) return;

      if (hasUnsavedChangesRef.current) {
        const confirmLeave = window.confirm(Global("messaging.unsavedChangesWarning"));
        if (!confirmLeave) {
          // Push current state back to prevent navigation
          window.history.pushState(null, '', window.location.href);
          return;
        }
        skipUnloadWarningRef.current = true;
      }

      // Step past the extra history entry
      historyGuardAddedRef.current = false;
      window.removeEventListener('popstate', handlePopState);
      window.history.back();
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [Global]);

  // Autosave on window blur, and warn user of unsaved changes if they refresh/close the tab
  useEffect(() => {
    const handleWindowBlur = () => {
      void flushPendingSaves();
    };

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChangesRef.current && !skipUnloadWarningRef.current) {
        e.preventDefault();
        e.returnValue = ''; // Required for Chrome/Firefox to show the confirm dialog
      }
    };

    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [flushPendingSaves]);

  // Clear any pending autosaves when leaving the page
  useEffect(() => {
    const autoSaveTimeouts = autoSaveTimeoutsRef.current;
    return () => {
      autoSaveTimeouts.forEach(timeout => clearTimeout(timeout));
      autoSaveTimeouts.clear();
    };
  }, []);

  // Re-render on the next whole minute after any save, so "Last saved X minutes ago" ticks over on time
  useEffect(() => {
    const now = Date.now();
    const nextTickTimes = Object.values(saveStatusByTag)
      .filter(s => s.lastSavedAt)
      .map(s => {
        const savedAt = (s.lastSavedAt as Date).getTime();
        return savedAt + (Math.floor(Math.max(now - savedAt, 0) / MINUTE_MS) + 1) * MINUTE_MS;
      });

    if (nextTickTimes.length === 0) return;

    const timeout = setTimeout(() => {
      setCurrentTime(new Date());
    }, Math.max(Math.min(...nextTickTimes) - now, 0));

    return () => clearTimeout(timeout);
  }, [saveStatusByTag, currentTime]);


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
                  const isSaving = saveStatusByTag[tagId]?.isSaving ?? false;
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
                          setContent={(value) => handleGuidanceTextChange(tagId, value)}
                          id={`content-${tagId}`}
                          labelId={`contentLabel-${tagId}`}
                        />
                      </div>

                      <div className={styles.buttonWrapper}>
                        <div className={styles.lastSaved} data-testid={`last-saved-${tagId}`}>
                          {getLastSavedText(tagId)}
                        </div>
                        <span className="hidden-accessibly" role="status" aria-live="polite">
                          {getSaveAnnouncement(tagId)}
                        </span>
                        <Button
                          onPress={() => {
                            if (!isSaving) void saveGuidance(tagId);
                          }}
                          aria-disabled={isSaving}
                          className="button--primary"
                        >
                          {isSaving
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
