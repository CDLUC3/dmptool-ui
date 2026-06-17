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

// Utils and other
import styles from './UsersDashboardPage.module.scss';
import { routePath } from '@/utils/routes';
import { logECS } from '@/utils/index';
import { handleApolloError } from '@/utils/apolloErrorHandler';
import { useFormatDate } from "@/hooks/useFormatDate";

const LIMIT = 1;

interface UserRow {
  id: string | null | undefined;
  name: string;
  email: string;
  plans: number;
  active: string;
  role: UserRole | undefined;
  created: string;
  lastActivity: string | null;
}

const StaticPermissions = [
  'Super Admin',
  'Org Admin',
  'Researcher',
]

const initialColumns = [
  { id: 'id', name: 'id', isRowHeader: false },
  { id: 'name', name: 'Name', isRowHeader: true, allowsSorting: true, direction: "" as const },
  { id: 'email', name: 'Email', isRowHeader: true, allowsSorting: true, direction: "" as const },
  { id: 'plans', name: 'Plans', isRowHeader: true, allowsSorting: true, direction: "" as const },
  { id: 'active', name: 'Active', isRowHeader: true, allowsSorting: true, direction: "" as const },
  { id: 'role', name: 'Role', isRowHeader: true, allowsSorting: true, direction: "" as const },
  { id: 'created', name: 'Created', isRowHeader: true, allowsSorting: true, direction: "" as const },
  { id: 'lastActivity', name: 'Activity', isRowHeader: true, allowsSorting: true, direction: "" as const },
]

function OrgUserAccountsPage(): React.ReactElement {
  const formatDate = useFormatDate();
  const usersTrans = useTranslations('Admin.users');

  const errorRef = useRef<HTMLDivElement | null>(null);
  const topRef = useRef<HTMLDivElement>(null);
  const [errors, setErrors] = useState<string[]>([]);

  const [users, setUsers] = useState<UserRow[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [hasNextPage, setHasNextPage] = useState<boolean | null>(false);
  const [hasPreviousPage, setHasPreviousPage] = useState<boolean | null>(false);
  const [columns, setColumns] = useState<DmpTableColumnSet>(initialColumns);
  const [isSearching, setIsSearching] = useState(false);

  const [fetchUserData, { data: usersData, loading: usersLoading, error: usersError, refetch: usersRefetch }] = useLazyQuery(UsersDocument, {
    notifyOnNetworkStatusChange: true,
  });

  function handleSearchInput(e: React.ChangeEvent<HTMLInputElement>) {
    setErrors([]);
    setIsSearching(true);
    setSearchTerm(e.target.value);
    // TODO::
    console.log('TODO');
  }

  // Handle pagination page click
  const handlePageClick = async (page: number) => {
    await fetchUserData({
      variables: {
        paginationOptions: {
          offset: (page - 1) * LIMIT,
          limit: LIMIT,
          type: "OFFSET",
          sortDir: "DESC",
          selectOwnerURIs: [],
          bestPractice: false
        },
        term: searchTerm
      }
    });
  };

  function onSortChangeHandler(newColumns: DmpTableColumnSet) {
    // Make sure to update the column states
    setColumns(newColumns);

    // NOTE::TODO
    // Now update the sorting for the items.
    // Currently we are using the static list of demo users, but in a live
    // setting, we will re-request the user list, from the backend, passing the
    // new sort order in the params.
  }

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
        variables: {
          paginationOptions: {
            offset: offsetLimit,
            limit: LIMIT,
            type: "OFFSET",
            sortDir: "DESC",
          },
          term: searchTerm,
        }
      });
    } catch (err) {
      handleApolloError(err, 'OrgUserAccountsPage.fetchUsers');
    }
  };

  const transformUsers = (data: typeof usersData): UserRow[] => {
    return data?.users?.items
      ?.filter((user): user is NonNullable<typeof user> => user !== null)
      .map((user) => ({
        id: user.id?.toString(),
        name: [user.givenName, user.surName].filter(Boolean).join(' '),
        email: user.email ?? '',
        plans: user.plans?.length ?? 0,
        active: user.active ? 'Yes' : 'No',
        role: user.role,
        created: user.created ? formatDate(user.created) : '',
        lastActivity: user.last_sign_in ? formatDate(user.last_sign_in) : null,
      })) ?? [];
  }


  // Load on mount
  useEffect(() => {
    fetchUsers({ page: currentPage, searchTerm: '' });
  }, []);

  useEffect(() => {
    if (usersData?.users?.items) {
      const totalCount = usersData.users.totalCount ?? 0;
      setTotalPages(Math.ceil(totalCount / LIMIT));
      setHasNextPage(usersData.users.hasNextPage ?? false);
      setHasPreviousPage(usersData.users.hasPreviousPage ?? false);
      setUsers(transformUsers(usersData));
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
              type="text"
              label={usersTrans('tools.searchLabel')}
              onChange={handleSearchInput}
              value={searchTerm}
            />

            <Select name="permission">
              <Label>{usersTrans('tools.permissionLabel')}</Label>
              <Button>
                <SelectValue />
                <span aria-hidden="true">▼</span>
              </Button>
              <Popover>
                <ListBox>
                  {StaticPermissions.map((perm, i) => (
                    <ListBoxItem key={`_permission_${i}`}>{perm}</ListBoxItem>
                  ))}
                </ListBox>
              </Popover>
              <FieldError />
            </Select>

            <Button
              onPress={() => { console.log('TODO') }}
              isDisabled={isSearching}
            >
              {usersTrans('buttons.searchLabel')}
            </Button>
          </div>

          <DmpTable
            label={usersTrans('userTable.label')}
            className={styles.userList}
            columnData={columns}
            rowData={users}
            onDmpSortChange={onSortChangeHandler}
          />

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
