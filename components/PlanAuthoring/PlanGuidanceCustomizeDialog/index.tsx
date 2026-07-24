"use client";

import React, { useEffect, useState } from "react";
import {
  Button,
  Dialog,
  Heading,
  Input,
  Label,
  Modal,
  ModalOverlay,
  TextField,
} from "react-aria-components";
import { DmpIcon } from "@/components/Icons";
import type { PlanGuidanceOrgOption } from "../model";
import styles from "../PlanAuthoring.module.scss";

interface PlanGuidanceCustomizeDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedOrgIds: string[];
  lockedOrgIds?: string[];
  availableOrgs: PlanGuidanceOrgOption[];
  onSearch: (term: string) => Promise<PlanGuidanceOrgOption[]>;
  onSave: (orgIds: string[]) => Promise<void>;
}

export default function PlanGuidanceCustomizeDialog({
  isOpen,
  onOpenChange,
  selectedOrgIds,
  lockedOrgIds = [],
  availableOrgs,
  onSearch,
  onSave,
}: PlanGuidanceCustomizeDialogProps) {
  const [term, setTerm] = useState("");
  const [results, setResults] = useState<PlanGuidanceOrgOption[]>([]);
  const [draftIds, setDraftIds] = useState<string[]>(selectedOrgIds);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setDraftIds(selectedOrgIds);
      setResults(availableOrgs.filter((org) => !selectedOrgIds.includes(org.id)));
      setTerm("");
    }
  }, [availableOrgs, isOpen, selectedOrgIds]);

  const selectedOrgs = availableOrgs.filter((org) => draftIds.includes(org.id));

  return (
    <ModalOverlay
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      isDismissable
      className={styles.modalOverlay}
    >
      <Modal className={styles.modal}>
        <Dialog className={styles.dialog}>
          <div className={styles.dialogHeader}>
            <Heading
              slot="title"
              className={styles.dialogTitle}
            >
              Customize Best Practice
            </Heading>
            <Button
              className={styles.dialogCloseButton}
              onPress={() => onOpenChange(false)}
            >
              <DmpIcon
                icon="close"
                width={16}
                height={16}
                fill="currentColor"
              />
              Close
            </Button>
          </div>

          <div className={styles.dialogBody}>
            <section className={styles.dialogSection}>
              <h3>Currently displaying</h3>
              <p>
                These sources apply across the plan, not just this question.
              </p>
              <ul className={styles.selectedOrgs}>
                {selectedOrgs.map((org) => {
                  const locked = lockedOrgIds.includes(org.id);
                  return (
                    <li
                      key={org.id}
                      className={styles.orgChip}
                    >
                      <span>{org.label}</span>
                      {locked ? (
                        <span
                          className={styles.orgLocked}
                          title="Required by your organization"
                        >
                          <DmpIcon
                            icon="lock"
                            width={13}
                            height={13}
                            fill="currentColor"
                          />
                          <span className="hidden-accessibly">Locked</span>
                        </span>
                      ) : (
                        <Button
                          className={styles.orgChipRemove}
                          aria-label={`Remove ${org.label}`}
                          onPress={() =>
                            setDraftIds((current) =>
                              current.filter((id) => id !== org.id)
                            )
                          }
                        >
                          <DmpIcon
                            icon="close"
                            width={12}
                            height={12}
                            fill="currentColor"
                          />
                        </Button>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>

            <section className={styles.dialogSection}>
              <h3>Add more</h3>
              <p>
                Search by research organization, funder name, or related
                keywords.
              </p>
              <div className={styles.searchRow}>
                <TextField className={styles.searchField}>
                  <Label>Search by name</Label>
                  <Input
                    value={term}
                    onChange={(event) => setTerm(event.target.value)}
                    placeholder="Enter name…"
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        void (async () => {
                          setSearching(true);
                          try {
                            const next = await onSearch(term);
                            setResults(
                              next.filter((org) => !draftIds.includes(org.id))
                            );
                          } finally {
                            setSearching(false);
                          }
                        })();
                      }
                    }}
                  />
                </TextField>
                <Button
                  className="react-aria-Button react-aria-Button--secondary"
                  onPress={async () => {
                    setSearching(true);
                    try {
                      const next = await onSearch(term);
                      setResults(
                        next.filter((org) => !draftIds.includes(org.id))
                      );
                    } finally {
                      setSearching(false);
                    }
                  }}
                  isDisabled={searching}
                >
                  {searching ? "Searching…" : "Search"}
                </Button>
              </div>
              <ul className={styles.resultsList}>
                {results.map((org) => (
                  <li key={org.id}>
                    <Button
                      className="button-as-link"
                      onPress={() =>
                        setDraftIds((current) =>
                          current.includes(org.id)
                            ? current
                            : [...current, org.id]
                        )
                      }
                    >
                      + {org.label}
                    </Button>
                  </li>
                ))}
                {!searching && results.length === 0 ? (
                  <li className={styles.commentsEmpty}>No matching sources.</li>
                ) : null}
              </ul>
            </section>
          </div>

          <div className={styles.dialogActions}>
            <Button
              className={styles.dialogSecondaryButton}
              onPress={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              onPress={async () => {
                setSaving(true);
                try {
                  await onSave(draftIds);
                  onOpenChange(false);
                } finally {
                  setSaving(false);
                }
              }}
              isDisabled={saving}
            >
              {saving ? "Saving…" : "Save guidance sources"}
            </Button>
          </div>
        </Dialog>
      </Modal>
    </ModalOverlay>
  );
}
