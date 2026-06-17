'use client'

import React, { useEffect, useState, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { useLazyQuery } from "@apollo/client/react";
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

const initialColumns = [
  { id: 'id', name: 'id', isRowHeader: false },
  { id: 'name', name: 'Name', isRowHeader: true, allowsSorting: true, direction: "" as const },
  { id: 'email', name: 'Email', isRowHeader: true, allowsSorting: true, direction: "" as const },
  { id: 'plans', name: 'Plans', isRowHeader: true, allowsSorting: false, direction: "" as const },
  { id: 'active', name: 'Active', isRowHeader: true, allowsSorting: true, direction: "" as const },
  { id: 'role', name: 'Role', isRowHeader: true, allowsSorting: true, direction: "" as const },
  { id: 'created', name: 'Created', isRowHeader: true, allowsSorting: true, direction: "" as const },
  { id: 'lastActivity', name: 'Activity', isRowHeader: true, allowsSorting: true, direction: "" as const },
]

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


  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [hasNextPage, setHasNextPage] = useState<boolean | null>(false);
  const [hasPreviousPage, setHasPreviousPage] = useState<boolean | null>(false);
  const [columns, setColumns] = useState<DmpTableColumnSet>(initialColumns);

  // Localization
  const usersTrans = useTranslations('Admin.users');
  const Global = useTranslations('Global');

  const [fetchUserData, { data: usersData, loading: usersLoading, error: usersError, refetch: usersRefetch }] = useLazyQuery(UsersDocument, {
    notifyOnNetworkStatusChange: true,
    fetchPolicy: 'no-cache',
  });

  const buildQueryVars = (page: number, term: string, role: UserRole | '', sortField?: string, sortDir?: string) => ({
    paginationOptions: {
      offset: (page - 1) * LIMIT,
      limit: LIMIT,
      type: "OFFSET",
      sortDir: sortDir ?? "DESC",
      sortField: sortField,
    },
    term,
    ...(role ? { role } : {}),
  });


  const RoleLabels: Record<string, string> = Object.fromEntries(
    RoleOptions.filter(opt => opt.value !== '').map(opt => [opt.value, opt.label])
  );

  const handleRoleChange = async (role: UserRole | '') => {
    setErrors([]);
    setSelectedRole(role);
    setCurrentPage(1);
  };

  // Just updates the search term
  const handleSearchInput = async (term: string) => {
    setSearchTerm(term);
    if (term === '') {
      await fetchUserData({ variables: buildQueryVars(1, '', selectedRole, sortField, sortDir) });
    }
  }

  // Only fires when the button is pressed
  const handleSearchSubmit = async () => {
    setErrors([]);
    setCurrentPage(1);
    await fetchUserData({ variables: buildQueryVars(1, searchTerm, selectedRole, sortField, sortDir) });
  };

  // Handle pagination page click
  const handlePageClick = async (page: number) => {
    await fetchUserData({
      variables: buildQueryVars(page, searchTerm, selectedRole, sortField, sortDir)
    });
  };

  const onSortChangeHandler = async (newColumns: DmpTableColumnSet) => {
    setColumns(newColumns);

    const activeSort = Array.from(newColumns).find(col => col.allowsSorting && col.direction !== '');
    if (activeSort) {
      const newSortField = activeSort.id;
      const newSortDir = activeSort.direction === 'ascending' ? 'ASC' : 'DESC';
      console.log('newSortField:', newSortField, 'newSortDir:', newSortDir);

      setSortField(newSortField);
      setSortDir(newSortDir);

      const vars = buildQueryVars(currentPage, searchTerm, selectedRole, newSortField, newSortDir);
      console.log('vars:', JSON.stringify(vars, null, 2));

      const result = await fetchUserData({ variables: vars });
      console.log('fetch result:', result);
    }
  };

  // Fetch published templates based on page, filters and search term criteria
  const fetchUsers = async ({
    page,
    searchTerm = ''
  }: {
    page?: number;
    searchTerm?: string;
  }): Promise<void> => {
    let offsetLimit = 0;
    if (page) {
      setCurrentPage(page);
      offsetLimit = (page - 1) * LIMIT;
    }

    try {
      await fetchUserData({
        variables: buildQueryVars(page ?? currentPage, searchTerm, selectedRole)
      });
    } catch (err) {
      handleApolloError(err, 'OrgUserAccountsPage.fetchUsers');
    }
  };

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

      const hasSuperAdmin = transformed.some(user => user.role === RoleLabels[UserRole.Superadmin]);
      setColumns(prev => {
        const alreadyHasOrg = Array.from(prev).some(col => col.id === 'organization');
        if (hasSuperAdmin && !alreadyHasOrg) {
          // Insert before 'created'
          const createdIndex = Array.from(prev).findIndex(col => col.id === 'created');
          const next = [...prev];
          next.splice(createdIndex, 0, { id: 'organization', name: 'Organization', isRowHeader: true, allowsSorting: true, direction: "" as const });
          return next;
        }
        if (!hasSuperAdmin && alreadyHasOrg) {
          return Array.from(prev).filter(col => col.id !== 'organization');
        }
        return prev;
      });
    }
  }, [usersData]);

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
            <FormInput
              name="search"
              type="search"
              className={styles.searchInput}
              label={usersTrans('tools.searchLabel')}
              onChange={e => handleSearchInput(e.target.value)}
              value={searchTerm}
            />
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

            <Button
              onPress={handleSearchSubmit}
              isDisabled={usersLoading}
              className={styles.searchButton}
            >
              {usersLoading ? Global('buttons.searching') : usersTrans('buttons.searchLabel')}
            </Button>
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
