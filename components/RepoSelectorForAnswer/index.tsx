'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from "next-intl";
import { useParams, useRouter } from "next/navigation";
import {
  Button,
  Checkbox,
  Dialog,
  DialogTrigger,
  OverlayArrow,
  Popover,
  Heading,
  Input,
  Label,
  Link,
  ListBoxItem,
  Modal,
  SearchField,
} from "react-aria-components";
import {
  FormInput,
  FormSelect,
} from '@/components/Form';
import ExpandButton from "@/components/ExpandButton";
import Pagination from '@/components/Pagination';
import { handleApolloError } from '@/utils/apolloErrorHandler';

// GraphQL queries and mutations
import { useQuery, useLazyQuery } from '@apollo/client/react';
import {
  Repository,
  Re3RepositoryTypesListDocument,
  RepositoriesDocument,
  Re3SubjectListDocument,
  Re3byUrIsDocument,
} from '@/generated/graphql';

import {
  addRepositoryAction
} from "@/app/actions/addRepositoryAction";

// Components
import ErrorMessages from '../ErrorMessages';
import { DmpIcon } from "@/components/Icons";

// Utilities/Other
import { routePath } from "@/utils/routes";
import { extractErrors } from "@/utils/errorHandler";
import { useToast } from "@/context/ToastContext";
import logECS from "@/utils/clientLogger";
import {
  RepositoryInterface,
} from '@/app/types';
import styles from './repoSelectorForAnswer.module.scss';

// TODO: There is some overlap with components/QuestionAdd/RepoSelector.tsx - consider refactoring shared logic
// # of repositories displayed per page
const LIMIT = 5;

type AddRepositoryErrors = {
  general?: string;
  name?: string;
  description?: string;
  repositoryTypes?: string;
  website?: string;
}

// Convert subject area string to object with id and name
function toSubjectAreaObject(str: string): { id: string; name: string } {
  // Convert to ID-friendly slug
  const id = str
    .toLowerCase()
    .replace(/[()]/g, '')          // remove parentheses
    .replace(/[^a-z0-9\s-]/g, '')  // remove special chars except spaces/hyphens
    .trim()
    .replace(/\s+/g, '-');         // replace spaces with hyphens

  // Convert to nice display form
  const name = str
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/\w\S*/g, w => w[0].toUpperCase() + w.substring(1));

  return { id, name };
}

// Deduplicate repositories by URI to avoid duplicates in search results
const dedupeByUri = (repos: Repository[]): Repository[] => {
  const seenUris = new Set<string>();
  return repos.filter(repo => {
    const uri = repo.uri ?? '';
    if (seenUris.has(uri)) return false;
    seenUris.add(uri);
    return true;
  });
};

/* Research Output question's Repository Selection System */
const RepoSelectorForAnswer = ({
  value,
  preferredReposURIs,
  onRepositoriesChange
}: {
  value?: RepositoryInterface[];
  preferredReposURIs?: string[];
  onRepositoriesChange?: (repos: RepositoryInterface[]) => void;
}) => {

  const params = useParams();
  const router = useRouter();
  // Toast context for notifications
  const toastState = useToast();
  // Get templateId from the URL
  const templateId = String(params.templateId);

  //For scrolling to error in page
  const errorRef = useRef<HTMLDivElement | null>(null);

  // Translation keys
  const Global = useTranslations("Global");
  const QuestionAdd = useTranslations("QuestionAdd");

  // Cache of complete repository data (from search results or custom additions)
  // This ensures we don't lose details when toggling selections
  const [completeRepoData, setCompleteRepoData] = useState<{ [uri: string]: RepositoryInterface }>({});
  // State to show preferred repositories only. Set to true only if preferredReposURIs are provided.
  const [showPreferredOnly, setShowPreferredOnly] = useState(!!preferredReposURIs && preferredReposURIs.length > 0);

  // Instead of useState for selectedRepos, use value prop:
  // Enrich with complete data from cache when available
  const selectedRepos = useMemo(() => {
    const result: { [id: string]: RepositoryInterface } = {};
    return (value || []).reduce((acc, repo) => {
      if (repo.uri !== '') {
        // Use complete data from cache if available, otherwise use the stored value
        acc[repo.uri] = completeRepoData[repo.uri] || repo;
      }
      return acc;
    }, result);
  }, [value, completeRepoData]);


  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCustomFormOpen, setIsCustomFormOpen] = useState(false);
  const [expandedDetails, setExpandedDetails] = useState<Record<string, boolean>>({});
  const [subjectArea, setSubjectArea] = useState<string | null>(null);
  const [repoType, setRepoType] = useState<string | null>(null);
  const [customForm, setCustomForm] = useState({ name: '', website: '', description: '' });
  const [errors, setErrors] = useState<string[]>([]);
  // Search related states
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [hasNextPage, setHasNextPage] = useState<boolean | null>(false);
  const [hasPreviousPage, setHasPreviousPage] = useState<boolean | null>(false);
  // Filtered repositories state - can be either local mock data or GraphQL data
  const [repositories, setRepositories] = useState<Repository[]>([]);
  // Track whether a search has been performed (to avoid showing 'no matches' before searching)
  const [hasSearched, setHasSearched] = useState(false);

  // Repository types for dropdown
  const { data: repositoryTypesData } = useQuery(Re3RepositoryTypesListDocument);

  // Transform repository types data for FormSelect - add empty option for deselection
  const repositoryTypes = [
    { id: 'none', name: '-- None --' },
    ...(repositoryTypesData?.re3RepositoryTypesList?.types?.map(typeObj => ({
      id: typeObj.type,
      name: typeObj.type
    })) || [])
  ];

  // Get Repository Subject Areas
  const { data: subjectAreasData } = useQuery(Re3SubjectListDocument);

  // Transform subject areas data for FormSelect - add empty option for deselection
  const subjectAreas = [
    { id: 'none', name: '-- None --' },
    ...(subjectAreasData?.re3SubjectList?.subjects?.map(s => toSubjectAreaObject(s.subject)) || [])
  ];

  // Get repositories by the preferred URIs to display initially on first load
  const { data: preferredRepositoriesData } = useQuery(Re3byUrIsDocument, {
    variables: {
      uris: preferredReposURIs || []
    },
    skip: !preferredReposURIs || preferredReposURIs.length === 0
  });

  // Repositories lazy query
  const [fetchRepositoriesData, { data: repositoriesData }] = useLazyQuery(RepositoriesDocument, {
    fetchPolicy: 'network-only', // Always fetch fresh data when searching/filtering, don't rely on cache
  });


  // Fetch repositories based on search term criteria
  const fetchRepositories = async ({
    page,
    searchTerm = ''
  }: {
    page?: number;
    searchTerm?: string;
  }): Promise<void> => {
    let offsetLimit = 0;
    if (page) {
      setCurrentPage(page);
      offsetLimit = (page - 1) * LIMIT;
    }

    try {
      await fetchRepositoriesData({
        variables: {
          input: {
            paginationOptions: {
              offset: offsetLimit,
              limit: LIMIT,
              type: "OFFSET",
              sortDir: "DESC",
            },
            term: searchTerm,
            repositoryType: repoType as string || null,
            subjects: subjectArea ? [subjectArea] : null,
          }
        }
      });
    } catch (err) {
      handleApolloError(err, 'repoSelectorForAnswer.fetchRepositories');
    }
  };

  // Handle pagination page click
  const handlePageClick = async (page: number) => {
    await fetchRepositories({
      page,
      searchTerm
    });
  };

  // Update search term state on input change
  const handleSearchInput = (term: string) => {
    setSearchTerm(term);
    setHasSearched(false);
  };

  // Handle search for repositories
  const handleSearch = async (term: string) => {
    setErrors([]); // Clear previous errors
    setSearchTerm(term);

    // Reset to first page on new search
    setCurrentPage(1);

    // If showing preferred only, filter the preferred repos locally
    if (showPreferredOnly && preferredRepositoriesData?.re3byURIs) {
      const filtered = preferredRepositoriesData.re3byURIs.filter(repo => {
        if (!repo) return false;

        const matchesSearch = !term ||
          repo.name?.toLowerCase().includes(term.toLowerCase()) ||
          repo.description?.toLowerCase().includes(term.toLowerCase()) ||
          (repo.keywords?.some(k => k.toLowerCase().includes(term.toLowerCase())) ?? false);

        const matchesSubject = !subjectArea ||
          (repo.keywords?.some(k => k.toLowerCase().includes(subjectArea.toLowerCase())) ?? false);

        const matchesType = !repoType ||
          (repo.repositoryTypes?.includes(repoType as string) ?? false);

        return matchesSearch && matchesSubject && matchesType;
      }) as Repository[];

      setRepositories(dedupeByUri(filtered));
      setTotalCount(filtered.length);
      setTotalPages(1);
      setHasNextPage(false);
      setHasPreviousPage(false);
      setHasSearched(true);
    } else {
      // Fetch all repositories with filters from API
      await fetchRepositories({ page: 1, searchTerm: term });
    }
  }

  // Set selected subject area
  const searchOnSubjectArea = (subject: string) => {
    setSubjectArea(subject === 'none' ? null : subject);
    setHasSearched(false);
  };

  // Set selected repository type
  const searchOnRepositoryType = (type: string) => {
    setRepoType(type === 'none' ? null : type);
    setHasSearched(false);
  };

  // Handle add/removal of repository selections in modal view and display confirmation toasts
  const toggleSelection = (repo: RepositoryInterface) => {

    // Cache the complete repository data
    setCompleteRepoData(prev => ({
      ...prev,
      [repo.uri]: repo
    }));

    const isSelected = !!selectedRepos[repo.uri];
    let newSelected: RepositoryInterface[];
    if (isSelected) {
      newSelected = Object.values(selectedRepos).filter(r => r.uri !== repo.uri);
    } else {
      newSelected = [...Object.values(selectedRepos), repo];
    }
    onRepositoriesChange?.(newSelected);
    toastState.add(QuestionAdd('researchOutput.repoSelector.messages.' + (isSelected ? 'removedItem' : 'addedItem'), { name: repo.name }), { type: 'success' });
  };

  // Remove a single repository from selection
  const removeRepo = (repoId: string) => {
    const repo = selectedRepos[repoId];
    const newSelected = Object.values(selectedRepos).filter(r => r.uri !== repoId);
    onRepositoriesChange?.(newSelected);
    toastState.add(QuestionAdd('researchOutput.repoSelector.messages.removedItem', { name: repo.name }), { type: 'success' });
  };

  // Remove all selected repositories
  const removeAllRepos = () => {
    onRepositoriesChange?.([]);
    toastState.add(QuestionAdd('researchOutput.repoSelector.messages.allRemoved'), { type: 'success' });
  };

  // Toggle display of additional repository details in modal view
  const toggleDetails = (repoId: string | number, prefix: string = '') => {
    setExpandedDetails(prev => ({
      ...prev,
      [`${prefix}${repoId}`]: !prev[`${prefix}${repoId}`]
    }));
  };

  // Handle adding a custom repository
  const handleAddCustomRepo = useCallback(async () => {
    setErrors([]);
    const { name, description, website } = customForm;

    if (!name.trim() || !website.trim() || !description.trim()) {
      toastState.add(QuestionAdd('researchOutput.repoSelector.errors.customRepoError'), { type: 'error' });
      return;
    };

    const response = await addRepositoryAction({
      name: name.trim(),
      description: description.trim(),
      website: website.trim()
    });

    if (response.redirect) {
      router.push(response.redirect);
      return;
    }

    if (!response.success) {
      setErrors(
        response.errors?.length ? response.errors : [Global("messaging.somethingWentWrong")]
      )
      logECS("error", "adding repository", {
        errors: response.errors,
        url: { path: routePath("template.q.new", { templateId }) },
      });
      return;
    } else {
      if (response?.data?.errors) {
        const errs = extractErrors<AddRepositoryErrors>(response?.data?.errors, ["general", "name", "description", "repositoryTypes", "website"]);

        if (errs.length > 0) {
          setErrors(errs);
          logECS("error", "adding repository", {
            errors: errs,
            url: { path: routePath("template.q.new", { templateId }) },
          });
          return; // Don't proceed to success message if there are errors
        }
      }

      // Add the newly created repository to selected repositories
      const newRepo: RepositoryInterface = {
        id: response.data?.uri || '',
        name: name.trim(),
        uri: website.trim(),
        website: website.trim(),
        description: description.trim(),
        keywords: [],
        repositoryType: []
      };

      // Cache the complete repository data
      setCompleteRepoData(prev => ({
        ...prev,
        [newRepo.uri]: newRepo
      }));

      onRepositoriesChange?.([...Object.values(selectedRepos), newRepo]);
      setCustomForm({ name: '', website: '', description: '' });
      setIsCustomFormOpen(false);
      setIsModalOpen(false);
      const successMessage = QuestionAdd('researchOutput.repoSelector.messages.customRepoAdded', { name: name.trim() });
      toastState.add(successMessage, { type: "success" });
    }
  }, [customForm, templateId, Global, router, QuestionAdd, toastState, selectedRepos]);



  // Process repository results whenever `repositoriesData` changes.
  useEffect(() => {
    let isMounted = true;

    if (repositoriesData?.repositories?.items) {
      if (isMounted) {
        const validRepos = repositoriesData.repositories.items.filter((item): item is Repository => {
          if (!item) return false;
          if ('errors' in item && item.errors && (item.errors.general || item.errors.uri)) {
            return false;
          }
          return true;
        });
        setRepositories(dedupeByUri(validRepos));
        setTotalCount(repositoriesData.repositories.totalCount ?? 0);
        setTotalPages(Math.ceil((repositoriesData.repositories.totalCount ?? 0) / LIMIT));
        setHasNextPage(repositoriesData.repositories.hasNextPage ?? false);
        setHasPreviousPage(repositoriesData.repositories.hasPreviousPage ?? false);
        setHasSearched(true);
      }
    } else if (repositoriesData) {
      // Query ran but returned no items
      if (isMounted) {
        setRepositories([]);
        setHasSearched(true);
      }
    }

    return () => { isMounted = false; };
  }, [repositoriesData]);

  // Set initial preferred repositories when modal first opens
  useEffect(() => {
    if (isModalOpen &&
      preferredReposURIs &&
      preferredReposURIs.length > 0 &&
      preferredRepositoriesData?.re3byURIs &&
      showPreferredOnly) {
      setRepositories(dedupeByUri(preferredRepositoriesData.re3byURIs as Repository[]));
      setTotalCount(preferredRepositoriesData.re3byURIs.length);
      setTotalPages(1);
      setHasNextPage(false);
      setHasPreviousPage(false);
      setHasSearched(true);
    }
  }, [isModalOpen, preferredReposURIs, preferredRepositoriesData]);


  useEffect(() => {
    if (!isModalOpen && preferredReposURIs && preferredReposURIs.length > 0) {
      setShowPreferredOnly(true); // Reset to preferred-only when modal closes
    }
  }, [isModalOpen, preferredReposURIs]);

  useEffect(() => {
    // Fetch on initial load
    handleSearch('');

  }, []);

  // When preferred data loads and we're in preferred-only mode, set it
  // When switching away from preferred-only, fetch all repositories
  useEffect(() => {
    if (showPreferredOnly && preferredRepositoriesData?.re3byURIs) {
      if (preferredRepositoriesData.re3byURIs.length === 0) {
        // Preferred URIs returned no results (URI mismatch etc.) — fall back to all repos
        setShowPreferredOnly(false);
      } else {
        setRepositories(dedupeByUri(preferredRepositoriesData.re3byURIs as Repository[]));
        setTotalCount(preferredRepositoriesData.re3byURIs.length);
        setTotalPages(1);
        setHasNextPage(false);
        setHasPreviousPage(false);
        setHasSearched(true);
      }
    } else if (!showPreferredOnly) {
      fetchRepositories({ page: 1, searchTerm });
    }
  }, [showPreferredOnly, preferredRepositoriesData]);

  const selectedCount = Object.keys(selectedRepos).length;
  const selectedArray = Object.values(selectedRepos);

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        <div className={styles.prefsOption}>

          <div className={styles.selectedItems}>
            <div className={styles.selectedItemsHeader}>
              <span className={styles.selectedCount}>
                {selectedCount} {selectedCount === 1 ? QuestionAdd('researchOutput.repoSelector.singleRepo') : QuestionAdd('researchOutput.repoSelector.multipleRepo')} selected
              </span>
              {selectedCount > 0 && (
                <Button
                  onClick={removeAllRepos}
                  isDisabled={selectedCount === 0}
                  className={`${styles.removeBtn} medium secondary`}
                >
                  {Global('buttons.removeAll')}
                </Button>
              )}

            </div>

            {selectedCount !== 0 && (
              <div>
                {selectedArray.map(repo => (
                  <div key={repo.id} className={styles.item} id={String(repo.id)}>
                    <div className={styles.itemHeader}>
                      <div className={styles.itemContent}>
                        <div className={styles.itemTitle}>{repo.name}
                          <Link
                            href={repo.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.itemLink}
                          >
                            {QuestionAdd('researchOutput.repoSelector.links.viewRepository')} →
                          </Link>
                        </div>
                      </div>
                      <Button
                        onClick={() => removeRepo(repo.uri)}
                        className={`${styles.removeBtn} secondary small`}
                      >
                        {Global('buttons.remove')}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <Button
              onClick={() => setIsModalOpen(true)}
              className={styles.addItemBtn}
            >
              {QuestionAdd('researchOutput.repoSelector.buttons.addRepo')}
            </Button>
          </div>
        </div>
      </div>

      {/* Modal */}
      <Modal
        isDismissable
        onOpenChange={setIsModalOpen}
        isOpen={isModalOpen}
        data-testid="modal"
        className={styles.modalOverlay}
      >
        <Dialog>
          {({ close }) => (
            <>
              <ErrorMessages
                errors={errors}
                ref={errorRef}
              />
              <div>
                <div className={styles.modal}>
                  <div className={styles.modalHeader}>
                    <div className={styles.modalTitle}>
                      <Heading slot="title">{QuestionAdd('researchOutput.repoSelector.headings.repoSearch')}{' '}<span className={styles.tag}>{QuestionAdd('researchOutput.repoSelector.selectedCount', { count: selectedCount })}</span></Heading>
                    </div>
                    <Button
                      onPress={() => {
                        setIsModalOpen(false);
                        close();
                      }}
                      className={styles.closeBtn}
                      aria-label={Global('buttons.closeModal')}
                    >
                      x
                    </Button>
                  </div>

                  <div className={styles.modalBody}>
                    <div className={styles.filterSection}>
                      <div className={styles.filterRow}>
                        <div className={styles.filterGroup}>
                          <FormSelect
                            selectClasses={styles.formSelect}
                            label={QuestionAdd('researchOutput.repoSelector.labels.subjectArea')}
                            placeholder={QuestionAdd('researchOutput.repoSelector.selectSubjectArea')}
                            ariaLabel={QuestionAdd('researchOutput.repoSelector.selectSubjectArea')}
                            isRequired={false}
                            name="status"
                            items={subjectAreas}
                            onChange={(value) => searchOnSubjectArea(value)}
                            selectedKey={subjectArea ?? undefined}
                          >
                            {(item) => <ListBoxItem key={item.id}>{item.name}</ListBoxItem>}
                          </FormSelect>
                        </div>

                        <div className={styles.filterGroup}>
                          <FormSelect
                            selectClasses={styles.formSelect}
                            label={QuestionAdd('researchOutput.repoSelector.labels.repoType')}
                            placeholder={QuestionAdd('researchOutput.repoSelector.selectRepoType')}
                            ariaLabel={QuestionAdd('researchOutput.repoSelector.selectRepoType')}
                            isRequired={false}
                            name="status"
                            items={repositoryTypes}
                            onChange={(value) => searchOnRepositoryType(value)}
                            selectedKey={repoType ?? undefined}
                          >
                            {(item) => <ListBoxItem key={item.id}>{item.name}</ListBoxItem>}
                          </FormSelect>
                        </div>
                      </div>

                      <div className={styles.filterRow}>
                        <div className={styles.filterGroup}>
                          <div className={styles.searchWrapper}>

                            <SearchField className={styles.searchRepos}>
                              <Label>{Global('labels.searchTerm')}</Label>
                              <Input
                                id="search-term"
                                value={searchTerm}
                                onChange={(e) => handleSearchInput(e.target.value)}
                                placeholder='e.g. DNA, titanium, FAIR, etc.'
                              />
                            </SearchField>
                            {preferredReposURIs && preferredReposURIs.length > 0 && (preferredRepositoriesData?.re3byURIs?.length ?? 0) > 0 && (
                              <div className={styles.checkboxWrapper}>
                                <Checkbox
                                  value='preferredOnly'
                                  key='preferredOnly'
                                  id='id-preferredOnly'
                                  isSelected={showPreferredOnly}
                                  data-testid='preferredOnlyCheckbox'
                                  onChange={(isSelected) => {
                                    setShowPreferredOnly(isSelected);
                                  }}
                                  className={styles.checkbox}
                                >
                                  <div className="checkbox">
                                    <svg viewBox="0 0 18 18" aria-hidden="true">
                                      <polyline points="1 9 7 14 15 4" />
                                    </svg>
                                  </div>
                                  <span className="checkbox-label" data-testid='checkboxLabel'>
                                    <div className="checkbox-wrapper">
                                      <div>{QuestionAdd('labels.preferredRepositories')}</div>
                                      <DialogTrigger>
                                        <Button className="popover-btn" aria-label="Click for more info">
                                          <div className="icon info"><DmpIcon icon="info" /></div>
                                        </Button>
                                        <Popover>
                                          <OverlayArrow>
                                            <svg width={12} height={12} viewBox="0 0 12 12">
                                              <path d="M0 0 L6 6 L12 0" />
                                            </svg>
                                          </OverlayArrow>
                                          <Dialog>
                                            <div className="flex-col">
                                              {QuestionAdd('helpText.preferredRepositories')}
                                            </div>
                                          </Dialog>
                                        </Popover>
                                      </DialogTrigger>
                                    </div>
                                  </span>
                                </Checkbox>
                              </div>
                            )}

                            <div className={styles.filterActions}>
                              <Button
                                className="primary medium"
                                onPress={() => {
                                  handleSearch(searchTerm);
                                }}
                              >
                                {Global('buttons.applyFilter')}
                              </Button>
                              <Link
                                href="#"
                                onClick={() => setIsCustomFormOpen(!isCustomFormOpen)}
                              >
                                {QuestionAdd('researchOutput.repoSelector.buttons.addCustomRepo')}
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/**To add Custom repositories- name, url and description fields */}
                    {isCustomFormOpen && (
                      <div className={styles.customRepoForm}>
                        <h4>{QuestionAdd('researchOutput.repoSelector.headings.addNewRepo')}</h4>
                        <FormInput
                          name="repo-name"
                          data-testid="form-input-repo-name"
                          type="text"
                          isRequired={true}
                          label={Global('labels.name')}
                          value={customForm.name}
                          onChange={(e) => setCustomForm({ ...customForm, name: e.target.value })}
                        />
                        <FormInput
                          name="repo-url"
                          data-testid="form-input-repo-url"
                          type="url"
                          isRequired={true}
                          label={QuestionAdd('researchOutput.labels.websiteURL')}
                          value={customForm.website}
                          onChange={(e) => setCustomForm({ ...customForm, website: e.target.value })}
                        />
                        <FormInput
                          name="repo-description"
                          data-testid="form-input-repo-description"
                          type="text"
                          isRequired={true}
                          label={Global('labels.description')}
                          value={customForm.description}
                          onChange={(e) => setCustomForm({ ...customForm, description: e.target.value })}
                        />

                        <div className={styles.formActions}>
                          <Button
                            onClick={handleAddCustomRepo}
                            className={`${styles.applyFilterBtn} primary medium`}
                          >
                            {QuestionAdd('researchOutput.repoSelector.buttons.addRepository')}
                          </Button>
                          <Button
                            onClick={() => {
                              setIsCustomFormOpen(false);
                              setCustomForm({ name: '', website: '', description: '' });//Reset fields
                            }}
                            className="secondary medium"
                          >
                            {Global('buttons.cancel')}
                          </Button>
                        </div>
                      </div>
                    )}

                    {/** Show "NO matches" text if no repositories found */}
                    <div className={styles.searchResults}>
                      {repositories.length === 0 && hasSearched ? (
                        <div className={styles.paginationWrapper}>
                          <span className={styles.paginationInfo}>
                            {QuestionAdd('headings.noMatchesFound')}
                          </span>
                        </div>
                      ) : repositories.length > 0 ? (
                        <div className={styles.paginationWrapper}>
                          <span className={styles.paginationInfo}>
                            {QuestionAdd('headings.displayingRepositoriesStatus', { current: repositories.length, total: totalCount })}
                          </span>
                          <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            hasPreviousPage={hasPreviousPage}
                            hasNextPage={hasNextPage}
                            handlePageClick={handlePageClick}
                          />
                        </div>
                      ) : null}

                      {repositories
                        .filter((repo): repo is Repository & { id: number } => repo.id != null)
                        .map((repo) => {
                          const repoInterface: RepositoryInterface = {
                            id: repo.uri || '',
                            name: repo.name ?? '',
                            description: repo.description ?? '',
                            uri: repo.uri ?? '',
                            website: repo.website ?? '',
                            keywords: repo.keywords ?? [],
                            repositoryType: repo.repositoryTypes ?? []
                          };
                          const isSelected = selectedRepos[repoInterface.uri];
                          return (
                            <div
                              key={repoInterface.id}
                              className={`${styles.searchResultItem} ${isSelected ? styles.selected : ''}`}
                            >
                              <div className={styles.searchResultHeader}>
                                <div className={styles.searchResultTitle}>{repo.name}</div>
                                <Button
                                  onClick={() => toggleSelection(repoInterface)}
                                  className={`small ${isSelected ? 'secondary' : 'primary'}`}
                                >
                                  {isSelected ? Global('buttons.remove') : Global('buttons.select')}
                                </Button>
                              </div>
                              <div className={styles.itemDescription}>{repo.description}</div>
                              <div className={styles.tags}>
                                {repo.keywords?.map((keyword: string) => (
                                  <span key={keyword} className={styles.tag}>{keyword}</span>
                                ))}
                              </div>
                              <ExpandButton
                                collapseLabel={Global('buttons.lessInfo')}
                                data-testid="expand-button"
                                expandLabel={Global('buttons.moreInfo')}
                                className={`${styles.moreInfoToggle} link`}
                                aria-label={expandedDetails[`modal-${repoInterface.id}`] ? Global('buttons.lessInfo') : Global('buttons.moreInfo')}
                                expanded={expandedDetails[`modal-${repoInterface.id}`]}
                                setExpanded={() => toggleDetails(repoInterface.uri, 'modal-')}
                              />
                              {expandedDetails[`modal-${repoInterface.id}`] && (
                                <div className={styles.repoDetails}>
                                  <dl>
                                    <dt>{QuestionAdd('researchOutput.repoSelector.descriptions.repoTitle')}</dt>
                                    <dd>
                                      <a href={repo.uri ?? ''} target="_blank" rel="noopener noreferrer">
                                        {repo.uri}
                                      </a>
                                    </dd>
                                    <dt>{QuestionAdd('researchOutput.repoSelector.descriptions.contactTitle')}</dt>
                                    <dd>TBD</dd>
                                    <dt>{QuestionAdd('researchOutput.repoSelector.descriptions.dataAccessTitle')}</dt>
                                    <dd>TBD</dd>
                                    <dt>{QuestionAdd('researchOutput.repoSelector.descriptions.identifierTitle')}</dt>
                                    <dd>TBD</dd>
                                  </dl>
                                </div>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </Dialog>
      </Modal>
    </div >
  );
};

export default RepoSelectorForAnswer;