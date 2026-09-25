'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Button } from 'react-aria-components';

import { FormSelect } from '@/components/Form';
import {
  PlanStatus,
  ProjectCollaboratorAccessLevel,
  ProjectFilterOptions,
} from '@/generated/graphql';

import styles from './projectListFilters.module.scss';

// An empty string means "All" for either filter
export interface ProjectListFilterValues {
  status: PlanStatus | '';
  accessLevel: ProjectCollaboratorAccessLevel | '';
}

export const DEFAULT_PROJECT_LIST_FILTERS: ProjectListFilterValues = {
  status: '',
  accessLevel: '',
};

// Only send the filters that are set. With no status, the API returns draft and complete projects (not archived).
export const toProjectFilterOptions = (filters: ProjectListFilterValues): ProjectFilterOptions => ({
  ...(filters.status ? { status: filters.status } : {}),
  ...(filters.accessLevel ? { accessLevel: filters.accessLevel } : {}),
});

export const hasActiveProjectFilters = (filters: ProjectListFilterValues): boolean =>
  Boolean(filters.status || filters.accessLevel);

const STATUS_ORDER = [PlanStatus.Draft, PlanStatus.Complete, PlanStatus.Archived];
const ACCESS_LEVEL_ORDER = [
  ProjectCollaboratorAccessLevel.Primary,
  ProjectCollaboratorAccessLevel.Own,
  ProjectCollaboratorAccessLevel.Edit,
  ProjectCollaboratorAccessLevel.Comment,
];

interface ProjectListFiltersProps {
  filters: ProjectListFilterValues;
  onChange: (filters: ProjectListFilterValues) => void;
  // When provided, a "Clear filters" link is shown after the filters
  onClear?: () => void;
  isDisabled?: boolean;
}

function ProjectListFilters({ filters, onChange, onClear, isDisabled = false }: ProjectListFiltersProps) {
  const t = useTranslations('ProjectListFilters');
  const PlanStatusLabels = useTranslations('ProjectOverview.planStatus');
  const AccessLevels = useTranslations('ProjectsProjectCollaboration.accessLevels');

  const statusOptions = [
    { id: '', name: t('allStatuses') },
    ...STATUS_ORDER.map((status) => ({ id: status, name: PlanStatusLabels(status) })),
  ];

  const accessLevelOptions = [
    { id: '', name: t('allRoles') },
    ...ACCESS_LEVEL_ORDER.map((level) => ({ id: level, name: AccessLevels(level.toLowerCase()) })),
  ];

  return (
    <div className={styles.filters}>
      <FormSelect
        label={t('statusLabel')}
        name="projectStatusFilter"
        items={statusOptions}
        selectedKey={filters.status}
        selectClasses={styles.filterSelect}
        isDisabled={isDisabled}
        onChange={(value) => onChange({ ...filters, status: value as PlanStatus | '' })}
      />
      <FormSelect
        label={t('roleLabel')}
        name="projectRoleFilter"
        items={accessLevelOptions}
        selectedKey={filters.accessLevel}
        selectClasses={styles.filterSelect}
        isDisabled={isDisabled}
        onChange={(value) => onChange({ ...filters, accessLevel: value as ProjectCollaboratorAccessLevel | '' })}
      />
      {onClear && (
        <Button
          className={`${styles.clearFilters} link`}
          onPress={onClear}
          isDisabled={isDisabled}
        >
          {t('clearFilters')}
        </Button>
      )}
    </div>
  );
}

export default ProjectListFilters;
