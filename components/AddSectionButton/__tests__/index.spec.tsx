import { render, screen, fireEvent, act } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import AddSectionButton from '../index';
expect.extend(toHaveNoViolations);

jest.mock('next/navigation', () => ({
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

jest.mock('@/i18n/routing', () => ({
  Link: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>{children}</a>
  ),
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    prefetch: jest.fn(),
    replace: jest.fn(),
    pathname: '/',
    route: '/',
    query: {},
    asPath: '/',
  })),
  usePathname: jest.fn(() => '/'),
}));

describe('AddSectionButton', () => {
  const mockOnClick = jest.fn();
  const mockHref = '/add-section';
  const mockClassName = 'custom-class';

  it('should render the button with default properties', () => {
    render(<AddSectionButton />);
    expect(screen.getByRole('link')).toHaveAttribute('href', '#');
    expect(screen.getByText('links.addSection')).toBeInTheDocument(); // Default localized text
  });

  it('should render the button with custom href and className', () => {
    render(<AddSectionButton href={mockHref} className={mockClassName} />);
    const linkElement = screen.getByRole('link');
    expect(linkElement).toHaveAttribute('href', mockHref);
    expect(linkElement).toHaveClass('link');
  });

  it('should call onClick when the button is clicked', () => {
    render(<AddSectionButton onClick={mockOnClick} />);
    const linkElement = screen.getByRole('link');
    fireEvent.click(linkElement);
    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it('should not throw an error when onClick is not provided', () => {
    render(<AddSectionButton />);
    const linkElement = screen.getByRole('link');
    expect(() => fireEvent.click(linkElement)).not.toThrow();
  });

  it('should pass axe accessibility test', async () => {
    const { container } = render(
      <AddSectionButton />
    );

    await act(async () => {
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
