import React from 'react';
import { render, screen } from '@testing-library/react';
import LeftSidebar from '..';
import { usePathname } from '@/i18n/routing';

jest.mock('@/i18n/routing', () => ({
  Link: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>{children}</a>
  ),
  useRouter: jest.fn(() => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() })),
  usePathname: jest.fn(),
}));

describe('LeftSidebar component', () => {
  const renderComponent = (pathname: string) => {
    // Mock the return value of usePathname based on the test case
    (usePathname as jest.Mock).mockReturnValue(pathname);

    // Render the LeftSidebar component
    render(<LeftSidebar />);
  };

  it('should render the "Account" section title', () => {
    renderComponent('/account/profile');
    expect(screen.getByText('Account')).toBeInTheDocument();
  });

  it('should highlight "Your Profile" when the pathname is /account/profile', () => {
    renderComponent('/account/profile');
    expect(screen.getByText('Your Profile')).toHaveClass('active');
  });

  it('should highlight "Password" when the pathname is /account/password', () => {
    renderComponent('/account/password');
    expect(screen.getByText('Password')).toHaveClass('active');
  });

  it('should highlight "Connections" when the pathname is /account/connections', () => {
    renderComponent('/account/connections');
    expect(screen.getByText('Connections')).toHaveClass('active');
  });

  it('should highlight "Notifications" when the pathname is /account/notifications', () => {
    renderComponent('/account/notifications');
    expect(screen.getByText('Notifications')).toHaveClass('active');
  });

  it('should highlight "Developer Tools" when the pathname is /account/developerTools', () => {
    renderComponent('/account/developerTools');
    expect(screen.getByText('Developer Tools')).toHaveClass('active');
  });

  it('should not apply "active" class to any item if pathname does not match any route', () => {
    renderComponent('/account/other');
    expect(screen.getByText('Your Profile')).not.toHaveClass('active');
    expect(screen.getByText('Password')).not.toHaveClass('active');
    expect(screen.getByText('Connections')).not.toHaveClass('active');
    expect(screen.getByText('Notifications')).not.toHaveClass('active');
    expect(screen.getByText('Developer Tools')).not.toHaveClass('active');
  });
});