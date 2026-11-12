import styles from "./RelatedWorksList.module.scss";
import RelatedWorksListItem, { RelatedWorkAction } from "@/components/RelatedWorksListItem";
import Pagination from "@/components/Pagination";
import React, { useCallback, useId, useMemo, useState } from "react";
import { Button } from "react-aria-components";
import { TransitionLink } from "@/components/Form";
import RelatedWorksEmptyState from "@/components/RelatedWorksEmptyState";
import SkeletonListLoading from "@/components/SkeletonListLoading";
import { useToast } from "@/context/ToastContext";
import { useTranslations } from "next-intl";
import { useMutation, useQuery } from "@apollo/client/react";
import {
  RelatedWorksDocument,
  RelatedWorkSearchResult,
  RelatedWorksIdentifierType,
  RelatedWorkStatus,
  UpdateRelatedWorkStatusDocument,
} from "@/generated/graphql";
import { ProjectPlanSelect, RelatedWorksSelect } from "@/components/RelatedWorksSelect";
import { handleApolloError } from "@/utils/index";

const LIMIT = 10;

export enum SortByOptions {
  LikelihoodHigh = "LikelihoodHigh",
  DateFoundNew = "DateFoundNew",
  DateConfirmedNew = "DateConfirmedNew",
  DateDismissedNew = "DateDismissedNew",
}

export enum RelatedWorksSortBy {
  ScoreNorm = "scoreNorm",
  Modified = "modified",
  PublicationDate = "publicationDate",
  Created = "created",
}

export enum RelatedWorksSortDir {
  Ascending = "ASC",
  Descending = "DESC",
}

const SORT_MAP = new Map<string, [RelatedWorksSortBy, RelatedWorksSortDir]>([
  [SortByOptions.LikelihoodHigh, [RelatedWorksSortBy.ScoreNorm, RelatedWorksSortDir.Descending]],
  [SortByOptions.DateFoundNew, [RelatedWorksSortBy.Created, RelatedWorksSortDir.Descending]],
  [SortByOptions.DateConfirmedNew, [RelatedWorksSortBy.Modified, RelatedWorksSortDir.Descending]],
  [SortByOptions.DateDismissedNew, [RelatedWorksSortBy.Modified, RelatedWorksSortDir.Descending]],
]);

const SORT_OPTIONS_BY_STATUS: Record<RelatedWorkStatus, SortByOptions[]> = {
  [RelatedWorkStatus.Pending]: [SortByOptions.LikelihoodHigh, SortByOptions.DateFoundNew],
  [RelatedWorkStatus.Accepted]: [SortByOptions.DateConfirmedNew],
  [RelatedWorkStatus.Rejected]: [SortByOptions.DateDismissedNew, SortByOptions.LikelihoodHigh],
};

// UI actions are stored using the existing backend statuses
const ACTION_STATUS: Record<RelatedWorkAction, RelatedWorkStatus> = {
  confirm: RelatedWorkStatus.Accepted,
  dismiss: RelatedWorkStatus.Rejected,
  restore: RelatedWorkStatus.Pending,
  unmatch: RelatedWorkStatus.Rejected,
};

const EMPTY_STATE_ICONS: Record<RelatedWorkStatus, string> = {
  [RelatedWorkStatus.Accepted]: "check_circle",
  [RelatedWorkStatus.Pending]: "search",
  [RelatedWorkStatus.Rejected]: "cancel",
};

export interface RelatedWorksPlanScope {
  title?: string | null;
  allPlansHref: string;
}

interface RelatedWorksListProps {
  identifierType: RelatedWorksIdentifierType;
  identifier: number;
  status: RelatedWorkStatus;
  unpublishedPlanIds?: number[];
  /** Plan page only: shown where the project page has its plan filter */
  planScope?: RelatedWorksPlanScope;
  addHref?: string;
  onReviewMatches?: () => void;
  defaultPage?: number;
}

export const RelatedWorksList = ({
  identifierType,
  identifier,
  status,
  unpublishedPlanIds = [],
  planScope,
  addHref,
  onReviewMatches,
  defaultPage = 1,
}: RelatedWorksListProps) => {
  const t = useTranslations("RelatedWorksList");
  const toastState = useToast();
  const planScopeLabelId = useId();

  // UI State
  const [currentPage, setCurrentPage] = useState<number>(defaultPage);
  const [sortBy, setSortBy] = useState<string | null>(SORT_OPTIONS_BY_STATUS[status][0]);
  const [planId, setPlanId] = useState<number | null>(null);

  const [sortField, sortDir] = useMemo(() => SORT_MAP.get(sortBy ?? "") ?? [undefined, undefined], [sortBy]);

  // Query data
  const {
    data,
    previousData,
    loading: relatedWorksDataLoading,
    refetch: relatedWorksRefetch,
  } = useQuery(RelatedWorksDocument, {
    variables: {
      id: identifier,
      idType: identifierType,
      filterOptions: {
        planId,
        status,
      },
      paginationOptions: {
        offset: (currentPage - 1) * LIMIT,
        limit: LIMIT,
        type: "OFFSET",
        sortField,
        sortDir,
      },
    },
    fetchPolicy: "cache-and-network", // required so that results in different tabs update when status of a related work is updated
  });

  const [updateRelatedWorkStatusMutation] = useMutation(UpdateRelatedWorkStatusDocument, {
    // Counts shown on the project and plan overview pages change with every status update
    update(cache) {
      cache.evict({ fieldName: "relatedWorksByPlanStats" });
      cache.evict({ fieldName: "relatedWorksByProjectStats" });
      cache.gc();
    },
  });

  // Use previous data when loading new data, stops flickering results
  const relatedWorksData = data?.relatedWorks || previousData?.relatedWorks;
  const items = relatedWorksData?.items ?? [];

  // Remaining pagination variables
  const statusOnlyCount = relatedWorksData?.statusOnlyCount ?? 0;
  const totalCount = relatedWorksData?.totalCount ?? 0;
  const totalPages = Math.ceil(totalCount / LIMIT);
  const hasPreviousPage = relatedWorksData?.hasPreviousPage ?? null;
  const hasNextPage = relatedWorksData?.hasNextPage ?? null;
  const pageStart = (currentPage - 1) * LIMIT + 1;
  const pageEnd = pageStart + items.length - 1;

  const handleAction = useCallback(
    async (relatedWorkId: number, action: RelatedWorkAction) => {
      try {
        await updateRelatedWorkStatusMutation({
          variables: { input: { id: relatedWorkId, status: ACTION_STATUS[action] } },
        });

        if (items.length === 1 && currentPage > 1) {
          setCurrentPage(currentPage - 1);
        } else {
          await relatedWorksRefetch();
        }
        toastState.add(t(`messages.actions.${action}`), { type: "success" });
      } catch (err) {
        const { wasRealError } = handleApolloError(err, "RelatedWorksList.updateRelatedWorkStatus");
        if (wasRealError) {
          toastState.add(t("messages.errors.updateStatus"), { type: "error" });
        }
      }
    },
    [updateRelatedWorkStatusMutation, relatedWorksRefetch, items.length, currentPage, toastState, t],
  );

  const sortItems = SORT_OPTIONS_BY_STATUS[status].map((id) => ({ id, label: t(`filters.sortBy.${id}`) }));
  const unpublishedPlans = new Set(unpublishedPlanIds);

  const isInitialLoading = relatedWorksDataLoading && relatedWorksData == null;
  const isEmpty = !relatedWorksDataLoading && relatedWorksData != null && statusOnlyCount == 0 && totalCount == 0;
  const isFilteredEmpty = !relatedWorksDataLoading && statusOnlyCount > 0 && totalCount == 0;
  const showFilters = !isInitialLoading && !isEmpty;
  const showReviewMatches = onReviewMatches != null && status !== RelatedWorkStatus.Pending;
  const showAdd = addHref != null && status !== RelatedWorkStatus.Rejected;

  return (
    <div className={styles.container}>
      <p className={styles.lede}>{t(`intro.${status}`)}</p>

      <div className={styles.filters}>
        {identifierType === RelatedWorksIdentifierType.PlanId && planScope && !isInitialLoading && (
          <div
            className={`${styles.filter} ${styles.planScope}`}
            role="group"
            aria-labelledby={planScopeLabelId}
          >
            <span
              id={planScopeLabelId}
              className={styles.planScopeLabel}
            >
              {t("planScope.label")}
            </span>
            <p className={styles.planScopeValue}>
              {planScope.title && <span className={styles.planScopeTitle}>{planScope.title}</span>}
              <TransitionLink
                href={planScope.allPlansHref}
                className={styles.planScopeLink}
              >
                {t("planScope.viewAllPlans")}
              </TransitionLink>
            </p>
          </div>
        )}

        {showFilters && identifierType === RelatedWorksIdentifierType.ProjectId && (
          <ProjectPlanSelect
            label={t("filters.planId")}
            projectId={identifier}
            selectedKey={planId}
            setSelectedKey={(key) => {
              setPlanId(key);
              setCurrentPage(1);
            }}
            containerClassName={styles.filter}
          />
        )}

        {showFilters && (
          <RelatedWorksSelect<string>
            label={t("filters.sort")}
            placeholder={t("filters.sort")}
            selectedKey={sortBy}
            setSelectedKey={(key) => {
              setSortBy(key);
              setCurrentPage(1);
            }}
            items={sortItems}
            containerClassName={styles.filter}
          />
        )}
      </div>

      {isInitialLoading && <SkeletonListLoading count={3} />}

      <div aria-live="polite">
        {status === RelatedWorkStatus.Rejected && totalCount > 0 && items.length > 0 && (
          <p className={styles.summary}>{t("summary.REJECTED", { start: pageStart, end: pageEnd, total: totalCount })}</p>
        )}
        {isEmpty && (
          <RelatedWorksEmptyState
            icon={EMPTY_STATE_ICONS[status]}
            title={t(`emptyStates.${status}.title`)}
            description={t(`emptyStates.${status}.description`)}
            actions={
              (showReviewMatches || showAdd) && (
                <>
                  {showReviewMatches && (
                    <Button
                      className="secondary"
                      onPress={onReviewMatches}
                    >
                      {t("emptyStates.actions.reviewMatches")}
                    </Button>
                  )}
                  {showAdd && (
                    <TransitionLink
                      href={addHref}
                      className={`button-link ${status === RelatedWorkStatus.Accepted ? "button--primary" : "button--secondary"}`}
                    >
                      {t("emptyStates.actions.addResearchOutput")}
                    </TransitionLink>
                  )}
                </>
              )
            }
          />
        )}
        {isFilteredEmpty && (
          <RelatedWorksEmptyState
            icon="search"
            title={t(`messages.${status}.noFilteredResults`)}
            description={t("emptyStates.filtered.description")}
            actions={
              planId != null && (
                <Button
                  className="secondary"
                  onPress={() => {
                    setPlanId(null);
                    setCurrentPage(1);
                  }}
                >
                  {t("emptyStates.filtered.showAllPlans")}
                </Button>
              )
            }
          />
        )}
      </div>

      {items.length > 0 && (
        <div
          className={`${styles.list} ${relatedWorksDataLoading ? styles.listUpdating : ""}`.trim()}
          data-testid="related-works-list"
          role="list"
          aria-busy={relatedWorksDataLoading || undefined}
        >
          {items.map((relatedWork) => (
            <RelatedWorksListItem
              identifierType={identifierType}
              key={relatedWork?.id}
              relatedWork={relatedWork as RelatedWorkSearchResult}
              onAction={handleAction}
              isPlanPublished={relatedWork?.planId == null || !unpublishedPlans.has(relatedWork.planId)}
            />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className={styles.footer}>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            hasPreviousPage={hasPreviousPage}
            hasNextPage={hasNextPage}
            handlePageClick={setCurrentPage}
          />
        </div>
      )}
    </div>
  );
};
