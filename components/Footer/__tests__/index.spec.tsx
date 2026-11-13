import React from 'react';
import { render, screen, act } from '@testing-library/react';
import Footer from '../index';
import '@testing-library/jest-dom';
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

jest.mock('@/i18n/routing', () => ({
  Link: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

// Footer component will be updated, so put in minimal tests for now
describe('Footer', () => {
  it('should render the footer with the correct structure', () => {
    render(<Footer />);

    // Check for the logo
    expect(screen.getByAltText('DMP Tool')).toBeInTheDocument();

    // Check for the "Get Started" button
    expect(screen.getByText('Get Started')).toBeInTheDocument();

    // Check for Quick Links section
    expect(screen.getByText('Quick links')).toBeInTheDocument();
    expect(screen.getByText('Funder Requirements')).toBeInTheDocument();
    expect(screen.getByText('Public Plans')).toBeInTheDocument();
    expect(screen.getByText('Help')).toBeInTheDocument();
    expect(screen.getByText('Terms & Privacy')).toBeInTheDocument();
    expect(screen.getByText('Contact')).toBeInTheDocument();
    expect(screen.getByText('Login')).toBeInTheDocument();

    // Check for External Links section
    expect(screen.getByText('External links')).toBeInTheDocument();
    expect(screen.getByText('GitHub')).toBeInTheDocument();
    expect(screen.getByText('Blog')).toBeInTheDocument();
    expect(screen.getByText('Accessibility')).toBeInTheDocument();

    // Check for disclaimers
    expect(screen.getByAltText('University of California, Office of the President (UCOP) logo')).toBeInTheDocument();
    expect(screen.getByText(/DMP Tool is a service of the California Digital Library/)).toBeInTheDocument();
    const year = new Date().getFullYear()
    const regex = new RegExp(`Copyright ©\\s+${year}\\s+The Regents of the University of California`, 'i')
    expect(screen.getByText(regex)).toBeInTheDocument()
  });

  it('should link the Get Started button and quick links to their routes', () => {
    render(<Footer />);

    const expectedHrefs: Record<string, string> = {
      'Get Started': '/login',
      'Funder Requirements': '/funder-requirements',
      'Public Plans': '/public-plans',
      Help: '/help',
      'Terms & Privacy': '/terms',
      Contact: '/contact',
      Login: '/login',
    };
    Object.entries(expectedHrefs).forEach(([name, href]) => {
      expect(screen.getByRole('link', { name })).toHaveAttribute('href', href);
    });
  });

  it('should not render any links with an empty or placeholder href', () => {
    const { container } = render(<Footer />);

    expect(container.querySelectorAll('a[href=""], a[href="#"]')).toHaveLength(0);
  });

  it('should render external links with target="_blank"', () => {
    render(<Footer />);

    // Check for external links
    const githubLink = screen.getByText('GitHub');
    const blogLink = screen.getByText('Blog');
    const accessibilityLink = screen.getByText('Accessibility');

    expect(githubLink).toHaveAttribute('href', 'https://github.com/cdluc3/dmptool/wiki');
    expect(githubLink).toHaveAttribute('target', '_blank');

    expect(blogLink).toHaveAttribute('href', 'https://blog.dmptool.org');
    expect(blogLink).toHaveAttribute('target', '_blank');

    expect(accessibilityLink).toHaveAttribute('href', 'https://www.cdlib.org/about/accessibility.html');
    expect(accessibilityLink).toHaveAttribute('target', '_blank');
  });

  it('should pass axe accessibility test', async () => {
    const { container } = render(<Footer />);

    await act(async () => {
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
