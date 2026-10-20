import React from 'react';
import { act, render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import PageLinkCard, { PageLinkSection } from '../index';

expect.extend(toHaveNoViolations);

jest.mock('@/i18n/routing', () => ({
  Link: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>{children}</a>
  ),
  useRouter: jest.fn(() => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() })),
  usePathname: jest.fn(() => '/'),
}));

const mockSections: PageLinkSection[] = [
  {
    title: "Test Section",
    description: "Test section description",
    items: [
      {
        title: "Test Item 1",
        description: "Test description 1",
        href: "/test1"
      },
      {
        title: "Test Item 2",
        description: "Test description 2",
        href: "/test2",
        hasNotification: true,
        notificationCount: 5
      }
    ]
  },
  {
    title: "Test Section 2",
    items: [
      {
        title: "Test Item 3",
        href: "/test3"
      },
      {
        title: "Test Item 4",
        description: "Test description 4",
        href: "/test4"
      }
    ]
  }
];

describe('PageLinkCard', () => {
  it('renders all sections and items', () => {
    render(<PageLinkCard sections={mockSections} />);

    expect(screen.getByText('Test Section')).toBeInTheDocument();
    expect(screen.getByText('Test Item 1')).toBeInTheDocument();
    expect(screen.getByText('Test Item 2')).toBeInTheDocument();
    expect(screen.getByText('Test description 1')).toBeInTheDocument();
    expect(screen.getByText('Test description 2')).toBeInTheDocument();
  });

  it('has proper accessibility structure', () => {
    render(<PageLinkCard sections={mockSections} />);

    // Check for section elements
    const sections = screen.getAllByRole('region');
    expect(sections).toHaveLength(2);
  });

  it('renders notification badge when hasNotification is true', () => {
    render(<PageLinkCard sections={mockSections} />);

    expect(screen.getByText('5 new notifications')).toBeInTheDocument();
  });

  it('does not render notification badge when hasNotification is false', () => {
    const sectionsWithoutNotification: PageLinkSection[] = [
      {
        title: "Test Section",
        items: [
          {
            title: "Test Item",
            description: "Test description",
            href: "/test"
          }
        ]
      }
    ];

    render(<PageLinkCard sections={sectionsWithoutNotification} />);

    expect(screen.queryByText(/new notifications/)).not.toBeInTheDocument();
  });

  it('renders section description when provided', () => {
    render(<PageLinkCard sections={mockSections} />);

    expect(screen.getByText('Test section description')).toBeInTheDocument();
  });

  it('does not render section description when not provided', () => {
    render(<PageLinkCard sections={mockSections} />);

    // Should not find a description for the second section
    expect(screen.getByText('Test Section 2')).toBeInTheDocument();
    expect(screen.queryByText('Test section description')).toBeInTheDocument(); // First section has description
  });

  it('renders item description when provided', () => {
    render(<PageLinkCard sections={mockSections} />);

    expect(screen.getByText('Test description 1')).toBeInTheDocument();
    expect(screen.getByText('Test description 2')).toBeInTheDocument();
    expect(screen.getByText('Test description 4')).toBeInTheDocument();
  });

  it('does not render item description when not provided', () => {
    render(<PageLinkCard sections={mockSections} />);

    // Should not find a description for the third item
    expect(screen.getByText('Test Item 3')).toBeInTheDocument();
    expect(screen.queryByText(/Test Item 3/)).toBeInTheDocument();
  });

  it('renders correct links with href attributes', () => {
    render(<PageLinkCard sections={mockSections} />);

    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(4);

    // Check first two links have correct hrefs
    expect(links[0]).toHaveAttribute('href', '/test1');
    expect(links[1]).toHaveAttribute('href', '/test2');
  });

  it('has proper focus management', () => {
    render(<PageLinkCard sections={mockSections} />);

    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(4);

    // Check that all links are focusable (they are anchor tags)
    links.forEach(link => {
      expect(link.tagName).toBe('A');
    });
  });

  it('should pass axe accessibility test', async () => {
    const { container } = render(<PageLinkCard sections={mockSections} />);
    let results;
    await act(async () => {
      results = await axe(container);
    });
    expect(results).toHaveNoViolations();
  });
});
