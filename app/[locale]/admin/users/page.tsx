'use client'

import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useLazyQuery, useQuery } from "@apollo/client/react";
import Papa from 'papaparse';
import {
  Dialog,
  DialogTrigger,
  Modal,
  ModalOverlay,
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
import {
  routePath,
  logECS,
  handleApolloError
} from '@/utils/index';
import { RoleOptions } from '@/lib/constants';
import { useFormatDate } from "@/hooks/useFormatDate";
import styles from './UsersDashboardPage.module.scss';

// Number of records to display per page in the users table
const LIMIT = 10;

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

// For rendering of friendly labels for user roles in the users table
const RoleLabels: Record<string, string> = Object.fromEntries(
  RoleOptions.filter(opt => opt.value !== '').map(opt => [opt.value, opt.label])
);

function OrgUserAccountsPage(): React.ReactElement {
  const formatDate = useFormatDate();
  const errorRef = useRef<HTMLDivElement | null>(null);
  const topRef = useRef<HTMLDivElement>(null);

  const [errors, setErrors] = useState<string[]>([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // State for users data, search term, selected role, sorting, and organization filter
  const [users, setUsers] = useState<UserRow[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<UserRole | ''>('');
  const [sortField, setSortField] = useState<string | undefined>(undefined);
  const [sortDir, setSortDir] = useState<string>('DESC');

  // For filtering organizations (superadmin only)
  const [selectedAffiliationId, setSelectedAffiliationId] = useState<string>('');
  const [orgOptions, setOrgOptions] = useState<{ label: string; value: string }[]>([]);

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [hasNextPage, setHasNextPage] = useState<boolean | null>(false);
  const [hasPreviousPage, setHasPreviousPage] = useState<boolean | null>(false);

  // For delete confirmation modal
  const [isConfirmOpen, setConfirmOpen] = useState(false);

  // Localization
  const usersTrans = useTranslations('Admin.users');
  const Global = useTranslations('Global');

  // GraphQL queries
  const { data: meData } = useQuery(MeDocument);

  // Fetch for paginated users list
  const [fetchUserData, { data: usersData, loading: usersLoading }] = useLazyQuery(UsersDocument, {
    notifyOnNetworkStatusChange: true,
    fetchPolicy: 'no-cache',
  });

  // Fetch all users for download purposes, so no pagination is applied
  // We need to keep this query separate from the paginated users query because they have different loading states and we don't want to 
  // interfere with the paginated users table when downloading all users.
  const [fetchAllUsersForExport, { loading: exportLoading }] = useLazyQuery(UsersDocument, {
    fetchPolicy: 'no-cache',
  });

  const isSuperAdmin = meData?.me?.role === UserRole.Superadmin;

  // This is needed because the GraphQL query returns different field names than the table columns, 
  // so we need to map them for sorting purposes.
  const SORT_FIELD_MAP: Record<string, string> = {
    name: 'u.surName',
    email: 'ue.email',
    role: 'u.role',
    active: 'u.active',
    created: 'u.created',
    lastActivity: 'u.last_sign_in',
    organization: 'a.name',
  };

  // Columns for the users table
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

  // Build export query vars for downloading all users as CSV
  const buildExportVars = () => ({
    term: searchTerm,
    ...(selectedRole ? { role: selectedRole } : {}),
    ...(selectedAffiliationId ? { affiliationId: selectedAffiliationId } : {}),
  });

  // Build the query variables for fetching users based on the current page, search term, role, sorting, 
  // and organization filters
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

  // Fetch users based on page, filters and search term criteria
  const fetchUsers = async ({
    page,
    searchTerm = '',
    role,
    sortField: sortFieldOverride,
    sortDir: sortDirOverride,
    affiliationId,
    context = 'fetchUsers',
  }: {
    page?: number;
    searchTerm?: string;
    role?: UserRole | '';
    sortField?: string;
    sortDir?: string;
    affiliationId?: string;
    context?: string;
  }): Promise<void> => {
    const resolvedPage = page ?? currentPage;
    setErrors([]);
    setCurrentPage(resolvedPage);

    try {
      await fetchUserData({
        variables: buildQueryVars(
          resolvedPage,
          searchTerm,
          role ?? selectedRole,
          sortFieldOverride ?? sortField,
          sortDirOverride ?? sortDir,
          affiliationId ?? selectedAffiliationId
        )
      });
    } catch (err) {
      const { wasRealError, message } = handleApolloError(err, `OrgUserAccountsPage.fetchUsers - ${context}`);
      if (!wasRealError) return; // AbortError — not a real failure, ignore silently

      logECS('error', `OrgUserAccountsPage.fetchUsers - ${context}`, {
        error: err,
        url: { path: routePath('admin.users') },
      });
      setErrors([message]);
      setIsInitialLoad(false);
    }
  };

  // Handle select role filter change
  const handleRoleChange = async (role: UserRole | '') => {
    setSelectedRole(role);
    await fetchUsers({ page: 1, role, context: 'handleRoleChange' });
  };

  // Handle select organization filter change for superadmins
  const handleOrgChange = async (affiliationId: string) => {
    setSelectedAffiliationId(affiliationId);
    await fetchUsers({ page: 1, affiliationId, context: 'handleOrgChange' })
  };


  // Updates the search term state as the user types in the search input. 
  // If the search term is cleared, it fetches all users again to refresh the data.
  const handleSearchInput = async (term: string) => {
    setSearchTerm(term);
    // If the search term is cleared, fetch all users again to refresh the data.
    if (term === '') {
      await fetchUsers({ page: 1, searchTerm: '', context: 'handleSearchInput' });
    }
  }

  // Fetch users based on the current search term, role, and organization filters when the search button is clicked
  const handleSearchSubmit = async () => {
    await fetchUsers({ page: 1, searchTerm, context: 'handleSearchSubmit' });
  };

  // Handle pagination page click
  const handlePageClick = async (page: number) => {
    await fetchUsers({ page, context: 'handlePageClick' });
  };

  // Handle sorting changes from the users table. Updates the sortField and sortDir state, and fetches 
  // the users again with the new sorting applied.
  const onSortChangeHandler = async (newColumns: DmpTableColumnSet) => {
    setColumns(newColumns);
    const activeSort = Array.from(newColumns).find(col => col.allowsSorting && col.direction !== '');
    if (activeSort) {
      const newSortField = activeSort.id;
      const newSortDir = activeSort.direction === 'ascending' ? 'ASC' : 'DESC';
      setSortField(newSortField);
      setSortDir(newSortDir);
      await fetchUsers({ sortField: newSortField, sortDir: newSortDir, context: 'onSortChangeHandler' });
    }
  };

  // Handles download of all filtered users from the users table into a CSV file.
  const handleDownload = async () => {
    setErrors([]);
    const allUsers = [];
    let hasMoreData = true;
    try {
      //const { data } = await fetchAllUsersForExport({ variables: buildExportVars() });

      while (hasMoreData) {
        const { data } = await fetchAllUsersForExport({
          variables: buildExportVars()
        });

        const users = data?.users?.items ?? [];
        hasMoreData = data?.users?.hasNextPage ?? false;

        if (!users.length) break;

        allUsers.push(...users);
      }
      const items = allUsers.filter(Boolean) ?? [];

      if (!items.length) {
        setErrors(['No users found to export.']);
        return;
      }

      const cellMap: Record<string, (user: NonNullable<typeof items[0]>) => string | number> = {
        name: user => [user.givenName, user.surName].filter(Boolean).join(' '),
        email: user => user.email ?? '',
        plans: user => user.plans?.length ?? 0,
        nonTestPlans: user => user.plans?.filter(plan => plan?.project?.isTestProject === false).length ?? 0,
        orcid: user => user.orcid ?? '',
        sso: user => user.ssoId ?? '',
        active: user => user.active ? 'Yes' : 'No',
        role: user => RoleLabels[user.role] ?? user.role,
        organization: user => user.affiliation?.displayName ?? '',
        created: user => user.created ? formatDate(user.created) : '',
        lastActivity: user => user.last_sign_in ? formatDate(user.last_sign_in) : '',
      };

      // Define a separate set of columns for export, since it includes additional fields like ORCID and SSO
      const exportColumns: { id: string; name: string }[] = [
        { id: 'name', name: 'Name' },
        { id: 'email', name: 'Email' },
        { id: 'plans', name: 'Plans' },
        { id: 'nonTestPlans', name: 'Non-test Plans' },
        { id: 'orcid', name: 'ORCID' },
        { id: 'sso', name: 'SSO' },
        { id: 'active', name: 'Active' },
        { id: 'role', name: 'Role' },
        ...(isSuperAdmin ? [{ id: 'organization', name: 'Organization' }] : []),
        { id: 'created', name: 'Created' },
        { id: 'lastActivity', name: 'Activity' },
      ];

      const rows = items
        .filter((user): user is NonNullable<typeof user> => user !== null)
        .map(user =>
          Object.fromEntries(
            exportColumns.map(col => [
              col.name,
              cellMap[col.id]?.(user) ?? '',
            ])
          )
        );

      const csv = Papa.unparse(rows, { header: true });
      // Add BOM(Byte Order Mark — it's a special invisible character (U+FEFF) placed at the very start of a text file to
      // signal how the file is encoded.) This is needed for Excel
      const blob = new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);

      // Some browsers (like Safari) require the link to be added to the DOM before triggering the download.
      const link = document.createElement('a');
      link.href = url;
      link.download = `users-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);

      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      const { wasRealError, message } = handleApolloError(err, `OrgUserAccountsPage.handleDownload`);
      if (!wasRealError) return; // AbortError — not a real failure, ignore silently

      logECS('error', 'OrgUserAccountsPage.handleDownload', {
        error: err,
        url: { path: routePath('admin.users') },
      });
      setErrors([message]);
      setIsInitialLoad(false);
      logECS('error', 'OrgUserAccountsPage.handleDownload', {
        error: err,
        url: { path: routePath('admin.users') },
      });
    }
  };

  // Transform the GraphQL user data into the format needed for the table
  const transformUsers = (data: typeof usersData): UserRow[] => {
    return data?.users?.items
      ?.filter((user): user is NonNullable<typeof user> => user !== null)
      .map((user) => {
        const fullName = [user.givenName, user.surName].filter(Boolean).join(' ');
        return {
          id: user.id?.toString(),
          name: (
            <Link
              href={routePath('admin.users.manage', { userId: String(user.id) })}
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

  // Fetch users on initial load
  useEffect(() => {
    fetchUsers({ page: currentPage, searchTerm: '' });
  }, []);

  // Update users state when usersData changes
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

  // Set organization options for superadmins based on the fetched users
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

  // Sync columns state when initialColumns changes (i.e. when isSuperAdmin resolves)
  useEffect(() => {
    setColumns(initialColumns);
  }, [initialColumns]);

  // Add a loading state guard before rendering pageTools to avoid flashing of the organization select field for superadmins
  const isSuperAdminResolved = meData?.me !== undefined;
  // If SuperAdmins haven't selected an organization, we block the export button to avoid exporting all users across all 
  // organizations.
  const isExportBlocked = isSuperAdmin && !selectedAffiliationId;
  return (
    <>
      <PageHeader
        title={usersTrans('title')}
        description={usersTrans('description')}
        showBackButton={true}
        breadcrumbs={
          <Breadcrumbs>
            <Breadcrumb><Link href={routePath('admin.index')}>{usersTrans('admin')}</Link></Breadcrumb>
            <Breadcrumb>{usersTrans('title')}</Breadcrumb>
          </Breadcrumbs>
        }
        actions={
          <>
            <div className="button-container">
              {/**SuperAdmins need to select an organization before downloading */}
              {isExportBlocked ? (
                <DialogTrigger key="download-blocked">
                  <Button
                    type="button"
                    aria-disabled={true}
                  >
                    {usersTrans('buttons.download')}
                  </Button>
                  <Popover placement="bottom" className="popover--inverse">
                    <Dialog
                      aria-label={usersTrans('messages.disabledDownloadMessage')}
                      className="popoverContent"
                    >
                      {usersTrans('messages.disabledDownloadMessage')}
                    </Dialog>
                  </Popover>
                </DialogTrigger>
              ) : (
                <DialogTrigger isOpen={isConfirmOpen} onOpenChange={setConfirmOpen} key="download-confirm">
                  <Button className="button--secondary">{usersTrans('buttons.download')}</Button>
                  <ModalOverlay>
                    <Modal>
                      <Dialog>
                        {({ close }) => (
                          <>
                            <h3>{usersTrans('headings.confirmDownload')}</h3>
                            <p>{usersTrans('downloadWarning')}</p>
                            <div className="button-container">
                              <Button
                                autoFocus onPress={close}
                              >
                                {Global('buttons.cancel')}
                              </Button>
                              <Button
                                className="button--primary"
                                isDisabled={exportLoading}
                                onPress={async () => {
                                  close();
                                  await handleDownload();
                                }}
                              >
                                {Global('buttons.continue')}
                              </Button>
                            </div>
                          </>
                        )}
                      </Dialog>
                    </Modal>
                  </ModalOverlay>
                </DialogTrigger>
              )
              }
            </div>
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
                  {usersTrans('buttons.searchLabel')}
                </Button>

                <Select
                  name="permission"
                  value={selectedRole}
                  className={`react-aria-Select ${styles.roleSelect}`}
                  onChange={(key) => handleRoleChange(key as UserRole | '')}
                >
                  <Label>{usersTrans('tools.permissionLabel')}</Label>
                  <Button
                    className={styles.roleSelectButton}
                  >
                    <SelectValue />
                    <span aria-hidden="true" className={styles.selectArrow}>▼</span>
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
                    <Button className={styles.organizationSelectButton}>
                      <SelectValue />
                      <span aria-hidden="true" className={styles.selectArrow}>▼</span>
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
