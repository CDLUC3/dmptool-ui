'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from "react-aria-components";
import {
  ResearchOutputTableQuestionType
} from '@dmptool/types';
import { useTranslations } from "next-intl";

import {
  ResearchOutputTable
} from '@/app/types';

import SingleResearchOutputComponent from './SingleResearchOutputComponent';
import { createEmptyResearchOutputRow, getRowDisplayInfo } from '@/utils/researchOutputTransformations';
import { useScrollToElement } from './hooks/useScrollToElement';
import styles from './researchOutputAnswer.module.scss';

type ResearchOutputAnswerComponentProps = {
  columns: ResearchOutputTableQuestionType['columns'];
  rows: ResearchOutputTable[];
  setRows: React.Dispatch<React.SetStateAction<ResearchOutputTable[]>>;
  onSave?: (rows: ResearchOutputTable[], type?: string) => Promise<void>; // Callback to trigger parent save with current data
  initialViewMode?: 'list' | 'form'; // Control initial view - 'form' for preview, 'list' for normal use
  isDisabled?: boolean; // Whether the component is in read-only mode (e.g., for preview or if question is disabled)
  onEditingStateChange?: (isEditing: boolean) => void; // Notify parent when entering/leaving single-edit view
};

const ResearchOutputAnswerComponent: React.FC<ResearchOutputAnswerComponentProps> = ({
  columns,
  rows,
  setRows,
  onSave,
  initialViewMode = 'list',
  isDisabled = false,
  onEditingStateChange,
}) => {
  // State to track which row is being edited (null means showing list view)
  // If preview mode, start in form view immediately (no flash)
  const [editingRowIndex, setEditingRowIndex] = useState<number | null>(() => {
    if (initialViewMode === 'form') {
      return 0;
    }
    return null;
  });
  // To track that the page was rendered once
  const hasInitialized = useRef(false);
  // State to track if we're adding a new entry
  const [isAddingNew, setIsAddingNew] = useState(initialViewMode === 'form');

  // Localization
  const Global = useTranslations('Global');
  const t = useTranslations('QuestionEdit');

  // Scroll utility
  const scrollToElement = useScrollToElement();

  // Create an empty research output row to add a new output
  const createEmptyRow = () => createEmptyResearchOutputRow(columns);

  // Handle adding a new research output
  const handleAddNew = useCallback(() => {
    const emptyRow = createEmptyRow();
    setRows(prev => [...prev, emptyRow]);
    setEditingRowIndex(rows.length); // Edit the newly created row
    setIsAddingNew(true); // Mark as adding new
  }, [rows.length, columns]);

  // Handle edit button click
  const handleEdit = useCallback((index: number) => {
    setEditingRowIndex(index);
    setIsAddingNew(false); // Mark as editing existing
  }, []);

  // Handle delete
  const handleDelete = useCallback(async (index: number) => {
    const msg = t('messages.areYouSureYouWantToDelete');
    if (confirm(msg)) {
      // Calculate the new rows after deletion
      const updatedRows = rows.filter((_, i) => i !== index);
      setRows(updatedRows);

      // If we were editing this row, go back to list view
      if (editingRowIndex === index) {
        setEditingRowIndex(null);
      }
      // Trigger parent page save if onSave callback exists
      if (onSave) {
        await onSave(updatedRows, 'delete');
        scrollToElement('.ro-form-wrapper');
      }
    }
  }, [editingRowIndex, onSave, rows, t]);

  // Handle done editing
  const handleDoneEditing = useCallback(async () => {
    // Clear editing state
    setEditingRowIndex(null);
    setIsAddingNew(false);

    // Trigger parent page save with current rows data
    // Pass rows directly to avoid stale state issues
    if (onSave) {
      await onSave(rows);
    }
  }, [onSave, rows]);

  // Handle cancel (go back to list view, and if it was a new empty row, remove it)
  const handleCancel = useCallback(() => {
    if (editingRowIndex !== null) {
      const editedRow = rows[editingRowIndex];
      // Check if this is an empty row (all answers are empty/default)
      const isEmpty = editedRow?.columns.every(col => {
        const answer = col.answer;
        if (typeof answer === 'string') return !answer.trim();
        if (typeof answer === 'number') return answer === 0;
        if (Array.isArray(answer)) return answer.length === 0;
        if (typeof answer === 'object' && answer !== null) {
          // Check for objects like { value: 0, context: 'kb' }
          return Object.values(answer).every(v => !v || v === 0 || v === 'kb');
        }
        return true;
      });

      if (isEmpty || isAddingNew) {
        // Remove the empty row or new row that was cancelled
        setRows(prev => prev.filter((_, i) => i !== editingRowIndex));
      }
    }
    setEditingRowIndex(null);
    setIsAddingNew(false);
  }, [editingRowIndex, rows, isAddingNew]);

  // Helper to set rows for just the editing row
  const handleSetRows = useCallback((updateFn: React.SetStateAction<ResearchOutputTable[]>) => {
    if (editingRowIndex === null) return;

    setRows(prevRows => {
      const newRows = [...prevRows];
      const updatedEditingRows = typeof updateFn === 'function'
        ? updateFn([newRows[editingRowIndex]])
        : updateFn;

      if (updatedEditingRows.length > 0) {
        newRows[editingRowIndex] = updatedEditingRows[0];
      }
      return newRows;
    });
  }, [editingRowIndex, rows.length]);

  // Automatically show form when there are no rows (i.e., first time adding an answer)
  // Only use delayed effect for normal list mode
  useEffect(() => {
    if (hasInitialized.current) return;

    if (initialViewMode === 'form') {
      // If preview mode and no rows, add an empty row immediately
      if (rows.length === 0) {
        const emptyRow = createEmptyResearchOutputRow(columns);
        setRows([emptyRow]);
      }
      hasInitialized.current = true;
      return;
    }

    // For list mode, wait briefly for async data to load before deciding to show form
    if (rows.length > 0 && initialViewMode === 'list') {
      hasInitialized.current = true;
      return;
    }

    const timer = setTimeout(() => {
      if (!hasInitialized.current && editingRowIndex === null) {
        hasInitialized.current = true;
        if (rows.length === 0) {
          const emptyRow = createEmptyResearchOutputRow(columns);
          setRows([emptyRow]);
        }
        setEditingRowIndex(0);
        setIsAddingNew(true);
      }
    }, 50);

    return () => clearTimeout(timer);
  }, [rows.length, editingRowIndex, columns, initialViewMode]);

  // Handle when all items are deleted
  useEffect(() => {
    // If we've initialized before, rows is now empty, and we're not editing
    if (hasInitialized.current && rows.length === 0 && editingRowIndex === null) {
      handleAddNew();
    }
  }, [rows.length, editingRowIndex]);

  // Notify parent when entering/leaving single-edit view, so that it can
  // hide its own save button, preventing multiple CTAs in the SingleResearchOutputComponent
  useEffect(() => {
    onEditingStateChange?.(editingRowIndex !== null);
  }, [editingRowIndex, onEditingStateChange]);

  // If editing a specific row, show the single form
  if (editingRowIndex !== null) {
    // Create a subset of rows with just the one being edited
    const editingRows = [rows[editingRowIndex]];
    // When adding new: check if there were rows before adding this one
    // When editing: check if there are other rows besides this one
    const hasOtherRows = isAddingNew
      ? editingRowIndex > 0  // If adding at index > 0, there were existing rows
      : rows.length > 1;      // If editing, check if there are other rows

    return (
      <div className={styles.singleEditView}>
        <div className={styles.btnContainer}>
          <h3 className="h3">
            {isAddingNew ? t('headings.addResearchOutput') : t('headings.editResearchOutput')}
          </h3>
        </div>

        <SingleResearchOutputComponent
          columns={columns}
          rows={editingRows}
          setRows={handleSetRows}
          showButtons={true}
          onSave={handleDoneEditing}
          onCancel={handleCancel}
          onDelete={() => handleDelete(editingRowIndex!)}
          isNewEntry={isAddingNew}
          hasOtherRows={hasOtherRows}
          isDisabled={isDisabled}
        />
      </div>
    );
  }

  // Show list view
  return (
    <div className={`${styles.listView} ro-form-wrapper`}>
      <div className={styles.listHeader}>
        <Button
          className="primary small"
          onPress={handleAddNew}
        >
          + {t('buttons.addOutput')}
        </Button>
      </div>

      <ul className={styles.outputList}>
        {rows.map((row, index) => {
          const { title, outputType, repositories } = getRowDisplayInfo(row, columns);

          return (
            <li key={index} className={styles.outputItem}>
              <div className={styles.outputTitle}>
                <h4 className={styles.outputTitleText}>{title}</h4>

                {(outputType || repositories.length > 0) && (
                  <dl className={styles.dList}>
                    {outputType && (
                      <>
                        <dt>{t('definitions.type')}:</dt>
                        <dd className={styles.outputType}>{outputType}</dd>
                      </>
                    )}
                    {repositories.length > 0 && (
                      <>
                        <dt>{t('definitions.repository')}:</dt>
                        <dd>{repositories[0]}</dd>
                      </>
                    )}
                  </dl>
                )}
              </div>

              <div className={styles.outputActions}>
                <Button
                  className={`${styles.editBtn} small secondary`}
                  onPress={() => handleEdit(index)}
                >
                  {Global('buttons.edit')}
                </Button>
                <Button
                  className={`${styles.deleteBtn} small danger`}
                  onPress={() => handleDelete(index)}
                >
                  {Global('buttons.delete')}
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default ResearchOutputAnswerComponent;
