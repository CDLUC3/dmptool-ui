import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import logECS from '@/utils/clientLogger';
import LoginPage from '../page';

//Need to import this useRouter after the jest.mock is in place
import { useRouter } from 'next/navigation';
import { fetchCsrfToken } from "@/utils/authHelper";
import { useCsrf } from '@/context/CsrfContext';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn()
}));

jest.mock('@/utils/clientLogger', () => ({
  __esModule: true,
  default: jest.fn()
}))

jest.mock('@/utils/authHelper', () => ({
  refreshAuthTokens: jest.fn(async () => Promise.resolve({ response: true, message: 'ok' })),
  fetchCsrfToken: jest.fn(async () => Promise.resolve({ response: true, message: 'ok' })),
}));

jest.mock('@/context/AuthContext', () => ({
  useAuthContext: jest.fn(() => ({
    setIsAuthenticated: jest.fn(),
    clearCache: jest.fn().mockResolvedValue(undefined),
  })),
}));

jest.mock('@/context/CsrfContext', () => ({
  CsrfProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="mock-csrf-provider">{children}</div>
  ),
  useCsrf: jest.fn(),
}));

// Create a mock for scrollIntoView and focus
const mockScrollIntoView = jest.fn();
const mockFocus = jest.fn();

const mockUseRouter = useRouter as jest.Mock;
const mockFetchCsrfToken = fetchCsrfToken as jest.Mock;

// Mock fetch globally
global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;


describe('LoginPage', () => {
  const doSteps = async () => {
    // Step 1
    fireEvent.change(screen.getByTestId("emailInput"), {
      target: { value: "test@test.com" }
    });

    fireEvent.click(screen.getByTestId("actionContinue"));
    expect(screen.getByTestId("passInput")).toBeInTheDocument();

    // Step 2
    fireEvent.change(screen.getByTestId("passInput"), {
      target: { value: "Secret -- 123" },
    });
  }

  beforeEach(() => {
    HTMLElement.prototype.scrollIntoView = mockScrollIntoView;
    HTMLElement.prototype.focus = mockFocus;
    mockUseRouter.mockReturnValue({
      push: jest.fn(),
    });

    (useCsrf as jest.Mock).mockReturnValue({ csrfToken: 'mocked-csrf-token' });

    jest.spyOn(console, 'error').mockImplementation(() => { });
  });

  afterEach(() => {
    HTMLElement.prototype.scrollIntoView = jest.fn();
    HTMLElement.prototype.focus = jest.fn();
    jest.restoreAllMocks();
    jest.clearAllMocks();
  })

  it("should render the email step initially", async () => {
    // renderWithProviders(<LoginPage />);
    render(<LoginPage />);
    expect(screen.getByTestId("emailInput")).toBeInTheDocument();
    expect(screen.getByTestId("actionContinue")).toBeInTheDocument();
  });

  it("should transition to the password step", async () => {
    // renderWithProviders(<LoginPage />);
    render(<LoginPage />);

    fireEvent.change(screen.getByTestId("emailInput"), {
      target: { value: "test@test.com" }
    });

    fireEvent.click(screen.getByTestId("actionContinue"));
    await waitFor(() => {
      expect(screen.getByTestId("passInput")).toBeInTheDocument();
      expect(screen.getByTestId("actionSubmit")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "buttons.back" })).toBeInTheDocument();
    });

    // Ensure that email field is read-only on this step
    const emailField = screen.getByTestId("emailInput");
    expect(emailField).toHaveAttribute('readonly');
  });

  it("should show reset password link on the password step", async () => {
    render(<LoginPage />);

    fireEvent.change(screen.getByTestId("emailInput"), {
      target: { value: "test@test.com" }
    });

    fireEvent.click(screen.getByTestId("actionContinue"));

    await waitFor(() => {
      expect(screen.getByRole("link", { name: "resetPassword" })).toBeInTheDocument();
    });

    // TODO: enable when reset password flow is implemented
    // expect(screen.getByRole("link", { name: "resetPassword" })).toHaveAttribute("href", expect.not.stringContaining("#"));
  });

  it("should redirect to home on successful login", async () => {
    jest.spyOn(global, 'fetch').mockImplementation((url) => {
      if (url === 'http://localhost:4000/apollo-signin') {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ message: 'mock message' })
        } as unknown as Response);
      }

      return Promise.reject(new Error('Unknown URL'));
    });

    // renderWithProviders(<LoginPage />);
    render(<LoginPage />);

    doSteps();
    fireEvent.click(screen.getByTestId("actionSubmit"));

    await waitFor(() => {
      //Assert that the fetch calls were made with the correct arguments
      expect(global.fetch).toHaveBeenCalledWith('http://localhost:4000/apollo-signin', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': 'mocked-csrf-token',
        },
        body: JSON.stringify({
          email: 'test@test.com',
          password: 'Secret -- 123',
        }),
      });
    });

    // Check that user is redirected to home page
    await waitFor(() => {
      expect(mockUseRouter().push).toHaveBeenCalledWith('/');
    });
  });

  it('should render login form, save token in cookie, and redirect to home page', async () => {
    jest.spyOn(global, 'fetch').mockImplementation((url) => {
      if (url === 'http://localhost:4000/apollo-signin') {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ message: 'mock message' })
        } as unknown as Response);
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    // renderWithProviders(<LoginPage />);
    render(<LoginPage />);

    doSteps();
    fireEvent.click(screen.getByTestId("actionSubmit"));

    await waitFor(() => {
      //Assert that the fetch calls were made with the correct arguments
      expect(global.fetch).toHaveBeenCalledWith('http://localhost:4000/apollo-signin', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': 'mocked-csrf-token',
        },
        body: JSON.stringify({
          email: 'test@test.com',
          password: 'Secret -- 123',
        }),
      });
    })

    // Check that user is redirected to home page
    await waitFor(() => {
      expect(mockUseRouter().push).toHaveBeenCalledWith('/');
    })
  });

  it('should initially disable submit button after submitting form until response is returned ', async () => {
    jest.spyOn(global, 'fetch').mockImplementation((url) => {
      if (url === 'http://localhost:4000/apollo-signin') {
        return Promise.resolve({
          ok: true,
          status: 200,
        } as unknown as Response);
      }

      return Promise.reject(new Error('Unknown URL'));
    });

    // renderWithProviders(<LoginPage />);
    render(<LoginPage />);

    doSteps();
    const submitBtn = screen.getByTestId("actionSubmit");
    fireEvent.click(submitBtn);
    expect(submitBtn).toBeDisabled();
    expect(submitBtn).toHaveTextContent('...');

    await waitFor(() => {
      expect(submitBtn).not.toBeDisabled();
      expect(submitBtn).toHaveTextContent('login');
    });
  });

  it('should handle 403 error by calling fetchCsrfToken and displaying error on page', async () => {
    jest.spyOn(global, 'fetch').mockImplementation(() => {
      return Promise.resolve({
        ok: false,
        status: 403,
        json: () => Promise.resolve({ success: false, message: 'Invalid CSRF token' }),
      } as unknown as Response);
    });

    // renderWithProviders(<LoginPage />);
    render(<LoginPage />);

    doSteps();
    fireEvent.click(screen.getByTestId("actionSubmit"));

    // Check that user is redirected to 500 error page
    await waitFor(() => {
      expect(mockFetchCsrfToken).toHaveBeenCalled();
    })
  });

  it('should handle 500 error', async () => {
    jest.spyOn(global, 'fetch').mockImplementation(() => {
      return Promise.resolve({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ success: false, message: 'Internal server error' }),
      } as unknown as Response);
    });

    // renderWithProviders(<LoginPage />);
    render(<LoginPage />);

    doSteps();
    fireEvent.click(screen.getByTestId("actionSubmit"));

    // Check that user is redirected to 500 error page
    await waitFor(() => {
      expect(mockUseRouter().push).toHaveBeenCalledWith('/500-error')
    })
  });

  it('should handle fetch error', async () => {
    jest.spyOn(global, 'fetch').mockImplementation(url => {
      if (url === 'http://localhost:4000/login') {
        return Promise.resolve({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          json: () => Promise.resolve({}),
        } as unknown as Response);
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    // renderWithProviders(<LoginPage />);
    render(<LoginPage />);

    doSteps();
    fireEvent.click(screen.getByTestId("actionSubmit"));

    // //Check that error logged
    await waitFor(() => {
      expect(logECS).toHaveBeenCalledWith(
        'error',
        'Login error',
        expect.objectContaining({
          error: expect.anything(),
          url: { path: '/apollo-signin' },
        })
      )
    })
  })

  // it('should pass axe accessibility test', async () => {
  //   const { container } = renderWithProviders(<LoginPage />);
  //   // const { container } = render(<LoginPage />)

  //   await waitFor(() => {
  //     expect(screen.getByTestId("emailInput")).toBeInTheDocument();
  //   });

  //   await act(async () => {
  //     const results = await axe(container);
  //     expect(results).toHaveNoViolations();
  //   })
  // })
})
