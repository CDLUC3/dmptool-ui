'use client'

import React, { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Breadcrumb,
  Breadcrumbs,
  Button,
  Form,
  Link,
} from "react-aria-components";

// GraphQL
import { PaginationType } from "@/generated/graphql";

// Components
import {
  ContentContainer,
  LayoutContainer,
} from "@/components/Container";
import ErrorMessages from "@/components/ErrorMessages";
import ExternalLink from "@/components/ExternalLink";
import { FormInput, FormSelect } from "@/components/Form";
import { DmpIcon } from "@/components/Icons";
import Loading from "@/components/Loading";
import PageHeader from "@/components/PageHeader";
import Pagination from "@/components/Pagination";
import {
  DmpTable,
  DmpTableColumnSet,
} from "@/components/Table";

// Hooks, utils and other
import {
  FunderTemplate,
  FunderTemplateLink,
  TemplateDownloadFormat,
  templateDownloadHref,
  useFunderTemplates,
} from "@/app/hooks/useFunderTemplates";
import { useFormatDate } from "@/hooks/useFormatDate";
import {
  handleApolloError,
  routePath,
} from "@/utils/index";
import styles from "./funderRequirements.module.scss";

const LIMIT = 10;

const SORT_FIELD_MAP: Record<string, string> = {
  name: "vt.name",
  organization: "a.displayName",
  modified: "vt.modified",
};

const SORT_OPTIONS = [
  { field: "name", dir: "ASC", labelKey: "nameAsc" },
  { field: "name", dir: "DESC", labelKey: "nameDesc" },
  { field: "organization", dir: "ASC", labelKey: "organizationAsc" },
  { field: "organization", dir: "DESC", labelKey: "organizationDesc" },
  { field: "modified", dir: "DESC", labelKey: "modifiedDesc" },
  { field: "modified", dir: "ASC", labelKey: "modifiedAsc" },
] as const;

const DOWNLOAD_FORMATS: { format: TemplateDownloadFormat; icon: string }[] = [
  { format: "docx", icon: "word" },
  { format: "pdf", icon: "pdf" },
];

const EmptyValue = () => {
  const t = useTranslations("FunderRequirements");
  return (
    <>
      <span aria-hidden="true" className={styles.muted}>—</span>
      <span className="hidden-accessibly">{t("none")}</span>
    </>
  );
};

const TemplateDownloads = ({ template }: { template: FunderTemplate }) => {
  const t = useTranslations("FunderRequirements");
  return (
    <div className={styles.downloads}>
      {DOWNLOAD_FORMATS.map(({ format, icon }) => (
        <Link
          key={format}
          href={templateDownloadHref(template.id, format)}
          className={styles.downloadLink}
          aria-label={t("downloadAs", { name: template.name, format: t(`formats.${format}`) })}
        >
          <DmpIcon icon={icon} fill="currentColor" width={18} height={18} />
        </Link>
      ))}
    </div>
  );
};

const linkLabel = (link: FunderTemplateLink) => {
  if (link.text) return link.text;
  try {
    return new URL(link.url).hostname.replace(/^www\./, "");
  } catch {
    return link.url;
  }
};

const TemplateLinkList = ({ links }: { links: FunderTemplateLink[] }) => {
  if (links.length === 0) return <EmptyValue />;
  return (
    <ul className={styles.linkList}>
      {links.map((link) => (
        <li key={link.id ?? link.url}>
          <ExternalLink href={link.url} title={link.text ? undefined : link.url}>
            {linkLabel(link)}
          </ExternalLink>
        </li>
      ))}
    </ul>
  );
};

interface TemplateSearchProps {
  isDisabled: boolean;
  inputRef: React.Ref<HTMLInputElement>;
  onSearch: (term: string) => void;
}

const TemplateSearch = ({ isDisabled, inputRef, onSearch }: TemplateSearchProps) => {
  const t = useTranslations("FunderRequirements");
  const Global = useTranslations("Global");
  const [searchInput, setSearchInput] = useState("");

  const handleChange = (value: string) => {
    setSearchInput(value);
    if (value.trim() === "") onSearch("");
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSearch(searchInput.trim());
  };

  return (
    <Form role="search" className={styles.searchForm} onSubmit={handleSubmit}>
      <FormInput
        ref={inputRef}
        name="search"
        type="search"
        label={t("search.label")}
        placeholder={t("search.placeholder")}
        value={searchInput}
        onChange={(e) => handleChange(e.target.value)}
        className={styles.searchInput}
      />
      <Button type="submit" isDisabled={isDisabled}>
        {Global("buttons.search")}
      </Button>
    </Form>
  );
};

const FunderRequirementsPage: React.FC = () => {
  const t = useTranslations("FunderRequirements");
  const Global = useTranslations("Global");
  const formatDate = useFormatDate();
  const errorRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const [errors, setErrors] = useState<string[]>([]);
  const [searchKey, setSearchKey] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState("name");
  const [sortDir, setSortDir] = useState<"ASC" | "DESC">("ASC");
  const [tableKey, setTableKey] = useState(0);
  const [columns, setColumns] = useState<DmpTableColumnSet>(() => [
    { id: "name", name: t("table.columns.templateName"), isRowHeader: true, allowsSorting: true, direction: "ascending" },
    { id: "download", name: t("table.columns.download") },
    { id: "organization", name: t("table.columns.organizationName"), allowsSorting: true, direction: "" },
    { id: "modified", name: t("table.columns.lastUpdated"), allowsSorting: true, direction: "", noWrap: true },
    { id: "funderLinks", name: t("table.columns.funderLinks") },
    { id: "samplePlans", name: t("table.columns.samplePlans") },
  ]);

  const { data, previousData, loading, error } = useFunderTemplates({
    variables: {
      term: searchTerm,
      paginationOptions: {
        type: PaginationType.Offset,
        offset: (currentPage - 1) * LIMIT,
        limit: LIMIT,
        sortField: SORT_FIELD_MAP[sortField],
        sortDir,
      },
    },
  });

  useEffect(() => {
    if (!error) return;
    const { wasRealError } = handleApolloError(error, "FunderRequirementsPage.useFunderTemplates");
    if (wasRealError) setErrors([t("messages.errors.loadFailed")]);
  }, [error, t]);

  // Keep the last results on screen while a search, sort or page change loads, so the table keeps keyboard focus.
  const results = (data ?? previousData)?.publishedFunderTemplates;
  const isInitialLoad = loading && !results;
  const isRefreshing = loading && !!results;
  const hasNoTemplates = !!results && !loading && results.totalCount === 0 && searchTerm === "";
  const templates = results?.items ?? [];
  const totalCount = results?.totalCount ?? 0;
  const firstShown = templates.length > 0 ? (results?.currentOffset ?? 0) + 1 : 0;
  const lastShown = templates.length > 0 ? firstShown + templates.length - 1 : 0;

  const rows = templates.map((template) => ({
    id: template.id,
    name: <span className={styles.templateName}>{template.name}</span>,
    download: <TemplateDownloads template={template} />,
    organization: template.ownerDisplayName,
    modified: formatDate(template.modified),
    funderLinks: <TemplateLinkList links={template.funderLinks} />,
    samplePlans: <TemplateLinkList links={template.samplePlanLinks} />,
  }));

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setCurrentPage(1);
  };

  const handleClearSearch = () => {
    handleSearch("");
    setSearchKey((key) => key + 1);
  };

  useEffect(() => {
    if (searchKey > 0) searchInputRef.current?.focus();
  }, [searchKey]);

  const handleSortChange = (newColumns: DmpTableColumnSet) => {
    setColumns(newColumns);
    const activeSort = Array.from(newColumns).find((col) => col.allowsSorting && col.direction);
    if (activeSort) {
      setSortField(activeSort.id);
      setSortDir(activeSort.direction === "descending" ? "DESC" : "ASC");
      setCurrentPage(1);
    }
  };

  const handleMobileSortChange = (value: string) => {
    const option = SORT_OPTIONS.find((opt) => `${opt.field}-${opt.dir}` === value);
    if (!option) return;
    setColumns((prev) => Array.from(prev).map((col) => (
      col.allowsSorting
        ? { ...col, direction: col.id === option.field ? (option.dir === "DESC" ? "descending" : "ascending") : "" }
        : col
    )));
    setSortField(option.field);
    setSortDir(option.dir);
    setCurrentPage(1);
    // DmpTable only reads columnData on mount, so remount it to show the new sort in its headers.
    setTableKey((key) => key + 1);
  };

  return (
    <>
      <PageHeader
        title={t("title")}
        description={t("description")}
        showBackButton={false}
        breadcrumbs={
          <Breadcrumbs>
            <Breadcrumb><Link href={routePath("app.home")}>{Global("breadcrumbs.home")}</Link></Breadcrumb>
            <Breadcrumb>{t("title")}</Breadcrumb>
          </Breadcrumbs>
        }
        className={styles.header}
      />
      <ErrorMessages errors={errors} ref={errorRef} />

      <LayoutContainer>
        <ContentContainer>
          {hasNoTemplates ? (
            <p className={styles.emptyState}>{t("noTemplates")}</p>
          ) : (
            <TemplateSearch
              key={searchKey}
              isDisabled={isInitialLoad}
              inputRef={searchInputRef}
              onSearch={handleSearch}
            />
          )}

          {results && !hasNoTemplates && (
            <p className={styles.resultsCount} aria-live="polite">
              {isRefreshing
                ? Global("messaging.loading")
                : t("resultsCount", { start: firstShown, end: lastShown, total: totalCount })}
            </p>
          )}

          {isInitialLoad && <Loading message={Global("messaging.loading")} />}

          {results && !hasNoTemplates && (
            <div
              className={isRefreshing ? styles.refreshing : undefined}
              aria-busy={isRefreshing}
            >
              {templates.length === 0 ? (
                <div className={styles.emptyState}>
                  <p>{t("noResults")}</p>
                  <p>{t("noResultsHint")}</p>
                  <Button className="secondary" onPress={handleClearSearch}>
                    {t("clearSearch")}
                  </Button>
                </div>
              ) : (
                <>
                  <div className={styles.tableWrapper}>
                    <DmpTable
                      key={tableKey}
                      label={t("table.label")}
                      className={styles.table}
                      columnData={columns}
                      rowData={rows}
                      onDmpSortChange={handleSortChange}
                    />
                  </div>

                  <div className={styles.mobileSort}>
                    <FormSelect
                      label={t("sort.label")}
                      name="sort"
                      items={SORT_OPTIONS.map((opt) => ({
                        id: `${opt.field}-${opt.dir}`,
                        name: t(`sort.options.${opt.labelKey}`),
                      }))}
                      selectedKey={`${sortField}-${sortDir}`}
                      onChange={handleMobileSortChange}
                    />
                  </div>

                  <ul className={styles.cardList} aria-label={t("table.label")}>
                    {templates.map((template) => (
                      <li key={template.id} className={styles.card}>
                        <h2 className={styles.cardTitle}>{template.name}</h2>
                        <dl className={styles.cardMeta}>
                          <div>
                            <dt>{t("table.columns.organizationName")}</dt>
                            <dd>{template.ownerDisplayName}</dd>
                          </div>
                          <div>
                            <dt>{t("table.columns.lastUpdated")}</dt>
                            <dd>{formatDate(template.modified)}</dd>
                          </div>
                        </dl>
                        <div className={styles.cardSection}>
                          <h3>{t("table.columns.funderLinks")}</h3>
                          <TemplateLinkList links={template.funderLinks} />
                        </div>
                        {template.samplePlanLinks.length > 0 && (
                          <div className={styles.cardSection}>
                            <h3>{t("table.columns.samplePlans")}</h3>
                            <TemplateLinkList links={template.samplePlanLinks} />
                          </div>
                        )}
                        <div className={styles.cardSection}>
                          <h3>{t("table.columns.download")}</h3>
                          <TemplateDownloads template={template} />
                        </div>
                      </li>
                    ))}
                  </ul>

                  <div className={styles.paginationWrapper}>
                    <Pagination
                      currentPage={currentPage}
                      totalPages={Math.ceil(totalCount / LIMIT)}
                      hasPreviousPage={results.hasPreviousPage ?? false}
                      hasNextPage={results.hasNextPage ?? false}
                      handlePageClick={setCurrentPage}
                    />
                  </div>
                </>
              )}
            </div>
          )}
        </ContentContainer>
      </LayoutContainer>
    </>
  );
};

export default FunderRequirementsPage;
