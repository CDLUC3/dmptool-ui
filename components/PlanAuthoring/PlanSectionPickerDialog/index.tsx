"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Button,
  Dialog,
  Input,
  Modal,
  ModalOverlay,
} from "react-aria-components";
import type { PlanSectionDefinition } from "../model";
import { sectionKey } from "../model";
import { useSectionPickerShortcutLabel } from "../useSectionPickerShortcut";
import styles from "./PlanSectionPickerDialog.module.scss";

interface PlanSectionPickerDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  sections: PlanSectionDefinition[];
  activeSectionKey: string | null;
  onSelect: (section: PlanSectionDefinition) => void;
}

export default function PlanSectionPickerDialog({
  isOpen,
  onOpenChange,
  sections,
  activeSectionKey,
  onSelect,
}: PlanSectionPickerDialogProps) {
  const t = useTranslations("PlanAuthoring");
  const Global = useTranslations("Global");
  const [term, setTerm] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const listRef = useRef<HTMLUListElement | null>(null);
  const shortcutLabel = useSectionPickerShortcutLabel();

  const filtered = useMemo(() => {
    const normalized = term.trim().toLowerCase();
    if (!normalized) {
      return sections;
    }
    return sections.filter((section) =>
      section.title.toLowerCase().includes(normalized)
    );
  }, [sections, term]);

  // On open, start the highlight on the current section; when the search
  // term changes, snap back to the first match.
  useEffect(() => {
    if (!isOpen) {
      return;
    }
    if (term.trim()) {
      setHighlightedIndex(0);
      return;
    }
    const currentIndex = filtered.findIndex(
      (section) => sectionKey(section.identity) === activeSectionKey
    );
    setHighlightedIndex(Math.max(currentIndex, 0));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, term]);

  // Keep the highlighted row visible while arrowing through a long list.
  useEffect(() => {
    const item = listRef.current?.querySelector<HTMLElement>(
      '[data-highlighted="true"]'
    );
    item?.scrollIntoView({ block: "nearest" });
  }, [highlightedIndex, filtered]);

  const close = () => {
    onOpenChange(false);
    setTerm("");
  };

  const selectSection = (section: PlanSectionDefinition) => {
    onSelect(section);
    close();
  };

  const onSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (filtered.length === 0) {
      return;
    }
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        setHighlightedIndex((index) => (index + 1) % filtered.length);
        break;
      case "ArrowUp":
        event.preventDefault();
        setHighlightedIndex(
          (index) => (index - 1 + filtered.length) % filtered.length
        );
        break;
      case "Home":
        event.preventDefault();
        setHighlightedIndex(0);
        break;
      case "End":
        event.preventDefault();
        setHighlightedIndex(filtered.length - 1);
        break;
      case "Enter": {
        event.preventDefault();
        const section = filtered[highlightedIndex] ?? filtered[0];
        if (section) {
          selectSection(section);
        }
        break;
      }
      default:
        break;
    }
  };

  return (
    <ModalOverlay
      isDismissable
      isOpen={isOpen}
      onOpenChange={(open) => {
        onOpenChange(open);
        if (!open) {
          setTerm("");
        }
      }}
      className={styles.pickerOverlay}
    >
      <Modal className={styles.pickerModal}>
        <Dialog
          aria-label={t("sectionPicker.switchSectionAria")}
          className={styles.picker}
        >
          <div className={styles.pickerSearchRow}>
            <span
              className={styles.pickerSearchIcon}
              aria-hidden="true"
            >
              ⌕
            </span>
            <Input
              autoFocus
              value={term}
              onChange={(event) => setTerm(event.target.value)}
              onKeyDown={onSearchKeyDown}
              placeholder={t("sectionPicker.searchPlaceholder")}
              aria-label={t("sectionPicker.searchAria")}
              aria-activedescendant={
                filtered[highlightedIndex]
                  ? `picker-option-${sectionKey(filtered[highlightedIndex].identity)}`
                  : undefined
              }
              className={styles.pickerSearchInput}
            />
            <Button
              className={styles.pickerCloseButton}
              aria-label={Global("buttons.close")}
              onPress={close}
            >
              ×
            </Button>
          </div>

          <ul
            ref={listRef}
            className={styles.pickerList}
            role="list"
          >
            {filtered.map((section, index) => {
              const key = sectionKey(section.identity);
              const answered = section.questions.filter(
                (q) => q.hasAnswer
              ).length;
              const total = section.questions.length;
              const complete = total > 0 && answered === total;
              const isCurrent = key === activeSectionKey;
              const isHighlighted = index === highlightedIndex;
              const originalIndex = sections.findIndex(
                (candidate) => sectionKey(candidate.identity) === key
              );
              return (
                <li key={key}>
                  <Button
                    id={`picker-option-${key}`}
                    className={styles.pickerItem}
                    data-current={isCurrent}
                    data-highlighted={isHighlighted}
                    onPress={() => selectSection(section)}
                    onHoverStart={() => setHighlightedIndex(index)}
                    aria-current={isCurrent ? "true" : undefined}
                  >
                    <span className={styles.pickerItemIndex}>
                      {originalIndex + 1}
                    </span>
                    <span className={styles.pickerItemTitle}>
                      {section.title}
                    </span>
                    <span className={styles.pickerItemCount}>
                      {complete ? (
                        <span
                          className={styles.pickerItemCheck}
                          aria-hidden="true"
                        >
                          ✓
                        </span>
                      ) : null}
                      {answered}/{total}
                    </span>
                    {isCurrent ? (
                      <span className={styles.pickerCurrentBadge}>
                        {t("sectionPicker.current")}
                      </span>
                    ) : (
                      <span
                        className={styles.pickerEnterHint}
                        aria-hidden="true"
                      >
                        ↵
                      </span>
                    )}
                  </Button>
                </li>
              );
            })}
            {filtered.length === 0 ? (
              <li className={styles.pickerEmpty}>
                {t("sectionPicker.noSectionsMatch")}
              </li>
            ) : null}
          </ul>

          <div
            className={styles.pickerFooter}
            aria-hidden="true"
          >
            <span>{t("sectionPicker.navigateHint")}</span>
            <span>{t("sectionPicker.jumpHint")}</span>
            <span>{t("sectionPicker.escHint")}</span>
            <span className={styles.pickerFooterShortcut}>{shortcutLabel}</span>
          </div>
        </Dialog>
      </Modal>
    </ModalOverlay>
  );
}
