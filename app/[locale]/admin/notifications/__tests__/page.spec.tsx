/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing/react';
import AdminNotificationsPage from '../page';
import {
  AdminNotificationsUnreadDocument,
  AdminNotificationsReadDocument,
  AdminNotificationType,
} from '@/generated/graphql';

// ─── Mocks ───────────────────────────────────────────────────────────────────

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
  useNow: () => new Date('2026-06-14T00:00:00.000Z'),
}));

jest.mock('@/utils/index', () => ({
  logECS: jest.fn(),
  routePath: jest.fn((name: string, params: Record<string, unknown>) => `/${name}/${JSON.stringify(params)}`),
}));

jest.mock('@/hooks/useFormatDate', () => ({
  useFormatDate: () => (date: string) => `formatted:${date}`,
}));

jest.mock('@/components/PageHeader', () => ({
  __esModule: true,
  default: ({ title }: any) => <div data-testid="page-header">{title}</div>,
}));

jest.mock('@/components/ErrorMessages', () => ({
  __esModule: true,
  default: React.forwardRef(({ errors }: any, ref: any) => (
    <div ref={ref} data-testid="error-messages">
      {errors.map((e: string, i: number) => <p key={i}>{e}</p>)}
    </div>
  )),
}));

jest.mock('@/components/Loading', () => ({
  __esModule: true,
  default: ({ message }: any) => <div data-testid="loading">{message}</div>,
}));

jest.mock('@/components/Container', () => ({
  LayoutContainer: ({ children }: any) => <div>{children}</div>,
  ContentContainer: ({ children }: any) => <div>{children}</div>,
}));

jest.mock('@/components/Admin/NotificationCard', () => ({
  __esModule: true,
  default: ({ heading, sections, onToggleRead }: any) => (
    <div data-testid={`notification-card-${heading}`}>
      <h2>{heading}</h2>
      {sections.map((s: any) => (
        <div key={s.id} data-testid={`notification-item-${s.id}`}>
          <span>{s.planTitle}</span>
          <button onClick={onToggleRead}>toggle-read-{s.id}</button>
        </div>
      ))}
    </div>
  ),
}));

jest.mock('react-aria-components', () => ({
  Button: ({ children, onPress, isDisabled }: any) => (
    <button onClick={onPress} disabled={isDisabled}>{children}</button>
  ),
}));

// ─── Mock Data ────────────────────────────────────────────────────────────────

const mockUnreadItem = {
  id: 1,
  notificationType: AdminNotificationType.FeedbackRequested,
  isRead: false,
  created: '1718323200000', // 2024-06-14
  createdBy: { id: 10, givenName: 'Jane', surName: 'Doe' },
  plan: { id: 2, title: 'My DMP Plan', project: { id: 5 } },
  template: null,
  templateCustomization: null,
  feedback: { id: 3, messageToOrg: 'Please review' },
};

const mockReadItem = {
  id: 4,
  notificationType: AdminNotificationType.TemplateCreated,
  isRead: true,
  created: '1718236800000',
  createdBy: { id: 11, givenName: 'John', surName: 'Smith' },
  plan: null,
  template: { id: 6, name: 'New Funder Template' },
  templateCustomization: null,
  feedback: null,
};

const createUnreadMock = (items = [mockUnreadItem], nextCursor: string | null = null, totalCount = 1) => ({
  request: {
    query: AdminNotificationsUnreadDocument,
    variables: { paginationOptions: { type: 'CURSOR', limit: 5 } },
  },
  result: {
    data: {
      adminNotificationsUnread: { items, nextCursor, totalCount, hasNextPage: false, hasPreviousPage: false, currentOffset: 0 },
    },
  },
});

const createReadMock = (items = [mockReadItem], nextCursor: string | null = null, totalCount = 1) => ({
  request: {
    query: AdminNotificationsReadDocument,
    variables: { paginationOptions: { type: 'CURSOR', limit: 5 } },
  },
  result: {
    data: {
      adminNotificationsRead: { items, nextCursor, totalCount, hasNextPage: false, hasPreviousPage: false, currentOffset: 0 },
    },
  },
});

const createLoadMoreUnreadMock = (cursor: string) => ({
  request: {
    query: AdminNotificationsUnreadDocument,
    variables: { paginationOptions: { type: 'CURSOR', cursor, limit: 5 } },
  },
  result: {
    data: {
      adminNotificationsUnread: {
        items: [{ ...mockUnreadItem, id: 99, plan: { ...mockUnreadItem.plan, title: 'Second Plan' } }],
        nextCursor: null,
        totalCount: 2,
        hasNextPage: false,
        hasPreviousPage: false,
        currentOffset: 0,
      },
    },
  },
});

const renderComponent = (mocks: any[] = [createUnreadMock(), createReadMock()]) => {
  return render(
    <MockedProvider mocks={mocks}>
      <AdminNotificationsPage />
    </MockedProvider>
  );
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('AdminNotificationsPage', () => {
  describe('initial render', () => {
    it('should render the page header', () => {
      renderComponent();
      expect(screen.getByTestId('page-header')).toBeInTheDocument();
    });

    it('should show loading indicators on initial load', () => {
      renderComponent();
      const loaders = screen.getAllByTestId('loading');
      expect(loaders.length).toBeGreaterThan(0);
    });

    it('should render both notification card sections', async () => {
      renderComponent();
      await waitFor(() => {
        expect(screen.getByTestId('notification-card-headings.unread')).toBeInTheDocument();
        expect(screen.getByTestId('notification-card-headings.previousNotifications')).toBeInTheDocument();
      });
    });
  });

  describe('loading notifications', () => {
    it('should render unread notification items after data loads', async () => {
      renderComponent();
      await waitFor(() => {
        expect(screen.getByTestId('notification-item-1')).toBeInTheDocument();
        expect(screen.getByText('My DMP Plan')).toBeInTheDocument();
      });
    });

    it('should render read notification items after data loads', async () => {
      renderComponent();
      await waitFor(() => {
        expect(screen.getByTestId('notification-item-4')).toBeInTheDocument();
        expect(screen.getByText('New Funder Template')).toBeInTheDocument();
      });
    });

    it('should show empty unread message when no unread notifications', async () => {
      renderComponent([createUnreadMock([], null, 0), createReadMock()]);
      await waitFor(() => {
        expect(screen.getByText('messages.noUnreadNotifications')).toBeInTheDocument();
      });
    });

    it('should show empty read message when no read notifications', async () => {
      renderComponent([createUnreadMock(), createReadMock([], null, 0)]);
      await waitFor(() => {
        expect(screen.getByText('messages.noReadNotifications')).toBeInTheDocument();
      });
    });

    it('should hide loading indicator after data loads', async () => {
      renderComponent();
      await waitFor(() => {
        expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
      });
    });
  });

  describe('load more', () => {
    it('should show load more button when more unread notifications exist', async () => {
      renderComponent([
        createUnreadMock([mockUnreadItem], 'cursor-123', 10),
        createReadMock(),
      ]);
      await waitFor(() => {
        expect(screen.getByText('buttons.loadMore')).toBeInTheDocument();
      });
    });

    it('should not show load more button when all notifications are loaded', async () => {
      renderComponent([createUnreadMock(), createReadMock()]);
      await waitFor(() => {
        expect(screen.queryByText('buttons.loadMore')).not.toBeInTheDocument();
      });
    });

    it('should load more unread notifications when load more is clicked', async () => {
      renderComponent([
        createUnreadMock([mockUnreadItem], 'cursor-123', 2),
        createReadMock(),
        createLoadMoreUnreadMock('cursor-123'),
      ]);

      await waitFor(() => {
        expect(screen.getByText('buttons.loadMore')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('buttons.loadMore'));

      await waitFor(() => {
        expect(screen.getByText('Second Plan')).toBeInTheDocument();
      });
    });

    it('should show count display when load more is available', async () => {
      renderComponent([
        createUnreadMock([mockUnreadItem], 'cursor-123', 10),
        createReadMock(),
      ]);

      await waitFor(() => {
        expect(screen.getByText('messaging.numDisplaying')).toBeInTheDocument();
      });
    });
  });

  describe('error handling', () => {
    it('should display error message when unread query fails', async () => {
      const errorMock = {
        request: {
          query: AdminNotificationsUnreadDocument,
          variables: { paginationOptions: { type: 'CURSOR', limit: 5 } },
        },
        error: new Error('Network error'),
      };

      renderComponent([errorMock, createReadMock()]);

      await waitFor(() => {
        expect(screen.getByText('Failed to load notifications')).toBeInTheDocument();
      });
    });

    it('should display error message when read query fails', async () => {
      const errorMock = {
        request: {
          query: AdminNotificationsReadDocument,
          variables: { paginationOptions: { type: 'CURSOR', limit: 5 } },
        },
        error: new Error('Network error'),
      };

      renderComponent([createUnreadMock(), errorMock]);

      await waitFor(() => {
        expect(screen.getByText('Failed to load notifications')).toBeInTheDocument();
      });
    });
  });

  describe('refetch on toggle read', () => {
    it('should clear items and refetch when onToggleRead is triggered', async () => {
      renderComponent([
        createUnreadMock(),
        createReadMock(),
        // Refetch mocks
        createUnreadMock(),
        createReadMock(),
      ]);

      await waitFor(() => {
        expect(screen.getByText('My DMP Plan')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('toggle-read-1'));

      // After toggle, items are cleared so empty state should show briefly
      await waitFor(() => {
        expect(screen.getByText('messages.noUnreadNotifications')).toBeInTheDocument();
      });
    });
  });

});