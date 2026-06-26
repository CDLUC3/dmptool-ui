'use client'

import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useLazyQuery, useQuery } from "@apollo/client/react";
import {
  FieldError,
  Breadcrumb,
  Breadcrumbs,
  Button,
  Link,
  ListBox,
  ListBoxItem,
  Label,
  Popover,
  Select,
  SelectValue,
} from 'react-aria-components';

// GraphQL
import {
  MeDocument,
  UsersDocument,
  UserRole,
} from "@/generated/graphql";

// Components
import {
  ContentContainer,
  LayoutContainer,
} from '@/components/Container';
import FormInput from '@/components/Form/FormInput';
import {
  DmpTable,
  DmpTableColumnSet,
} from '@/components/Table';
import PageHeader from '@/components/PageHeader';
import Pagination from '@/components/Pagination';
import ErrorMessages from '@/components/ErrorMessages';
import Loading from '@/components/Loading';

// Utils and other
import styles from './UsersDashboardPage.module.scss';
import { routePath } from '@/utils/routes';
import { logECS } from '@/utils/index';
import { handleApolloError } from '@/utils/apolloErrorHandler';
import { useFormatDate } from "@/hooks/useFormatDate";

const LIMIT = 5;

interface UserRow {
  id: string | null | undefined;
  name: React.ReactNode;
  email: string;
  plans: number;
  active: string;
  role: string;
  created: string;
  lastActivity: string | null;
  organization: string | null;
}

const RoleOptions: { label: string; value: UserRole | '' }[] = [
  { label: 'All Roles', value: '' },
  { label: 'Super Admin', value: UserRole.Superadmin },
  { label: 'Admin', value: UserRole.Admin },
  { label: 'User', value: UserRole.Researcher },
];

function OrgUserAccountsPage(): React.ReactElement {
  const formatDate = useFormatDate();

  const errorRef = useRef<HTMLDivElement | null>(null);
  const topRef = useRef<HTMLDivElement>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const [users, setUsers] = useState<UserRow[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<UserRole | ''>('');
  const [sortField, setSortField] = useState<string | undefined>(undefined);
  const [sortDir, setSortDir] = useState<string>('DESC');

  // For filtering organizations (superadmin only)
  const [selectedAffiliationId, setSelectedAffiliationId] = useState<string>('');
  const [orgOptions, setOrgOptions] = useState<{ label: string; value: string }[]>([]);

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [hasNextPage, setHasNextPage] = useState<boolean | null>(false);
  const [hasPreviousPage, setHasPreviousPage] = useState<boolean | null>(false);

  // Localization
  const usersTrans = useTranslations('Admin.users');
  const Global = useTranslations('Global');

  // GraphQL queries
  const { data: meData } = useQuery(MeDocument);
  const [fetchUserData, { data: usersData, loading: usersLoading, error: usersError }] = useLazyQuery(UsersDocument, {
    notifyOnNetworkStatusChange: true,
    fetchPolicy: 'no-cache',
  });

  const isSuperAdmin = meData?.me?.role === UserRole.Superadmin;
  const SORT_FIELD_MAP: Record<string, string> = {
    name: 'u.surName',
    email: 'ue.email',
    role: 'u.role',
    active: 'u.active',
    created: 'u.created',
    lastActivity: 'u.last_sign_in',
    organization: 'a.name',
  };
  const initialColumns = useMemo<DmpTableColumnSet>(() => [
    { id: 'name', name: 'Name', isRowHeader: true, allowsSorting: true, direction: "" as const },
    { id: 'email', name: 'Email', isRowHeader: true, allowsSorting: true, direction: "" as const },
    { id: 'plans', name: 'Plans', isRowHeader: true, allowsSorting: false, direction: "" as const },
    { id: 'active', name: 'Active', isRowHeader: true, allowsSorting: true, direction: "" as const },
    { id: 'role', name: 'Role', isRowHeader: true, allowsSorting: true, direction: "" as const },
    ...(isSuperAdmin ? [{ id: 'organization', name: 'Organization', isRowHeader: true, allowsSorting: true, direction: "" as const }] : []),
    { id: 'created', name: 'Created', isRowHeader: true, allowsSorting: true, direction: "" as const },
    { id: 'lastActivity', name: 'Activity', isRowHeader: true, allowsSorting: true, direction: "" as const },
  ], [isSuperAdmin]);

  const [columns, setColumns] = useState<DmpTableColumnSet>(initialColumns);


  const buildQueryVars = (
    page: number,
    term: string,
    role: UserRole | '',
    sortField?: string,
    sortDir?: string,
    affiliationId?: string
  ) => ({
    paginationOptions: {
      offset: (page - 1) * LIMIT,
      limit: LIMIT,
      type: "OFFSET",
      sortDir: sortDir ?? "DESC",
      sortField: sortField ? SORT_FIELD_MAP[sortField] : undefined,
    },
    term,
    ...(role ? { role } : {}),
    ...(affiliationId ? { affiliationId } : {}),
  });


  const RoleLabels: Record<string, string> = Object.fromEntries(
    RoleOptions.filter(opt => opt.value !== '').map(opt => [opt.value, opt.label])
  );

  const handleRoleChange = async (role: UserRole | '') => {
    setErrors([]);
    setSelectedRole(role);
    setCurrentPage(1);
    try {
      await fetchUserData({ variables: buildQueryVars(1, searchTerm, role, sortField, sortDir, selectedAffiliationId) });
    } catch (err) {
      logECS('error', 'OrgUserAccountsPage.handleRoleChange', {
        error: err,
        url: { path: routePath('admin.users') },
      });
      setErrors(['An error occurred while filtering. Please try again.']);
    }
  };

  const handleOrgChange = async (affiliationId: string) => {
    setErrors([]);
    setSelectedAffiliationId(affiliationId);
    setCurrentPage(1);
    try {
      await fetchUserData({
        variables: buildQueryVars(1, searchTerm, selectedRole, sortField, sortDir, affiliationId),
      });
    } catch (err) {
      logECS('error', 'OrgUserAccountsPage.handleOrgChange', {
        error: err,
        url: { path: routePath('admin.users') },
      });
      setErrors(['An error occurred while filtering by organization. Please try again.']);
    }
  };


  // Just updates the search term
  const handleSearchInput = async (term: string) => {
    setSearchTerm(term);
    // If the search term is cleared, fetch all users again to refresh the data.
    if (term === '') {
      await fetchUserData({ variables: buildQueryVars(1, '', selectedRole, sortField, sortDir) });
    }
  }

  // Only fires when the button is pressed
  const handleSearchSubmit = async () => {
    setErrors([]);
    setCurrentPage(1);
    try {
      await fetchUserData({ variables: buildQueryVars(1, searchTerm, selectedRole, sortField, sortDir, selectedAffiliationId) });
    } catch (err) {
      logECS('error', 'OrgUserAccountsPage.handleSearchSubmit', {
        error: err,
        url: { path: routePath('admin.users') },
      });
      setErrors(['An error occurred while searching. Please try again.']);
    }
  };

  // Handle pagination page click
  const handlePageClick = async (page: number) => {
    await fetchUserData({
      variables: buildQueryVars(page, searchTerm, selectedRole, sortField, sortDir, selectedAffiliationId)
    });
  };

  const onSortChangeHandler = async (newColumns: DmpTableColumnSet) => {
    setColumns(newColumns);
    const activeSort = Array.from(newColumns).find(col => col.allowsSorting && col.direction !== '');
    if (activeSort) {
      const newSortField = activeSort.id;
      const newSortDir = activeSort.direction === 'ascending' ? 'ASC' : 'DESC';
      setSortField(newSortField);
      setSortDir(newSortDir);
      try {
        await fetchUserData({ variables: buildQueryVars(currentPage, searchTerm, selectedRole, newSortField, newSortDir) });
      } catch (err) {
        logECS('error', 'OrgUserAccountsPage.onSortChangeHandler', {
          error: err,
          url: { path: routePath('admin.users') },
        });
        setErrors(['An error occurred while sorting. Please try again.']);
      }
    }
  };

  // Fetch users based on page, filters and search term criteria
  const fetchUsers = async ({
    page,
    searchTerm = ''
  }: {
    page?: number;
    searchTerm?: string;
  }): Promise<void> => {
    if (page) {
      setCurrentPage(page);
    }

    try {
      await fetchUserData({
        variables: buildQueryVars(page ?? currentPage, searchTerm, selectedRole, sortField, sortDir, selectedAffiliationId)
      });
    } catch (err) {
      handleApolloError(err, 'OrgUserAccountsPage.fetchUsers');
    }
  };

  const transformUsers = (data: typeof usersData): UserRow[] => {
    console.log("***Users data***", data);
    return data?.users?.items
      ?.filter((user): user is NonNullable<typeof user> => user !== null)
      .map((user) => {
        const fullName = [user.givenName, user.surName].filter(Boolean).join(' ');
        return {
          id: user.id?.toString(),
          name: (
            <Link
              href={routePath('admin.users.manage', { userId: String(user.id), projectId: String(user.plans?.[0]?.project?.id ?? '') })}
              aria-label={usersTrans('manageUser', { name: fullName })}
            >
              {fullName}
            </Link>
          ),
          email: user.email ?? '',
          plans: user.plans?.length ?? 0,
          active: user.active ? 'Yes' : 'No',
          role: RoleLabels[user.role] || user.role,
          created: user.created ? formatDate(user.created) : '',
          lastActivity: user.last_sign_in ? formatDate(user.last_sign_in) : null,
          organization: user.affiliation?.displayName || null,
        };
      }) ?? [];
  };

  // Load on mount
  useEffect(() => {
    fetchUsers({ page: currentPage, searchTerm: '' });
  }, []);

  useEffect(() => {
    if (usersData?.users?.items) {
      setIsInitialLoad(false);
      const totalCount = usersData.users.totalCount ?? 0;
      setTotalPages(Math.ceil(totalCount / LIMIT));
      setHasNextPage(usersData.users.hasNextPage ?? false);
      setHasPreviousPage(usersData.users.hasPreviousPage ?? false);

      const transformed = transformUsers(usersData);
      setUsers(transformed);
    }
  }, [usersData]);

  useEffect(() => {
    if (usersData?.users?.items && isSuperAdmin) {
      const newOrgs = usersData.users.items
        .filter((u): u is NonNullable<typeof u> => u !== null)
        .map(u => u.affiliation)
        .filter((a): a is NonNullable<typeof a> => !!a?.uri && !!a?.displayName);

      setOrgOptions(prev => {
        const seen = new Map(prev.map(o => [o.value, o]));
        for (const a of newOrgs) {
          if (!seen.has(a.uri!)) {
            seen.set(a.uri!, { label: a.displayName!, value: a.uri! });
          }
        }
        return Array.from(seen.values()).sort((a, b) => a.label.localeCompare(b.label));
      });
    }
  }, [usersData, isSuperAdmin]);

  useEffect(() => {
    if (usersError) {
      logECS('error', 'OrgUserAccountsPage', {
        error: usersError,
        url: { path: routePath('admin.users') },
      });
      setErrors([usersError.message]);
    }
  }, [usersError]);

  // Sync columns state when initialColumns changes (i.e. when isSuperAdmin resolves)
  useEffect(() => {
    setColumns(initialColumns);
  }, [initialColumns]);

  // Add a loading state guard before rendering pageTools
  const isSuperAdminResolved = meData?.me !== undefined;

  return (
    <>
      <PageHeader
        title={usersTrans('title')}
        description={usersTrans('description')}
        showBackButton={true}
        breadcrumbs={
          <Breadcrumbs>
            <Breadcrumb><Link href={routePath('admin.index')}>Admin</Link></Breadcrumb>
            <Breadcrumb>{usersTrans('title')}</Breadcrumb>
          </Breadcrumbs>
        }
        actions={
          <>
            <Link
              href="#"
              className="button-link button--primary"
            >
              {usersTrans('buttons.createUserLabel')}
            </Link>
          </>
        }
        className="page-organization-users-dashboard-header"
      />
      <ErrorMessages errors={errors} ref={errorRef} />

      <LayoutContainer>
        <ContentContainer>
          <div className={styles.pageTools} role="search" ref={topRef}>
            {!isSuperAdminResolved ? null : (
              <>
                <FormInput
                  name="search"
                  type="search"
                  data-testid="search-input"
                  className={styles.searchInput}
                  label={usersTrans('tools.searchLabel')}
                  onChange={e => handleSearchInput(e.target.value)}
                  value={searchTerm}
                />

                <Button
                  onPress={handleSearchSubmit}
                  isDisabled={usersLoading}
                  className={styles.searchButton}
                >
                  {usersLoading ? Global('buttons.searching') : usersTrans('buttons.searchLabel')}
                </Button>

                <Select
                  name="permission"
                  value={selectedRole}
                  className={`react-aria-Select ${styles.roleSelect}`}
                  onChange={(key) => handleRoleChange(key as UserRole | '')}
                >
                  <Label>{usersTrans('tools.permissionLabel')}</Label>
                  <Button>
                    <SelectValue />
                    <span aria-hidden="true">▼</span>
                  </Button>
                  <Popover>
                    <ListBox>
                      {RoleOptions.map((opt) => (
                        <ListBoxItem key={opt.value} id={opt.value}>
                          {opt.label}
                        </ListBoxItem>
                      ))}
                    </ListBox>
                  </Popover>
                  <FieldError />
                </Select>

                {isSuperAdmin && (
                  <Select
                    name="organization"
                    value={selectedAffiliationId}
                    className={`react-aria-Select ${styles.organizationSelect}`}
                    onChange={(key) => handleOrgChange(key as string)}
                  >
                    <Label>{usersTrans('tools.organizationLabel')}</Label>
                    <Button>
                      <SelectValue />
                      <span aria-hidden="true">▼</span>
                    </Button>
                    <Popover>
                      <ListBox>
                        <ListBoxItem id="">All Organizations</ListBoxItem>
                        {orgOptions.map((opt) => (
                          <ListBoxItem key={opt.value} id={opt.value}>
                            {opt.label}
                          </ListBoxItem>
                        ))}
                      </ListBox>
                    </Popover>
                    <FieldError />
                  </Select>
                )}
              </>
            )}
          </div>

          {isInitialLoad
            ? <Loading message={Global('buttons.loading')} />
            : <DmpTable
              label={usersTrans('userTable.label')}
              className={styles.userList}
              columnData={columns}
              rowData={users}
              onDmpSortChange={onSortChangeHandler}
            />
          }

          {!usersLoading && usersData && users.length === 0 && (
            <p>{usersTrans('userTable.noResults')}</p>
          )}

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            hasPreviousPage={hasPreviousPage}
            hasNextPage={hasNextPage}
            handlePageClick={handlePageClick}
          />
        </ContentContainer>
      </LayoutContainer>
    </>
  );
}

export default OrgUserAccountsPage;
