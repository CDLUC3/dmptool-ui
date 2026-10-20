'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { useRouter } from "@/i18n/routing";
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
  Modal,
  SearchField,
} from "react-aria-components";

// GraphQL
import { useQuery, useLazyQuery } from '@apollo/client/react';
import {
  MetadataStandardsDocument,
  MetadataStandardsByUrIsDocument
} from '@/generated/graphql';

import {
  addMetaDataStandardsAction
} from "@/app/actions";

// Utilities/Other
import { routePath } from "@/utils/routes";
import { extractErrors } from "@/utils/errorHandler";
import logECS from "@/utils/clientLogger";
import { handleApolloError } from '@/utils/apolloErrorHandler';

// Components
import {
  FormInput,
} from '@/components/Form';
import Pagination from '@/components/Pagination';
import ErrorMessages from '../ErrorMessages';
import { useToast } from '@/context/ToastContext';
import { DmpIcon } from "@/components/Icons";

import {
  MetaDataStandardInterface,
} from '@/app/types';
import styles from './metadataStandardForAnswer.module.scss';

// TODO: There is some overlap with components/QuestionAdd/MetaDataStandards.tsx - consider refactoring shared logic

const LIMIT = 5;

type AddMetaDataStandardsErrors = {
  general?: string;
  name?: string;
};

const MetaDataStandardForAnswer = ({
  value = [],
  preferredMetaDataURIs,
  onMetaDataStandardsChange
}: {
  value?: MetaDataStandardInterface[];
  preferredMetaDataURIs?: string[];
  onMetaDataStandardsChange: (standards: MetaDataStandardInterface[]) => void;
}) => {
  // Derive selected standards from value prop
  const selectedStandards = useMemo(() => {
    const result: { [uri: string]: MetaDataStandardInterface } = {};
    return (value || []).reduce((acc, std) => {
      if (std.uri !== undefined) {
        acc[std.uri] = std;
      }
      return acc;
    }, result);
  }, [value]);

  const toastState = useToast();
  const params = useParams();
  const router = useRouter();
  // Get templateId from the URL
  const templateId = String(params.templateId);

  //For scrolling to error in page
  const errorRef = useRef<HTMLDivElement | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCustomFormOpen, setIsCustomFormOpen] = useState(false);
  const [customForm, setCustomForm] = useState({ name: '', uri: '', description: '' });
  const [errors, setErrors] = useState<string[]>([]);

  // Search related states
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [hasNextPage, setHasNextPage] = useState<boolean | null>(false);
  const [hasPreviousPage, setHasPreviousPage] = useState<boolean | null>(false);

  // Translation keys
  const Global = useTranslations("Global");
  const QuestionAdd = useTranslations("QuestionAdd");

  // Filtered metadata standards state
  /*eslint-disable @typescript-eslint/no-explicit-any */
  const [metaDataStandards, setMetaDataStandards] = useState<any[]>([]);
  // State to show preferred metadata standards only. Set to true only if preferredMetaDataURIs are provided.
  const [showPreferredOnly, setShowPreferredOnly] = useState(!!preferredMetaDataURIs && preferredMetaDataURIs.length > 0);

  // Get metadata standards by the preferred URIs to display initially on first load
  const { data: preferredMetaDataStandardsData } = useQuery(MetadataStandardsByUrIsDocument, {
    variables: {
      uris: preferredMetaDataURIs || []
    },
  });

  // Metadata standards lazy query
  const [fetchMetaDataStandardsData] = useLazyQuery(MetadataStandardsDocument);

  // Fetch metadata standards based on search term criteria
  const fetchMetaDataStandards = async ({
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
      const { data } = await fetchMetaDataStandardsData({
        variables: {
          paginationOptions: {
            offset: offsetLimit,
            limit: LIMIT,
            type: "OFFSET",
            sortDir: "DESC",
          },
          term: searchTerm,
        }
      });

      // Process the data immediately after fetching
      if (data?.metadataStandards?.items) {
        const validRepos = data.metadataStandards.items.filter(item => item !== null);
        setMetaDataStandards(validRepos);
        setTotalCount(data.metadataStandards.totalCount ?? 0);
        setTotalPages(Math.ceil((data.metadataStandards.totalCount ?? 0) / LIMIT));
        setHasNextPage(data.metadataStandards.hasNextPage ?? false);
        setHasPreviousPage(data.metadataStandards.hasPreviousPage ?? false);
      } else {
        setMetaDataStandards([]);
      }
    } catch (error) {
      handleApolloError(error, 'MetaDataStandardForAnswer.fetchMetaDataStandards');
    };
  };

  // Handle pagination page click
  const handlePageClick = async (page: number) => {
    await fetchMetaDataStandards({
      page,
      searchTerm
    });
  };

  const handleSearchInput = (term: string) => {
    setSearchTerm(term);
  };

  // Handle search for metadata standards
  const handleSearch = async (term: string) => {
    setErrors([]); // Clear previous errors
    setSearchTerm(term);

    // Reset to first page on new search
    setCurrentPage(1);

    // If showing preferred only, filter the preferred metadata standards locally
    if (showPreferredOnly && preferredMetaDataStandardsData?.metadataStandardsByURIs) {
      const filtered = preferredMetaDataStandardsData.metadataStandardsByURIs.filter(repo => {
        const matchesSearch = !term ||
          repo.name?.toLowerCase().includes(term.toLowerCase()) ||
          repo.description?.toLowerCase().includes(term.toLowerCase()) ||
          repo.keywords?.some(k => k.toLowerCase().includes(term.toLowerCase()));

        return matchesSearch;
      });

      setMetaDataStandards(filtered);
      setTotalCount(filtered.length);
      setTotalPages(1);
      setHasNextPage(false);
      setHasPreviousPage(false);
    } else {
      // Fetch all repositories with filters from API
      await fetchMetaDataStandards({ page: 1, searchTerm: term });
    }
  }

  const toggleSelection = (std: MetaDataStandardInterface) => {
    if (std.uri === undefined) return; // Guard: skip if no id

    const isSelected = !!selectedStandards[std.uri];
    let newSelected: MetaDataStandardInterface[];
    if (isSelected) {
      newSelected = (Object.values(selectedStandards) as MetaDataStandardInterface[]).filter(s => s.uri !== std.uri);
    } else {
      const formattedStd = {
        id: std.uri,
        name: std.name,
        uri: std.uri,
        description: std.description,
      };
      newSelected = [...(Object.values(selectedStandards) as MetaDataStandardInterface[]), formattedStd];
    }
    onMetaDataStandardsChange?.(newSelected);

    // Call toasts AFTER state update completes
    toastState.add(QuestionAdd('researchOutput.repoSelector.messages.' + (isSelected ? 'removedItem' : 'addedItem'), { name: std.name }), { type: 'success' });
  };

  // Remove single standard from selected list
  const removeStandard = (stdId: string) => {
    const std = selectedStandards[stdId];
    const newSelected = (Object.values(selectedStandards) as MetaDataStandardInterface[])
      .filter(s => s.id !== undefined && String(s.id) !== stdId);
    onMetaDataStandardsChange?.(newSelected);
    toastState.add(`${std.name} removed`, { type: 'success' });
  };

  // Remove all selected standards
  const removeAllStandards = () => {
    onMetaDataStandardsChange?.([]);
    toastState.add(QuestionAdd('researchOutput.metaDataStandards.messages.allRemoved'), { type: 'success' });
  };
  const handleAddCustomStandard = useCallback(async () => {
    setErrors([]);
    const { name, description, uri } = customForm;

    if (!name.trim() || !uri.trim() || !description.trim()) {
      toastState.add(QuestionAdd('researchOutput.metaDataStandards.messages.fillInAllFields'), { type: 'error' });
      return;
    };

    const response = await addMetaDataStandardsAction({
      name: name.trim(),
      description: description.trim(),
      uri: uri.trim()
    });

    if (response.redirect) {
      router.push(response.redirect);
      return;
    }

    if (!response.success) {
      setErrors(
        response.errors?.length ? response.errors : [Global("messaging.somethingWentWrong")]
      )
      logECS("error", "adding metadata standard", {
        errors: response.errors,
        url: { path: routePath("template.q.new", { templateId }) },
      });
      return;
    } else {
      if (response?.data?.errors) {
        const errs = extractErrors<AddMetaDataStandardsErrors>(response?.data?.errors, ["general", "name"]);

        if (errs.length > 0) {
          setErrors(errs);
          logECS("error", "adding metadata standard", {
            errors: errs,
            url: { path: routePath("template.q.new", { templateId }) },
          });
          return; // Don't proceed to success message if there are errors
        }
      }

      // Add the newly created standard to selected standards
      const newStandard: MetaDataStandardInterface = {
        id: uri.trim(), // Using URI as ID for custom standards
        name: name.trim(),
        uri: uri.trim(),
        description: description.trim(),
      };

      onMetaDataStandardsChange?.([...(Object.values(selectedStandards) as MetaDataStandardInterface[]), newStandard]);
      setCustomForm({ name: '', uri: '', description: '' });
      setIsCustomFormOpen(false);
      setIsModalOpen(false); //close modal after adding custom standard
      const successMessage = QuestionAdd('researchOutput.metaDataStandards.messages.addedSuccessfully', { name: name.trim() });
      toastState.add(successMessage, { type: "success" });
    }
  }, [customForm, templateId, Global, router]);


  // Set initial metadata standards when modal opens
  useEffect(() => {
    if (isModalOpen &&
      preferredMetaDataURIs &&
      preferredMetaDataURIs.length > 0 &&
      preferredMetaDataStandardsData?.metadataStandardsByURIs &&
      showPreferredOnly) {
      setMetaDataStandards(preferredMetaDataStandardsData.metadataStandardsByURIs);
      setTotalCount(preferredMetaDataStandardsData.metadataStandardsByURIs.length);
      setTotalPages(1);
      setHasNextPage(false);
      setHasPreviousPage(false);
    }
  }, [isModalOpen, preferredMetaDataURIs, preferredMetaDataStandardsData]);

  useEffect(() => {
    if (!isModalOpen && preferredMetaDataURIs && preferredMetaDataURIs.length > 0) {
      setShowPreferredOnly(true); // Reset to preferred-only when modal closes
    }
  }, [isModalOpen, preferredMetaDataURIs]);


  useEffect(() => {
    // On initial page load, fetch all metadata standards
    handleSearch('');
  }, []);

  const selectedCount = Object.keys(selectedStandards).length;
  const selectedArray = Object.values(selectedStandards);

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        <div className={styles.prefsOption}>
          <div className={styles.selectedItems}>
            <div className={styles.selectedItemsHeader}>
              <span className={styles.selectedCount}>
                {selectedCount} {selectedCount === 1 ? QuestionAdd('researchOutput.metaDataStandards.singleMetaData') : QuestionAdd('researchOutput.metaDataStandards.multipleMetaData')} selected
              </span>
              {selectedCount > 0 && (
                <Button
                  onClick={removeAllStandards}
                  isDisabled={selectedCount === 0}
                  className={`${styles.removeBtn} medium secondary`}
                >
                  {Global('buttons.removeAll')}
                </Button>
              )}
            </div>

            {selectedCount !== 0 && (
              <div>
                {selectedArray.map(std => (
                  <div key={std.id || std.name} className={styles.item}>
                    <div className={styles.itemHeader}>
                      <div className={styles.itemContent}>
                        <div className={styles.itemTitle}>{std.name}</div>
                      </div>
                      <Button
                        onClick={() => removeStandard(std.id ? String(std.id) : '')}
                        className={`${styles.removeBtn} small secondary`}
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
              data-testid="open-standard-modal-btn"
            >
              {QuestionAdd('researchOutput.metaDataStandards.buttons.add')}
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
              <div>
                <div className={styles.modal}>
                  <div className={styles.modalHeader}>
                    <div className={styles.modalTitle}>
                      <Heading slot="title">{QuestionAdd('researchOutput.metaDataStandards.headings.dialogHeading')}{' '}<span className={styles.tag}>{QuestionAdd('researchOutput.metaDataStandards.selectedCount', { count: selectedCount })}</span></Heading>
                    </div>
                    <Button
                      type="button"
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
                          <div className={styles.searchWrapper}>

                            <SearchField className={styles.searchRepos}>
                              <Label>{Global('labels.searchTerm')}</Label>
                              <Input
                                id="search-term"
                                value={searchTerm}
                                onChange={(e) => handleSearchInput(e.target.value)}
                                placeholder='e.g. DataCite, Dublin, Biological, etc.'
                              />

                            </SearchField>
                            {preferredMetaDataURIs && preferredMetaDataURIs.length > 0 && (
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
                                      <div>{QuestionAdd('labels.preferredMetadataStandards')}</div>
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
                                              {QuestionAdd('helpText.preferredMetadataStandards')}
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
                                {preferredMetaDataURIs && preferredMetaDataURIs.length > 0 ? Global('buttons.applyFilter') : Global('buttons.search')}
                              </Button>
                              <Button
                                onClick={() => setIsCustomFormOpen(!isCustomFormOpen)}
                                className="secondary medium"
                              >
                                {QuestionAdd('researchOutput.metaDataStandards.buttons.add')}
                              </Button>
                            </div>

                          </div>
                        </div>
                      </div>
                    </div>

                    {isCustomFormOpen && (
                      <div className={styles.customRepoForm}>
                        <ErrorMessages
                          errors={errors}
                          ref={errorRef}
                        />
                        <h4>{QuestionAdd('researchOutput.metaDataStandards.headings.addCustomHeading')}</h4>
                        <FormInput
                          name="std-name"
                          data-testid="form-input-std-name"
                          type="text"
                          isRequired={true}
                          label={Global('labels.name')}
                          value={customForm.name}
                          onChange={(e) => setCustomForm({ ...customForm, name: e.target.value })}
                        />
                        <FormInput
                          name="std-url"
                          data-testid="form-input-std-url"
                          type="url"
                          isRequired={true}
                          label={Global('labels.url')}
                          value={customForm.uri}
                          helpMessage={QuestionAdd('researchOutput.metaDataStandards.help.uri')}
                          onChange={(e) => setCustomForm({ ...customForm, uri: e.target.value })}
                        />
                        <FormInput
                          name="std-description"
                          data-testid="form-input-std-description"
                          type="text"
                          isRequired={true}
                          label={Global('labels.description')}
                          value={customForm.description}
                          onChange={(e) => setCustomForm({ ...customForm, description: e.target.value })}
                        />

                        <div className={styles.formActions}>
                          <Button
                            onClick={handleAddCustomStandard}
                            data-testid="add-custom-std-btn"
                            className={`${styles.applyFilterBtn} primary medium`}
                          >
                            {QuestionAdd('researchOutput.metaDataStandards.buttons.addToTemplate')}
                          </Button>
                          <Button
                            onClick={() => setIsCustomFormOpen(false)}
                            className="secondary medium"
                          >
                            {Global('buttons.cancel')}
                          </Button>
                        </div>
                      </div>
                    )}

                    <div className={styles.searchResults}>
                      <div className={styles.paginationWrapper}>
                        <span className={styles.paginationInfo}>
                          {QuestionAdd('labels.displayPaginationCount', {
                            count: metaDataStandards.length,
                            totalCount
                          })}
                          {/* Displaying standards {metaDataStandards.length} of {totalCount} in total */}
                        </span>
                        <Pagination
                          currentPage={currentPage}
                          totalPages={totalPages}
                          hasPreviousPage={hasPreviousPage}
                          hasNextPage={hasNextPage}
                          handlePageClick={handlePageClick}
                        />
                      </div>

                      {metaDataStandards?.map((std) => {
                        const isSelected = selectedStandards[std.uri];
                        return (
                          <div
                            key={std.id}
                            className={`${styles.searchResultItem} ${isSelected ? styles.selected : ''}`}
                          >
                            <div className={styles.searchResultHeader}>
                              <div>
                                <p className={styles.searchResultTitle}>{std.name}</p>
                                <p>{std.description}</p>
                              </div>
                              <Button
                                onClick={() => toggleSelection(std)}
                                className={`small ${isSelected ? 'secondary' : 'primary'}`}
                              >
                                {isSelected ? Global('buttons.remove') : Global('buttons.select')}
                              </Button>
                            </div>
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

export default MetaDataStandardForAnswer;