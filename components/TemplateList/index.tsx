import React, { useRef, type TransitionStartFunction } from 'react';
import { Button, Link } from 'react-aria-components';
import { useTranslations } from 'next-intl';
import TemplateSelectListItem from "@/components/TemplateSelectListItem";
import { TemplateItemProps } from '@/app/types';
import styles from './templateList.module.scss';

// Define the possible keys for visibleCount object
export type VisibleCountKeys = 'publicTemplatesList' | 'templates' | 'filteredTemplates' | 'filteredPublicTemplates';

// Define the shape of the visibleCount object
export interface VisibleCount {
  publicTemplatesList: number;
  templates: number;
  filteredTemplates: number;
  filteredPublicTemplates: number;
}

// Define the props interface for TemplateList component
export interface TemplateListProps {
  /** Array of template items to display */
  templates: TemplateItemProps[];
  /** Key to identify which list is being displayed */
  visibleCountKey?: VisibleCountKeys;
  /** Increments for displaying additional templates*/
  increment?: number;
  /** Callback function when a template is selected */
  onSelect: (versionedTemplateId: number, startTransition: TransitionStartFunction) => Promise<void>;
  /** Object containing count of visible items for each list type */
  visibleCount?: VisibleCount;
  /** Callback function to load more items */
  handleLoadMore?: (key: VisibleCountKeys) => void;
  /** Callback function to reset search results */
  resetSearch?: () => void;
}

const TemplateList: React.FC<TemplateListProps> = ({
  templates,
  increment = 3,
  visibleCountKey,
  onSelect,
  visibleCount,
  handleLoadMore,
  resetSearch
}) => {

  const nextSectionRef = useRef<HTMLDivElement>(null);
  //Localization keys
  const SelectTemplate = useTranslations('TemplateSelectTemplatePage');


  const handleLoadMorePress = (listKey: VisibleCountKeys) => {

    if (handleLoadMore) {
      // load more
      handleLoadMore(listKey);

      //scroll to next section
      setTimeout(() => {
        if (nextSectionRef.current) {
          nextSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 0);
    }

  }

  // Determine if we should use load more functionality
  const shouldUseLoadMore = visibleCount && visibleCountKey && handleLoadMore;

  // Get the templates to render (either sliced or all)
  const templatesToRender = shouldUseLoadMore
    ? templates.slice(0, visibleCount[visibleCountKey])
    : templates;

  // Calculate visible count for display purposes
  const currentVisibleCount = shouldUseLoadMore
    ? visibleCount[visibleCountKey]
    : templates.length;

  return (
    <>
      {(visibleCountKey === 'filteredTemplates' || visibleCountKey === 'filteredPublicTemplates') && (
        <div className={styles.searchMatchText}>
          {SelectTemplate('resultsText', { name: templates.length })} -
          <Link onPress={resetSearch} href="/" className={styles.searchMatchText}>
            clear filter
          </Link>
        </div>
      )}

      {templatesToRender.map((template, index) => {
        const isFirstInNextSection = shouldUseLoadMore && index === currentVisibleCount - increment;
        return (
          <div ref={isFirstInNextSection ? nextSectionRef : null} key={index}>
            <TemplateSelectListItem
              item={template}
              onSelect={onSelect}
            />
          </div>
        );
      })}

      {shouldUseLoadMore && (
        <div className={styles.loadBtnContainer}>
          {templates.length - currentVisibleCount > 0 && (
            <>
              {(() => {
                const loadMoreNumber = templates.length - currentVisibleCount;
                const totalAvailable = templates.length;
                return (
                  <>
                    <Button onPress={() => handleLoadMorePress(visibleCountKey!)}>
                      {loadMoreNumber > (increment - 1)
                        ? SelectTemplate('buttons.loadMore', { name: increment })
                        : SelectTemplate('buttons.loadMore', { name: loadMoreNumber })}
                    </Button>
                    <div className={styles.remainingText}>
                      {SelectTemplate('numDisplaying', { num: currentVisibleCount, total: totalAvailable })}
                    </div>
                  </>
                );
              })()}
            </>
          )}
          {(visibleCountKey === 'filteredTemplates' || visibleCountKey === 'filteredPublicTemplates') && (
            <Link onPress={resetSearch} href="/" className={styles.searchMatchText}>
              {SelectTemplate('clearFilter')}
            </Link>
          )}
        </div>
      )}

      {/* Show clear filter link even without load more functionality */}
      {!shouldUseLoadMore && (visibleCountKey === 'filteredTemplates' || visibleCountKey === 'filteredPublicTemplates') && (
        <div className={styles.loadBtnContainer}>
          <Link onPress={resetSearch} href="/" className={styles.searchMatchText}>
            {SelectTemplate('clearFilter')}
          </Link>
        </div>
      )}
    </>
  );
};

export default TemplateList;
