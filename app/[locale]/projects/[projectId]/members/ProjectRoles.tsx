'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';

import {
  Button,
  Checkbox,
  Link,
} from "react-aria-components";
import { MemberRole } from '@/generated/graphql';
import { CheckboxGroupComponent } from "@/components/Form";
import Loading from '@/components/Loading';

// Utils
import styles from './ProjectsProjectMembers.module.scss';

interface RolesInterface {
  roles: string[];
  handleCheckboxChange: (newValues: string[]) => void;
  isInvalid?: boolean;
  errorMessage?: string;
  memberRoles: MemberRole[];
  isLoading?: boolean;
  hasLoadError?: boolean;
  onRetry?: () => void;
}

const isNoRoleAssigned = (label: string): boolean => /^no\s+role\b/i.test(label.trim());

const ProjectRoles = ({
  roles,
  handleCheckboxChange,
  isInvalid,
  errorMessage,
  memberRoles,
  isLoading = false,
  hasLoadError = false,
  onRetry,
}: RolesInterface) => {
  // Translation keys
  const Global = useTranslations('Global');
  const t = useTranslations('ProjectsProjectMembersSearch');

  const sortedMemberRoles = useMemo(() => (
    [...memberRoles].sort((firstRole, secondRole) => {
      const firstIsNoRole = isNoRoleAssigned(firstRole.label);
      const secondIsNoRole = isNoRoleAssigned(secondRole.label);

      if (firstIsNoRole && !secondIsNoRole) return 1;
      if (!firstIsNoRole && secondIsNoRole) return -1;
      return firstRole.label.localeCompare(secondRole.label);
    })
  ), [memberRoles]);

  const rolesDescription = (
    <>
      <p>{t('memberRolesDescription.selection')}</p>
      <p>{t('memberRolesDescription.credit')}</p>
      <p>
        <Link href="https://credit.niso.org/" target="_blank" rel="noopener noreferrer">
          {t('links.learnMoreAboutCreditTaxonomy')}
          <span className="hidden-accessibly">({Global('opensInNewTab')})</span>
        </Link>
      </p>
    </>
  );

  const handleRoleChange = (newValues: string[]) => {
    const noRoleId = sortedMemberRoles
      .find((role) => isNoRoleAssigned(role.label))
      ?.id
      ?.toString();

    if (!noRoleId || !newValues.includes(noRoleId)) {
      handleCheckboxChange(newValues);
      return;
    }

    if (!roles.includes(noRoleId)) {
      handleCheckboxChange([noRoleId]);
      return;
    }

    handleCheckboxChange(newValues.filter((roleId) => roleId !== noRoleId));
  };

  return (
    <>
      <div className={styles.memberRoles}>
        <CheckboxGroupComponent
          name="memberRoles"
          value={roles}
          checkboxGroupLabel={t('labels.definedRole')}
          checkboxGroupDescription={rolesDescription}
          onChange={handleRoleChange}
          isRequired={false}
          isRequiredVisualOnly={true}
          isInvalid={isInvalid}
          errorMessage={errorMessage}
        >
          {isLoading ? (
            <Loading
              variant="inline"
              message={t('messaging.loadingRoles')}
            />
          ) : hasLoadError ? (
            <div role="alert">
              <p>{t('messaging.errors.projectRolesLoadError')}</p>
              {onRetry && (
                <Button type="button" className="secondary" onPress={onRetry}>
                  {t('buttons.retryRoles')}
                </Button>
              )}
            </div>
          ) : (
            sortedMemberRoles.map((role, index) => (
              <Checkbox key={role?.id ?? index} value={role?.id?.toString() ?? ''} aria-label={role.label}>
                <div className="checkbox">
                  <svg viewBox="0 0 18 18" aria-hidden="true">
                    <polyline points="1 9 7 14 15 4" />
                  </svg>
                </div>
                <div className="">
                  <span>
                    {role.label}
                  </span>

                </div>
              </Checkbox>
            ))
          )}
        </CheckboxGroupComponent>

      </div>

    </>
  );
};

export default ProjectRoles;
