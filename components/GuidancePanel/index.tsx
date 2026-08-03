'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Dialog,
  Heading,
  Modal,
  Tabs,
  TabList,
  Tab,
  TabPanel,
  Button
} from "react-aria-components";
import Image from 'next/image';
import parse from 'html-react-parser';
import { useTranslations } from "next-intl";

// GraphQL
import {
  AffiliationSearch,
  GuidanceSourceType
} from '@/generated/graphql';

// Types
import {
  GuidanceSource,
  GuidancePanelProps,
  FunderSearchResults
} from '@/app/types';

// Components
import ExpandableContentSection from '@/components/ExpandableContentSection';
import { DmpIcon } from "@/components/Icons";
import ErrorMessages from '@/components/ErrorMessages';
import AffiliationSearchForGuidance from '../AffiliationSearchForGuidance';
import styles from './GuidancePanel.module.scss';

const GuidancePanel: React.FC<GuidancePanelProps> = ({
  userAffiliationId,
  ownerAffiliationId,
  versionedTemplateId,
  guidanceItems,
  guidanceError,
  onClearError,
  onAddOrganization,
  onRemoveOrganization,
  linkDisabled = false,
}) => {
  const Global = useTranslations('Global');
  const t = useTranslations('GuidancePanel');
  const Org = useTranslations('FunderSearch');

  // Refs for measuring
  const containerRef = useRef<HTMLDivElement>(null);
  const pillsRef = useRef<(HTMLDivElement | null)[]>([]);
  // Ref for scrolling down to first result
  const resultsRef = useRef<HTMLElement>(null);
  //For scrolling to error in page
  const errorRef = useRef<HTMLDivElement | null>(null);
  // Track previous guidanceSources
  const prevGuidanceSourcesRef = useRef<GuidanceSource[]>([]);

  // Internal state for uncontrolled usage
  const [showAllTabs, setShowAllTabs] = useState<boolean>(false);
  const [visibleCount, setVisibleCount] = useState<number>(3); // Default to 3
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);
  const [selectedGuidanceId, setSelectedGuidanceId] = useState<string>('bestPractice');
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  // State for modal dialog
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [moreCounter, setMoreCounter] = useState<number>(0);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [funders, setFunders] = useState<AffiliationSearch[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  // Track whether search was performed
  const [searchPerformed, setSearchPerformed] = useState<boolean>(false);
  // Track the search value
  const [searchValue, setSearchValue] = useState<string>('');

  // Get guidanceItems prop which includes all sources (best practice + orgs)
  const guidanceSources = useMemo<GuidanceSource[]>(() => {
    const sources: GuidanceSource[] = [];

    // Find best practice from the guidance items passed in
    const bestPracticeSource = guidanceItems.find(item => item.type === GuidanceSourceType.BestPractice);

    if (bestPracticeSource) {
      sources.push({
        id: 'bestPractice',
        type: 'bestPractice',
        label: "DMP Tool",
        shortName: 'DMP Tool',
        items: bestPracticeSource.items
      });
    }

    // Add organization guidance sources
    guidanceItems
      .filter(item => item.type !== GuidanceSourceType.BestPractice)
      .forEach((org, index) => {
        sources.push({
          id: `org-${index}`,
          type: 'organization',
          label: org.orgName,
          shortName: org.orgShortname || null,
          items: org.items || [],
          orgURI: org.orgURI
        });
      });
    return sources;
  }, [guidanceItems]);

  const handleDialogCloseBtn = () => {
    setIsModalOpen(false);
  };

  const handleOpenDialog = () => {
    setIsModalOpen(true);
  }

  const handleSelectFunder = (funder: AffiliationSearch) => {
    if (!funder.uri) return;

    // Trigger callback to add organization
    if (onAddOrganization) {
      onAddOrganization(funder);
    }
  };

  const toggleShowAllTabs = () => {
    setIsTransitioning(true);

    setShowAllTabs(!showAllTabs);

    // Clear transition flag after animation completes
    setTimeout(() => {
      setIsTransitioning(false);
    }, 200); // Match your fadeIn animation duration

  };

  /**
   * Checks if the useMore button should display or not.
   */
  const hasMore = () => {
    if (!nextCursor) return false;
    return (funders.length < totalCount);
  }


  function onResults(results: FunderSearchResults, isNew: boolean) {
    let validResults: AffiliationSearch[];
    if (results.items && results.items.length > 0) {
      validResults = results.items.filter((r): r is AffiliationSearch => r !== null)
    } else {
      validResults = [];
    }

    if (isNew) {
      setFunders(validResults);
      setSearchPerformed(true);
    } else {
      setFunders(funders.concat(validResults));
    }

    setTotalCount(results.totalCount as number);

    if (results.nextCursor) {
      setNextCursor(results.nextCursor);
    }
  }

  const handleRemoveOrganization = (sourceId: string, orgId?: string) => {
    if (!orgId || !onRemoveOrganization) return;

    if (onRemoveOrganization) {
      onRemoveOrganization(orgId);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
  };

  // Calculate how many pills can fit in first row
  // because we always want to show the "More" button in the first row if there are too many pills
  useEffect(() => {
    const calculateVisibleCount = () => {
      if (!containerRef.current || guidanceSources.length === 0) return;

      const containerWidth = containerRef.current.offsetWidth;
      const gap = 8; // Gap between pills
      const moreButtonWidth = 80; // Approximate width of "More" button
      const availableWidth = containerWidth - moreButtonWidth - gap;

      let totalWidth = 0;
      let count = 0;

      // Measure each pill temporarily to see how many fit
      pillsRef.current.forEach((pill) => {
        if (!pill) return;
        const pillWidth = pill.offsetWidth;
        if (totalWidth + pillWidth + (count > 0 ? gap : 0) <= availableWidth) {
          totalWidth += pillWidth + (count > 0 ? gap : 0);
          count++;
        }
      });

      // Always show at least 1 pill
      setVisibleCount(Math.max(1, count));
    };

    // Calculate on mount and guidanceSources change
    calculateVisibleCount();

    // Recalculate on window resize
    const resizeObserver = new ResizeObserver(calculateVisibleCount);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => resizeObserver.disconnect();
  }, [guidanceSources]);


  // Ensure selected tab is valid
  useEffect(() => {
    // Don't interfere with initialization logic
    if (!isInitialized) {
      return;
    }

    // Check if currently selected tab still exists
    if (guidanceSources.length > 0 && !guidanceSources.find(s => s.id === selectedGuidanceId)) {
      // Currently selected tab was removed, need to select a new one
      let matchingSource = null;

      // First priority: Try to match user's affiliation
      if (userAffiliationId) {
        matchingSource = guidanceSources.find(
          source => source.type === 'organization' && source.orgURI === userAffiliationId
        );
      }

      // Second priority: If no user match, try to match owner's affiliation
      if (!matchingSource && ownerAffiliationId) {
        matchingSource = guidanceSources.find(
          source => source.type === 'organization' && source.orgURI === ownerAffiliationId
        );
      }

      // Third priority: Fall back to bestPractice
      if (!matchingSource) {
        matchingSource = guidanceSources[0]; // bestPractice should be first
      }

      if (matchingSource) {
        setSelectedGuidanceId(matchingSource.id);
      }
    }
  }, [guidanceSources, selectedGuidanceId, isInitialized, userAffiliationId, ownerAffiliationId]);

  // Auto-select tab based on user affiliation, with fallback to owner affiliation, and then best practice
  useEffect(() => {
    if (guidanceSources.length === 0) {
      return;
    }

    // Check if user's affiliation was just added
    const userAffiliationJustAdded = userAffiliationId &&
      !prevGuidanceSourcesRef.current.some(s => s.orgURI === userAffiliationId) &&
      guidanceSources.some(s => s.type === 'organization' && s.orgURI === userAffiliationId);

    // Check if owner's affiliation was just added
    const ownerAffiliationJustAdded = ownerAffiliationId &&
      !prevGuidanceSourcesRef.current.some(s => s.orgURI === ownerAffiliationId) &&
      guidanceSources.some(s => s.type === 'organization' && s.orgURI === ownerAffiliationId);


    // Only auto-select if:
    // 1. Not yet initialized (first load), OR
    // 2. User's affiliation was just added back
    // 3. Owner's affiliation was just added back (and no user affiliation)
    if (!isInitialized || userAffiliationJustAdded || (!userAffiliationId && ownerAffiliationJustAdded)) {
      let matchingSource = null;

      // First priority: Try to match user's affiliation
      if (userAffiliationId) {
        matchingSource = guidanceSources.find(
          source => source.type === 'organization' && source.orgURI === userAffiliationId
        );
      }

      // Second priority: If no user match, try to match owner's affiliation
      if (!matchingSource && ownerAffiliationId) {
        matchingSource = guidanceSources.find(
          source => source.type === 'organization' && source.orgURI === ownerAffiliationId
        );
      }

      // Set the selected tab
      if (matchingSource) {
        setSelectedGuidanceId(matchingSource.id);
      } else if (!isInitialized) {
        // Only fall back to bestPractice on initial load
        setSelectedGuidanceId('bestPractice');
      }

      if (!isInitialized) {
        setIsInitialized(true);
      }
    }

    // Update the ref with current sources for next comparison
    prevGuidanceSourcesRef.current = guidanceSources;
  }, [guidanceSources, userAffiliationId, ownerAffiliationId, isInitialized]);

  useEffect(() => {
    if (isModalOpen && funders.length > 0 && resultsRef.current) {
      resultsRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  }, [funders, isModalOpen]);

  // When modal closes reset funders and searchPerformed
  useEffect(() => {
    if (!isModalOpen) {
      setFunders([]);
      setSearchValue('');
      setSearchPerformed(false); // Important: prevents "no results" message from showing on reopen

      // Clear any errors when modal closes
      if (onClearError) {
        onClearError();
      }
    }
  }, [isModalOpen]);


  useEffect(() => {
    if (searchValue === '') {
      setSearchPerformed(false);
      setFunders([]);
    }
  }, [searchValue]);

  // Show "More" button if there are more than the calculated visible tabs that fit in one row
  const hasOverflow = guidanceSources.length > visibleCount;

  return (
    <div className={`${styles.guidancePanel} ${!isInitialized ? styles.initializing : ''}`}>
      {guidanceSources.length === 0 && onAddOrganization && (
        <div className={`${styles.actionButtons} ${styles.emptyState}`}>
          <Button
            className="link"
            onPress={handleOpenDialog}
            aria-label={t('addGuidanceSource')}
          >
            <DmpIcon icon="plus" />
            <span>{t('addOrganization')}</span>
          </Button>
        </div>
      )}
      <Tabs
        selectedKey={selectedGuidanceId}
        onSelectionChange={(key) => setSelectedGuidanceId(String(key))}
        className={styles.guidanceTabs}
      >
        <div className={styles.tabListWrapper} ref={containerRef}>
          <div className={styles.tabsRow}>
            <TabList
              aria-label={t('guidanceSourceSelection')}
              className={styles.pillsContainer}
            >
              {/* Render all pills (hidden ones are positioned off-screen) */}
              {guidanceSources.map((source, index) => {
                const isVisible = showAllTabs || index < visibleCount;
                return (
                  <Tab
                    key={source.id}
                    id={source.id}
                    className={`
                      ${styles.pill} 
                      ${isTransitioning ? styles.transitioning : ''} 
                      ${isVisible ? styles.pillVisible : styles.pillHidden}
                      ${!isVisible && !showAllTabs ? styles.pillOffscreen : ''}
                    `}
                  >

                    {({ isSelected, isFocusVisible }) => (
                      <div
                        ref={(el) => { pillsRef.current[index] = el; }}
                        className={`
                        ${styles.pillInner} 
                        ${isSelected ? styles.pillSelected : ''} 
                        ${isFocusVisible ? styles.pillFocused : ''}
                      `}
                      >
                        <span>{source.shortName}</span>
                      </div>

                    )}
                  </Tab>
                );
              })}
            </TabList>

            {/* More button at end of first row */}
            {hasOverflow && !showAllTabs && (
              <Button
                className="toggle"
                onPress={toggleShowAllTabs}
                aria-expanded={showAllTabs}
                aria-label={t('ariaLabels.showMoreGuidance')}
              >
                {t('more')} <span aria-hidden="true">&#9660;</span>
              </Button>
            )}
          </div>

          {/* Action Buttons - Below tabs when expanded */}
          {hasOverflow && showAllTabs && (
            <div className={styles.actionButtons}>
              <Button
                className="toggle"
                onPress={toggleShowAllTabs}
                aria-expanded={showAllTabs}
                aria-label={t('ariaLabels.showLessGuidance')}
              >
                {t('less')} <span aria-hidden="true">&#9650;</span>
              </Button>
              {onAddOrganization && (
                <Button
                  className="link"
                  onPress={handleOpenDialog}
                  aria-label={t('addGuidanceSource')}
                >
                  <DmpIcon icon="plus" />
                  <span>{t('addOrganization')}</span>
                </Button>
              )}
            </div>
          )}

          {/* Add Organization button when no overflow */}
          {!hasOverflow && onAddOrganization && !linkDisabled && (
            <div className={`${styles.actionButtons} ${styles.singleRow}`}>
              <Button
                className="link"
                onPress={handleOpenDialog}
                aria-label={t('addGuidanceSource')}
              >
                <span>{t('addOrganization')}</span>
              </Button>
            </div>
          )}
        </div>

        {/* Tab Panels (Content) */}
        {guidanceSources.map((source) => (
          <TabPanel key={source.id} id={source.id} className={styles.guidanceContent}>
            {renderGuidanceContentForSource(source, Global)}
          </TabPanel>
        ))}
      </Tabs>

      {/** Modal to add or remove guidance orgs */}
      <Modal
        isDismissable
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        data-testid="modal"
      >
        <Dialog className={styles.guidanceDialog}>
          <div className={styles.modalHeader}>
            <div className={styles.modalHeaderTop}>
              <Heading slot="title">{t('headings.customizeBestPractice')}</Heading>
              <Button
                className="close-action"
                aria-label={Global('buttons.close')}
                onPress={handleDialogCloseBtn}
                data-testid="close-action"
              >
                <DmpIcon icon="right-panel_close" />
                {' '}{Global('buttons.close')}
              </Button>
            </div>
            {guidanceError && (
              <ErrorMessages
                errors={[guidanceError]}
                ref={errorRef}
              />
            )}
          </div>
          <div className={styles.modalScrollableContent}>
            <div className={`${styles.publishModal} ${styles.dialogWrapper} ${styles.modalContent}`}>
              <Tabs
                className={styles.guidanceTabs}
              >
                <div className={styles.tabListWrapper}>
                  <div className={`${styles.tabsRow} ${styles.modalTabsRow}`}>
                    <div><h3 className={styles.modalH3}>{t('headings.currentlyDisplaying')}</h3></div>
                    <div className={styles.pillsContainer}>
                      {guidanceSources
                        .filter(source => source.type !== 'bestPractice') // Don't show remove option for best practice
                        .map((source) => (
                          <div
                            key={source.id}
                            className={`${styles.pill} ${styles.pillVisible}`}
                          >

                            <div className={`${styles.pillCustomize} ${styles.pillInner}`}>
                              <span>{source.shortName}</span>
                              <Button
                                className={"unstyled"}
                                aria-label={`Remove ${source.label}`}
                                onPress={() => handleRemoveOrganization(source.id, source.orgURI)}
                              >
                                <DmpIcon icon="cancel-reverse" />
                              </Button>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>

                <div><h3 className={styles.modalH3}>{t('headings.addMore')}</h3></div>
                <AffiliationSearchForGuidance
                  onResults={onResults}
                  moreTrigger={moreCounter}
                  versionedTemplateId={versionedTemplateId}
                  onSearchChange={handleSearchChange}
                />

                {searchPerformed && funders.length === 0 && (
                  <section>
                    <p className={styles.resultsCount}>
                      {Org('noResults')}
                    </p>
                  </section>
                )}
                {(funders.length > 0 && searchValue) && (
                  <section
                    ref={resultsRef}
                    aria-labelledby="funders-section"
                  >
                    <p className={styles.resultsCount}>
                      {Org('showCount', {
                        count: funders.length,
                        total: totalCount,
                      })}
                    </p>
                    <div>
                      {funders.map((funder, index) => (
                        <div key={index} className={styles.fundingResultsList}>
                          <div
                            className={styles.fundingResultsListItem}
                            role="group"
                            aria-label={`${Org('funder')}: ${funder.displayName}`}
                          >
                            <p className="funder-name">{funder.displayName}</p>
                            <Button
                              className="secondary select-button"
                              data-funder-uri={funder.uri}
                              onPress={() => handleSelectFunder(funder)}
                              aria-label={`${Global('buttons.select')} ${funder.displayName}`}
                            >
                              {Global('buttons.select')}
                            </Button>
                          </div>
                        </div>
                      ))}

                      {(hasMore()) && (
                        <div className={styles.fundingResultsListMore}>
                          <Button
                            data-testid="load-more-btn"
                            onPress={() => setMoreCounter(moreCounter + 1)}
                            aria-label={Global('buttons.loadMore')}
                          >
                            {Global('buttons.loadMore')}
                          </Button>
                        </div>
                      )}
                    </div>
                  </section>
                )}
              </Tabs>
            </div>
          </div>
        </Dialog>
      </Modal>
    </div >
  );
};

// Helper function to render content based on source type
const renderGuidanceContentForSource = (source: GuidanceSource, Global: (key: string, values?: Record<string, string | number>) => string) => {
  switch (source.type) {
    case 'bestPractice':
      return (
        <>
          <div className={styles.headerWithLogo}>
            <h2 className={`h4 ${styles.headerWithLogo}`}>{Global('bestPractice')}</h2>
            <Image
              src="/images/dmplogo.svg"
              width={114}
              height={16}
              alt="DMP Tool"
            />
          </div>
          <div className={styles.matchedGuidanceList}>
            {source.items?.map(g => {
              // Extract plain text to check length
              const tempDiv = document.createElement('div');
              tempDiv.innerHTML = g.guidanceText;
              const textContent = tempDiv.textContent || tempDiv.innerText || '';
              const needsExpansion = textContent.length > 100;
              return (
                <ExpandableContentSection
                  key={`guidance-${g.id}`}
                  id={`guidance-${g.id}`}
                  heading={g.title || ''}
                  expandLabel={Global('links.expand')}
                  summaryCharLimit={needsExpansion ? 100 : undefined}
                >
                  {parse(g.guidanceText)}
                </ExpandableContentSection>
              );
            })}
          </div>
        </>
      );

    case 'organization':
      return (
        <>
          <div className={styles.matchedGuidanceList}>
            <h2 className="h4">{source.label}</h2>
            {source.items?.length === 0 && (
              <p>{Global('noGuidanceAvailable')}</p>
            )}
            {source.items?.map(g => {
              // Extract text from HTML to check if we need expandable section
              const tempDiv = document.createElement('div');
              tempDiv.innerHTML = g.guidanceText;
              const textContent = tempDiv.textContent || tempDiv.innerText || '';
              const needsExpansion = textContent.length > 100;

              return (
                <ExpandableContentSection
                  key={`guidance-${g.id}`}
                  id={`guidance-${g.id}`}
                  heading={(source.label !== g.title) ? g.title : undefined}
                  expandLabel={Global('links.expand')}
                  summaryCharLimit={needsExpansion ? 100 : undefined}
                >
                  {parse(g.guidanceText)}
                </ExpandableContentSection>
              );
            })}
          </div>
        </>
      );

    default:
      return null;
  }
};

export default GuidancePanel;