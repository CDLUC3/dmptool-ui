import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import Custom500 from '../page';

expect.extend(toHaveNoViolations);

jest.mock('@/i18n/routing', () => ({
  Link: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));


describe('500-error', () => {
  it('renders the 500 error page correctly', () => {
    render(<Custom500 />);

    // Check for the heading
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('500 - Internal Server Error');

    // Check for the links
    expect(screen.getByRole('link', { name: /Go back home/i })).toHaveAttribute('href', '/');

    // Check for the admin access note
    expect(screen.getByText(/Something went wrong on our end. Please try again later./i)).toBeInTheDocument();
  });

  it('should pass axe accessibility test', async () => {
    const { container } = render(<Custom500 />)
    await act(async () => {
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    })
  })
});
