import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import Home from '../page';

expect.extend(toHaveNoViolations);

describe('Home Page', () => {
  beforeEach(() => {
    window.scrollTo = jest.fn();
  });
  it('renders the Home page with heading and PageLinkCard', () => {
    render(<Home />);

    // Check for the heading
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('title');

    // Check for the PageLinkCard sections
    expect(screen.getByText('createAndManage.title')).toBeInTheDocument();
    expect(screen.getByText('createAndManage.description')).toBeInTheDocument();
    expect(screen.getByText('accountAndAdmin.title')).toBeInTheDocument();
    expect(screen.getByText('accountAndAdmin.description')).toBeInTheDocument();

    // Check for section descriptions
    expect(screen.getByText('sections.templateManagement.title')).toBeInTheDocument();
    expect(screen.getByText('sections.templateManagement.description')).toBeInTheDocument();
    expect(screen.getByText('sections.planDashboard.title')).toBeInTheDocument();
    expect(screen.getByText('sections.planDashboard.description')).toBeInTheDocument();
    expect(screen.getByText('sections.accountSettings.title')).toBeInTheDocument();
    expect(screen.getByText('sections.accountSettings.description')).toBeInTheDocument();
    expect(screen.getByText('sections.adminOverview.title')).toBeInTheDocument();
    expect(screen.getByText('sections.adminOverview.description')).toBeInTheDocument();

    // Check for all links to be present
    const allLinks = screen.getAllByRole('link');
    expect(allLinks).toHaveLength(4);


    const templateManagementLink = screen.getByText('sections.templateManagement.title').closest('a');
    const projectManagementLink = screen.getByText('sections.planDashboard.title').closest('a');
    const accountSettingsLink = screen.getByText('sections.accountSettings.title').closest('a');
    const adminOverviewLink = screen.getByText('sections.adminOverview.title').closest('a');

    expect(templateManagementLink).toHaveAttribute('href', '/en-US/template');
    expect(projectManagementLink).toHaveAttribute('href', '/en-US/projects');
    expect(accountSettingsLink).toHaveAttribute('href', '/en-US/account');
    expect(adminOverviewLink).toHaveAttribute('href', '/en-US/admin');
  });

  it('should pass axe accessibility test', async () => {
    const { container } = render(<Home />)
    await act(async () => {
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    })
  })
});
