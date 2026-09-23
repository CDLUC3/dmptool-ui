import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import NotFound from '../not-found';
expect.extend(toHaveNoViolations);

jest.mock('@/i18n/routing', () => ({
  Link: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>{children}</a>
  ),
  useRouter: jest.fn(() => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() })),
  usePathname: jest.fn(() => '/'),
}));

describe('NotFound', () => {
  it('renders the Not Found page with heading and links', () => {
    render(<NotFound />);

    // Check for the heading
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Not Found');

    // Check for paragraph text
    expect(screen.getByText(/Could not find requested resource/i)).toBeInTheDocument();

    // Check for the link
    expect(screen.getByRole('link', { name: /Return Home/i })).toHaveAttribute('href', '/');
  });
  it('should pass axe accessibility test', async () => {
    const { container } = render(<NotFound />)
    await act(async () => {
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    })
  })
});
