'use client';
import React from 'react';
import { useTranslations } from 'next-intl';
import { Button, Link } from "react-aria-components";
import styles from './pagination.module.scss';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  hasPreviousPage: boolean | null;
  hasNextPage: boolean | null;
  handlePageClick: (page: number) => void;
}

export default function Pagination({
  currentPage,
  totalPages,
  hasPreviousPage,
  hasNextPage,
  handlePageClick
}: PaginationProps) {
  const Global = useTranslations('Global');

  const getPages = () => {
    const pages: (number | string)[] = [];
    const delta = 2;
    const maxVisiblePages = 7; // Max pages to show in the pagination row (excluding ellipsis)

    // For small total pages, show all
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
      return pages;
    }

    // Always show first page
    pages.push(1);

    // Calculate the range of pages to show around current page
    let startPage = Math.max(2, currentPage - delta);
    let endPage = Math.min(totalPages - 1, currentPage + delta);

    // Adjust range to always show same number of pages
    const pagesInMiddle = endPage - startPage + 1;
    const targetMiddlePages = 5; // Target number of pages in middle section

    if (pagesInMiddle < targetMiddlePages) {
      if (startPage === 2) {
        // Near the beginning, extend to the right
        endPage = Math.min(totalPages - 1, startPage + targetMiddlePages - 1);
      } else if (endPage === totalPages - 1) {
        // Near the end, extend to the left
        startPage = Math.max(2, endPage - targetMiddlePages + 1);
      }
    }

    // Add leading ellipsis or placeholder
    if (startPage > 2) {
      pages.push('ellipsis-start');
    } else {
      pages.push('placeholder-start');
    }

    // Add middle pages
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    // Add trailing ellipsis or placeholder
    if (endPage < totalPages - 1) {
      pages.push('ellipsis-end');
    } else {
      pages.push('placeholder-end');
    }

    // Always show last page
    if (totalPages > 1) {
      pages.push(totalPages);
    }

    return pages;
  };

  const pagesToRender = getPages();

  return (
    <nav aria-label={Global('labels.pagination')} className={styles.pagination}>
      <Button
        aria-label={Global('labels.previousPage')}
        onClick={() => handlePageClick(currentPage - 1)}
        isDisabled={!hasPreviousPage}
      >
        {Global('links.prev')}
      </Button>

      <ol>
        {pagesToRender.map((page, index) => {
          // Handle ellipsis
          if (page === 'ellipsis-start' || page === 'ellipsis-end') {
            return (
              <li key={page + index} aria-hidden="true" className={styles.ellipsis}>
                &hellip;
              </li>
            );
          }

          // Handle invisible placeholders
          if (page === 'placeholder-start' || page === 'placeholder-end') {
            return (
              <li key={page + index} aria-hidden="true" className={styles.placeholder}>
                {/* Invisible spacer */}
              </li>
            );
          }

          // Handle regular page numbers
          return (
            <li aria-setsize={totalPages} aria-posinset={Number(page)} key={page}>
              <Link
                className={(page === currentPage) ? styles.current : ""}
                href="#"
                aria-label={Global('labels.pageNumber', { page })}
                aria-current={page === currentPage ? "page" : undefined}
                onClick={(e) => {
                  e.preventDefault();
                  handlePageClick(Number(page));
                }}
              >
                {page}
              </Link>
            </li>
          );
        })}
      </ol>

      <Button
        aria-label={Global('labels.nextPage')}
        type="button"
        onClick={(e) => {
          e.preventDefault();
          handlePageClick(currentPage + 1)
        }
        }
        isDisabled={!hasNextPage}
      >
        {Global('links.next')}
      </Button>
    </nav>
  );
}
