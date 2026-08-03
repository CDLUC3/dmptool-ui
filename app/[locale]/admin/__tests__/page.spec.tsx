/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import AdminOverviewPage from '../page';

expect.extend(toHaveNoViolations);

// Mock Apollo
jest.mock('@apollo/client/react', () => ({
  useQuery: jest.fn(),
}));

import { useQuery } from '@apollo/client/react';

jest.mock('@/components/PageHeader', () => {
  return function MockPageHeader({ title, description }: { title: string; description?: string }) {
    return (
      <div data-testid="page-header">
        {title}
        {description && <div data-testid="page-description">{description}</div>}
      </div>
    );
  };
});

jest.mock('@/components/PageLinkCard', () => {
  return function MockPageLinkCard({ sections }: { sections: any[] }) {
    return (
      <div data-testid="page-link-card">
        {sections.map((section: any, i: number) =>
          section.items.map((item: any, j: number) => (
            <div key={`${i}-${j}`} data-testid={`link-item-${item.title}`}>
              {item.hasNotification && (
                <span data-testid="notification-badge">{item.notificationCount}</span>
              )}
            </div>
          ))
        )}
      </div>
    );
  };
});

jest.mock('@/components/Container', () => ({
  ContentContainer: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="content-container" className={className}>{children}</div>
  ),
  LayoutWithPanel: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="layout-with-panel">{children}</div>
  ),
  SidebarPanel: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="sidebar-panel" className={className}>{children}</div>
  ),
}));

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

jest.mock('@/utils/routes', () => ({
  routePath: (key: string) => `/${key}`,
}));

describe('AdminOverviewPage', () => {
  beforeEach(() => {
    (useQuery as unknown as jest.Mock).mockReturnValue({ data: undefined });
  });

  it('renders the admin page with header', () => {
    render(<AdminOverviewPage />);
    expect(screen.getByTestId('page-header')).toBeInTheDocument();
    expect(screen.getByText('Admin')).toBeInTheDocument();
  });

  it('renders the organization description in PageHeader', () => {
    render(<AdminOverviewPage />);
    expect(screen.getByTestId('page-description')).toBeInTheDocument();
    expect(screen.getByText('University of California, Office of the President (UCOP)')).toBeInTheDocument();
  });

  it('renders the PageLinkCard component', () => {
    render(<AdminOverviewPage />);
    expect(screen.getByTestId('page-link-card')).toBeInTheDocument();
  });

  it('renders the layout components', () => {
    render(<AdminOverviewPage />);
    expect(screen.getByTestId('layout-with-panel')).toBeInTheDocument();
    expect(screen.getByTestId('content-container')).toBeInTheDocument();
    expect(screen.getByTestId('sidebar-panel')).toBeInTheDocument();
  });

  it('shows notification badge when there are unread notifications', () => {
    (useQuery as unknown as jest.Mock).mockReturnValue({
      data: { adminNotifications: { totalCount: 3 } },
    });

    render(<AdminOverviewPage />);
    expect(screen.getByTestId('notification-badge')).toBeInTheDocument();
    expect(screen.getByTestId('notification-badge')).toHaveTextContent('3');
  });

  it('does not show notification badge when there are no notifications', () => {
    (useQuery as unknown as jest.Mock).mockReturnValue({
      data: { adminNotifications: { totalCount: 0 } },
    });

    render(<AdminOverviewPage />);
    expect(screen.queryByTestId('notification-badge')).not.toBeInTheDocument();
  });

  it('does not show notification badge when data is undefined', () => {
    (useQuery as unknown as jest.Mock).mockReturnValue({ data: undefined });

    render(<AdminOverviewPage />);
    expect(screen.queryByTestId('notification-badge')).not.toBeInTheDocument();
  });

  it('should pass axe accessibility test', async () => {
    const { container } = render(<AdminOverviewPage />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});