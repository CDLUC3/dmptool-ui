'use client';

import React, { useState, useMemo } from 'react';
import classNames from 'classnames';
import { useTranslations } from 'next-intl';
import styles from './ExpandableContentSection.module.scss';

export default function ExpandableContentSection({
  id,
  heading,
  expandLabel,
  collapseLabel,
  summaryCharLimit,
  linkClass,
  children
}: {
  id: string;
  heading?: string;
  expandLabel?: string;
  collapseLabel?: string;
  summaryCharLimit?: number;
  linkClass?: string;
  children: React.ReactNode;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const contentId = `${id}-content`;

  // localization keys
  const Global = useTranslations('Global');

  // Helper function to extract text content from React nodes
  const getTextContent = (node: React.ReactNode): string => {
    if (typeof node === 'string') return node;
    if (typeof node === 'number') return node.toString();
    if (!node) return '';

    if (Array.isArray(node)) {
      return node.map(getTextContent).join('');
    }

    if (typeof node === 'object' && 'props' in node) {
      return getTextContent(node.props.children);
    }

    return '';
  };

  // Truncate the text up to the max length (i.e., specified summaryCharLimit)
  const truncateText = (text: string, maxLength: number): { truncated: string; wasTruncated: boolean } => {

    const truncated = text.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');
    const finalText = lastSpace > 0 ? truncated.substring(0, lastSpace) : truncated;

    // Add ellipsis to summary or truncated text
    return { truncated: finalText + '...', wasTruncated: true };
  };

  // Truncate content assuming children is a valid React Element, like a <p> tag
  const { summaryElements, wasTruncated } = useMemo(() => {
    const childrenArray = React.Children.toArray(children);
    let charCount = 0;
    const limit = summaryCharLimit ?? Infinity;
    const summary: React.ReactNode[] = [];
    let reachedLimit = false;

    const processElement = (child: React.ReactNode): React.ReactNode | null => {
      if (!React.isValidElement(child)) return child;

      const allowedTags = ['p', 'div', 'span', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'strong', 'em', 'a', 'b', 'i', 'br'];
      if (!allowedTags.includes(child.type as string)) return null;

      // Handle lists specially - process children individually
      if (child.type === 'ul' || child.type === 'ol') {
        const listItems: React.ReactNode[] = [];
        const childProps = child.props as { children?: React.ReactNode };
        const items = React.Children.toArray(childProps.children);

        for (const item of items) {
          if (reachedLimit) break;
          const processed = processElement(item);
          if (processed) listItems.push(processed);
        }

        if (listItems.length === 0) return null;
        return React.cloneElement(child as React.ReactElement, { children: listItems });
      }

      // For other elements, check text length
      const textContent = getTextContent(child);
      const remaining = limit - charCount;

      if (textContent.length <= remaining) {
        charCount += textContent.length;
        return child;
      } else {
        const { truncated } = truncateText(textContent, remaining);
        charCount += remaining;
        reachedLimit = true;
        return React.cloneElement(
          child as React.ReactElement<{ children?: React.ReactNode }>,
          { children: truncated }
        );
      }
    };

    for (const child of childrenArray) {
      if (reachedLimit) break;
      const processed = processElement(child);
      if (processed) summary.push(processed);
    }

    return {
      summaryElements: summary,
      wasTruncated: reachedLimit || summary.length < childrenArray.length,
    };
  }, [children, summaryCharLimit]);


  return (
    <section className={styles.section}>
      {heading && (
        <h3 id={`${id}-heading`} className="h5">{heading}</h3>
      )}
      {/**Don't show the summaryElements if the content is expanded */}
      <div className={styles.summaryContent} id={contentId}>
        {isExpanded || !wasTruncated ? children : summaryElements}
      </div>

      {wasTruncated && (
        <p>
          <a
            href={`#${contentId}`}
            onClick={(e) => {
              e.preventDefault();
              setIsExpanded(!isExpanded);
            }}
            aria-expanded={isExpanded}
            aria-controls={contentId}
            className={classNames(linkClass, isExpanded ? styles.collapseLink : styles.expandLink)}
          >
            {isExpanded
              ? collapseLabel || Global('links.collapse')
              : expandLabel || Global('links.expand')}
          </a>
          <span aria-live="polite" className="hidden-accessibly">
            {isExpanded
              ? Global('messaging.sectionIsExpanded')
              : Global('messaging.sectionIsCollapsed')}
          </span>
        </p>
      )}
    </section>

  );
}