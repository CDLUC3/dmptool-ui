import { fireEvent, render, screen } from '@testing-library/react';
import { useRouter } from '@/i18n/routing';
import { axe, toHaveNoViolations } from 'jest-axe';
import EmailConfirmed from '../page';

expect.extend(toHaveNoViolations);

jest.mock('@/i18n/routing', () => ({
  useRouter: jest.fn(() => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() })),
}));

describe('EmailConfirmed', () => {
  let mockRouter;

  beforeEach(() => {
    window.scrollTo = jest.fn(); // Called by the wrapping PageHeader
    mockRouter = { push: jest.fn() };
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render the component with heading and paragraph', () => {
    render(<EmailConfirmed />);

    // Check if the title and text are rendered
    expect(screen.getByRole('heading', { name: /email confirmed/i })).toBeInTheDocument();
    expect(screen.getByText(/thanks for confirming your alias email/i)).toBeInTheDocument();
  });

  it('should render a "Log in" button', () => {
    render(<EmailConfirmed />);

    // Check if the button is rendered
    const loginButton = screen.getByRole('button', { name: /log in/i });
    expect(loginButton).toBeInTheDocument();
  });

  it('should navigate to "/login" when "Log in" button is clicked', () => {
    render(<EmailConfirmed />);

    // Get the login button and simulate a click
    const loginButton = screen.getByRole('button', { name: /log in/i });
    fireEvent.click(loginButton);

    // Verify that router.push was called with "/login"
    expect(mockRouter.push).toHaveBeenCalledWith('/login');
  });

  it('should pass axe accessibility test', async () => {
    const renderResult = render(<EmailConfirmed />);
    const container = renderResult.container;

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  })
});
