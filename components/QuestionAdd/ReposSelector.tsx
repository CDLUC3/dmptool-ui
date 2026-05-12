'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslations } from "next-intl";
import { useParams, useRouter } from "next/navigation";
import {
  Button,
  Checkbox,
  Dialog,
  Heading,
  Input,
  Label,
  Link,
  ListBoxItem,
  Modal,
  SearchField,
} from "react-aria-components";

// GraphQL
import { useQuery, useLazyQuery } from '@apollo/client/react';

import {
  Repository,
  Re3RepositoryTypesListDocument,
  RepositoriesDocument,
  Re3SubjectListDocument,
} from '@/generated/graphql';

import {
  addRepositoryAction
} from "@/app/actions";

// Components
import {
  FormInput,
  FormSelect,
} from '@/components/Form';
import ExpandButton from "@/components/ExpandButton";
import Pagination from '@/components/Pagination';
import ErrorMessages from '../ErrorMessages';

// Utilities/Other
import { routePath } from "@/utils/routes";
import { extractErrors } from "@/utils/errorHandler";
import { useToast } from "@/context/ToastContext";
import logECS from "@/utils/clientLogger";
import { handleApolloError } from '@/utils/apolloErrorHandler';
import {
  RepositoryInterface,
  RepositoryFieldInterface
} from '@/app/types';
import styles from './Selector.module.scss';

// # of repositories displayed per page
const LIMIT = 5;


type AddRepositoryErrors = {
  general?: string;
  name?: string;
  description?: string;
  repositoryTypes?: string;
  website?: string;
}
function toSubjectAreaObject(str: string): { id: string; name: string } {
  const name = str
    .trim()
    .replace(/\s+/g, ' ');

  return {
    id: str.trim(),
    name,
  };
}


/* Research Output question's Repository Selection System */
const RepositorySelectionSystem = ({
  field,
  handleTogglePreferredRepositories,
  onRepositoriesChange
}: {
  field: RepositoryFieldInterface;
  handleTogglePreferredRepositories: (hasCustomRepos: boolean) => void;
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

  // Selected repositories state - include any customRepos from field config as initial state
  const [selectedRepos, setSelectedRepos] = useState<{ [id: string]: RepositoryInterface }>(() => {
    const initial = field.repoConfig?.customRepos || [];

    // Ensure each repo has a string id
    return initial.reduce((acc: { [id: string]: RepositoryInterface }, repo) => {
      const id = repo.uri;
      acc[id] = { ...repo, id }; // Ensure id is set
      return acc;
    }, {});
  });

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
  // Track whether a search has been performed (to avoid showing 'no matches' before searching)
  const [hasSearched, setHasSearched] = useState(false);
  // Filtered repositories state - can be either local mock data or GraphQL data
  const [repositories, setRepositories] = useState<Repository[]>([]);

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

  // Get Repository Subject Areas - for future dynamic subject area fetching
  const { data: subjectAreasData } = useQuery(Re3SubjectListDocument);

  // Transform subject areas data for FormSelect - add empty option for deselection
  const subjectAreas = [
    { id: 'none', name: '-- None --' },
    ...(subjectAreasData?.re3SubjectList?.subjects?.map(area => toSubjectAreaObject(area.subject)) || [])
  ];

  // Repositories lazy query
  const [fetchRepositoriesData, { data: repositoriesData }] = useLazyQuery(RepositoriesDocument, {
    fetchPolicy: 'network-only',
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
      })
    } catch (err) {
      handleApolloError(err, 'RepoSelector.fetchRepositories');
    }
  };


  // Handle pagination page click
  const handlePageClick = async (page: number) => {
    await fetchRepositories({
      page,
      searchTerm
    });
  };

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

    await fetchRepositories({ searchTerm: term });
    setHasSearched(true);
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
    const isRemoving = selectedRepos[repo.uri];

    setSelectedRepos(prev => {
      const newSelected = { ...prev };
      if (newSelected[repo.uri]) {
        delete newSelected[repo.uri];
      } else {
        newSelected[repo.uri] = repo;
      }
      return newSelected;
    });

    // Call toasts AFTER state update completes
    if (isRemoving) {
      toastState.add(QuestionAdd('researchOutput.repoSelector.messages.removedItem', { name: repo.name }), { type: 'success' });
    } else {
      toastState.add(QuestionAdd('researchOutput.repoSelector.messages.addedItem', { name: repo.name }), { type: 'success' });
    }
  };

  // Remove a single repository from the non-modal view
  const removeRepo = (repoId: string) => {
    const repo = selectedRepos[repoId];
    setSelectedRepos(prev => {
      const newSelected = { ...prev };
      delete newSelected[repoId];
      return newSelected;
    });
    toastState.add(QuestionAdd('researchOutput.repoSelector.messages.removedItem', { name: repo.name }), { type: 'success' });
  };
  // Removal of all selected repositories from the non-modal view
  const removeAllRepos = () => {
    if (window.confirm(QuestionAdd('researchOutput.repoSelector.messages.confirmRemoveAll'))) {
      setSelectedRepos({});
      // Uncheck the "Create custom repositories" box as well
      handleTogglePreferredRepositories(false);
      toastState.add(QuestionAdd('researchOutput.repoSelector.messages.allRemoved'), { type: 'success' });
    }
  };

  // Toggle display of additional repository details in modal view
  const toggleDetails = (repoId: string | number, prefix: string = '') => {
    setExpandedDetails(prev => ({
      ...prev,
      [`${prefix}${repoId}`]: !prev[`${prefix}${repoId}`]
    }));
  };

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

      setSelectedRepos(prev => ({ ...prev, [newRepo.uri]: newRepo }));
      setCustomForm({ name: '', website: '', description: '' });
      setIsCustomFormOpen(false);
      setIsModalOpen(false);
      const successMessage = QuestionAdd('researchOutput.repoSelector.messages.customRepoAdded', { name: name.trim() });
      toastState.add(successMessage, { type: "success" });
    }
  }, [customForm, templateId, Global, router, QuestionAdd, toastState]);


  useEffect(() => {
    const reposArray = Object.values(selectedRepos);
    onRepositoriesChange?.(reposArray);
  }, [selectedRepos]);


  // Process repositoriesData changes
  useEffect(() => {
    // If user navigates away while request is in flight, and the network response arrives,
    // can't perform state update on unmounted component. So we track if component is mounted.
    let isMounted = true; // Track if component is still mounted

    const processRepoData = () => {
      if (repositoriesData?.repositories?.items) {

        if (isMounted) {
          // Filter out null items and CustomRepository items with actual errors
          const validRepos = repositoriesData.repositories.items.filter((item): item is Repository => {
            if (!item) return false;
            // Check if it's a CustomRepository with actual error values
            if ('errors' in item && item.errors && (item.errors.general || item.errors.uri)) {
              return false;
            }
            return true;
          });
          setRepositories(validRepos);
          setTotalCount(repositoriesData.repositories.totalCount ?? 0);
          setTotalPages(Math.ceil((repositoriesData.repositories.totalCount ?? 0) / LIMIT));
          setHasNextPage(repositoriesData.repositories.hasNextPage ?? false);
          setHasPreviousPage(repositoriesData.repositories.hasPreviousPage ?? false);
          setHasSearched(true);
        }
      } else {
        if (isMounted) {
          setRepositories([]);
          setHasSearched(true);
        }
      }
    };
    processRepoData();

    return () => {
      isMounted = false; // Mark as unmounted
    };

  }, [repositoriesData]);

  useEffect(() => {
    // On initial load, fetch all repositories
    fetchRepositories({ page: 1 });
  }, []);

  const selectedCount = Object.keys(selectedRepos).length;
  const selectedArray = Object.values(selectedRepos);

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        <div className={styles.prefsOption}>
          <Checkbox
            onChange={() => handleTogglePreferredRepositories(!field.repoConfig?.hasCustomRepos)}
            isSelected={field.repoConfig?.hasCustomRepos || false}
          >
            <div className="checkbox">
              <svg viewBox="0 0 18 18" aria-hidden="true">
                <polyline points="1 9 7 14 15 4" />
              </svg>
            </div>
            {QuestionAdd('researchOutput.repoSelector.labels.createRepos')}
          </Checkbox>
          {field.repoConfig?.hasCustomRepos && (
            <div className={styles.selectedItems}>
              <div className={styles.selectedItemsHeader}>
                <span className={styles.selectedCount}>
                  {selectedCount} {selectedCount === 1 ? QuestionAdd('researchOutput.repoSelector.repositorySelected') : QuestionAdd('researchOutput.repoSelector.repositoriesSelected')}
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
          )}
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

                            <div className={styles.filterActions}>
                              <Button
                                className="primary medium"
                                onPress={() => {
                                  handleSearch(searchTerm);
                                }}
                              >
                                {Global('buttons.applyFilter')}
                              </Button>
                              <Button
                                onClick={() => setIsCustomFormOpen(!isCustomFormOpen)}
                                className="secondary medium"
                              >
                                {QuestionAdd('researchOutput.repoSelector.buttons.addCustomRepo')}
                              </Button>
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
                        .filter((repo): repo is Repository & { id: string } => repo.id != null)
                        .map((repo, idx) => {
                          const repoInterface: RepositoryInterface = {
                            id: repo.uri ?? '',
                            name: repo.name ?? '',
                            description: repo.description ?? '',
                            uri: repo.uri ?? '',
                            website: repo.website ?? '',
                            keywords: repo.keywords ?? [],
                            repositoryType: repo.repositoryTypes ?? []
                          };
                          const isSelected = selectedRepos[repoInterface.uri];
                          // Ensure unique key by prefixing with 'modal-' and fallback to idx if needed
                          const uniqueKey = `modal-${repoInterface.id}-${idx}`;
                          return (
                            <div
                              key={uniqueKey}
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

export default RepositorySelectionSystem;