import React from 'react';

import { act, fireEvent, render, screen, waitFor, } from '@/utils/test-utils';
import SignUpPage from '../page';
import logECS from '@/utils/clientLogger';
import { useCsrf } from '@/context/CsrfContext';

//Need to import this useRouter after the jest.mock is in place
import { useRouter } from 'next/navigation';
import { fetchCsrfToken } from "@/utils/authHelper";
import mocksAffiliations from '@/__mocks__/common/mockAffiliations.json';



// Mock TypeAheadWithOther component
jest.mock('@/components/Form/TypeAheadWithOther', () => ({
  __esModule: true,
  TypeAheadWithOther: ({ updateFormData, error }: { updateFormData: (name: string, value: string) => void, error: string }) => (
    <div data-testid="type-ahead">
      <input
        data-testid="institution"
        type="text"
        name="institution"
        onChange={(e) => updateFormData("institution", e.target.value)}
      />
      <input
        data-testid="otherinst"
        type="text"
        name="otherAffiliation"
        onChange={(e) => updateFormData("otherAffiliation", e.target.value)}
      />
      {error && <div className="error">{error}</div>}
    </div>
  ),
  useAffiliationSearch: jest.fn(() => ({
    suggestions: mocksAffiliations,
    handleSearch: jest.fn(),
  })),
}));

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

const serverEndpoint = process.env.NEXT_PUBLIC_SERVER_ENDPOINT as string;
const signUpUrl = `${serverEndpoint}/apollo-signup`;

describe('SignUpPage', () => {
  const signupData = {
    givenName: "John",
    surName: "Smith",
    email: "test@example.com",
    password: "Secret -- 123",
    affiliationId: "otherAffiliation",
    otherAffiliationName: "",
    acceptedTerms: true
  }

  const doSteps = async () => {
    // Step 1
    fireEvent.change(screen.getByLabelText("emailAddress"), {
      target: { value: signupData.email },
    });
    fireEvent.click(screen.getByTestId("continue"));

    expect(screen.getByTestId("signup")).toBeInTheDocument();

    // Step 2
    fireEvent.change(screen.getByLabelText("firstName"), {
      target: { value: signupData.givenName },
    });
    fireEvent.change(screen.getByLabelText("lastName"), {
      target: { value: signupData.surName },
    });

    fireEvent.change(screen.getByTestId("institution"), {
      target: { value: "InstitutionID" },
    });

    fireEvent.change(screen.getByTestId("otherinst"), {
      target: { value: "Test" },
    });

    fireEvent.change(screen.getByTestId("pass"), {
      target: { value: signupData.password },
    });

    fireEvent.change(screen.getByTestId("confirmpass"), {
      target: { value: signupData.password },
    });

    const termsCheckbox = screen.getByLabelText("acceptTerms");
    fireEvent.click(termsCheckbox);
    expect(termsCheckbox).toBeChecked();
  }

  beforeEach(() => {
    HTMLElement.prototype.scrollIntoView = mockScrollIntoView;
    HTMLElement.prototype.focus = mockFocus;

    (useCsrf as jest.Mock).mockReturnValue({ csrfToken: 'mocked-csrf-token' });

    mockUseRouter.mockReturnValue({
      push: jest.fn(),
    })

    jest.spyOn(console, 'error').mockImplementation(() => { });
  });

  afterEach(() => {
    HTMLElement.prototype.scrollIntoView = jest.fn();
    HTMLElement.prototype.focus = jest.fn();
    jest.restoreAllMocks();
    jest.clearAllMocks();
  })

  it("renders the email step initially", () => {
    // renderWithProviders(<SignUpPage />);
    render(<SignUpPage />);
    expect(screen.getByLabelText("emailAddress")).toBeInTheDocument();
    expect(screen.getByTestId("continue")).toBeInTheDocument();
  });

  it("transitions to the profile step on valid email submission", async () => {
    // renderWithProviders(<SignUpPage />);
    act(() => {
      render(<SignUpPage />);
    });

    fireEvent.change(screen.getByLabelText("emailAddress"), {
      target: { value: "test@example.com" }
    });
    fireEvent.click(screen.getByTestId("continue"));

    await waitFor(() => {
      expect(screen.getByLabelText("firstName")).toBeInTheDocument();
      expect(screen.getByLabelText("lastName")).toBeInTheDocument();
      expect(screen.getByTestId("institution")).toBeInTheDocument();
      expect(screen.getByLabelText("acceptTerms")).toBeInTheDocument();
      expect(screen.getByTestId("pass")).toBeInTheDocument();
      expect(screen.getByTestId("confirmpass")).toBeInTheDocument();
    });
  });

  it("should go back to step 1 if user clicks \'Back\' button", async () => {
    act(() => {
      render(<SignUpPage />);
    });

    fireEvent.change(screen.getByLabelText("emailAddress"), {
      target: { value: "test@example.com" }
    });
    fireEvent.click(screen.getByTestId("continue"));

    await waitFor(() => {
      expect(screen.getByLabelText("firstName")).toBeInTheDocument();
    });

    const backBtn = screen.getByText('buttons.back');
    fireEvent.click(backBtn);

    await waitFor(() => {
      expect(screen.getByLabelText("emailAddress")).toBeInTheDocument();
      expect(screen.getByTestId("continue")).toBeInTheDocument();
    });
  });

  it("submit button is disabled till terms accepted", async () => {
    // renderWithProviders(<SignUpPage />);
    render(<SignUpPage />);

    // Step 1 Fields
    fireEvent.change(screen.getByLabelText("emailAddress"), {
      target: { value: "test@example.com" },
    });
    fireEvent.click(screen.getByTestId("continue"));

    await waitFor(() => {
      expect(screen.getByLabelText("acceptTerms")).toBeInTheDocument();
      expect(screen.getByTestId("signup")).toBeInTheDocument();
    });

    const termsCheckbox = screen.getByLabelText("acceptTerms");
    const signupBtn = screen.getByTestId("signup");

    expect(termsCheckbox).not.toBeChecked();
    expect(signupBtn).toBeDisabled();

    fireEvent.click(termsCheckbox);
    expect(termsCheckbox).toBeChecked();
    expect(signupBtn).not.toBeDisabled();
  });

  it("makes the backend call on final signin", async () => {
    jest.spyOn(global, 'fetch').mockImplementation((url) => {
      if (url === signUpUrl) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ message: 'mock message' })
        } as unknown as Response);
      }

      return Promise.reject(new Error('Unknown URL'));
    });

    render(<SignUpPage />);

    doSteps();

    const signupBtn = screen.getByTestId("signup");
    expect(signupBtn).toBeEnabled();

    fireEvent.click(signupBtn);

    await waitFor(() => {
      // expect(mockUseRouter().push).toHaveBeenCalledWith('/');
      expect(global.fetch).toHaveBeenCalledWith(signUpUrl, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': 'mocked-csrf-token',
        },
        body: JSON.stringify(signupData),
      });
    });
  });

  it("should display error if password does not equal confirmPassword", async () => {

    render(<SignUpPage />);

    // Step 1
    fireEvent.change(screen.getByLabelText("emailAddress"), {
      target: { value: signupData.email },
    });
    fireEvent.click(screen.getByTestId("continue"));

    expect(screen.getByTestId("signup")).toBeInTheDocument();

    // Step 2
    fireEvent.change(screen.getByLabelText("firstName"), {
      target: { value: signupData.givenName },
    });
    fireEvent.change(screen.getByLabelText("lastName"), {
      target: { value: signupData.surName },
    });

    fireEvent.change(screen.getByTestId("institution"), {
      target: { value: "InstitutionID" },
    });

    fireEvent.change(screen.getByTestId("otherinst"), {
      target: { value: "Test" },
    });

    fireEvent.change(screen.getByTestId("pass"), {
      target: { value: signupData.password },
    });

    fireEvent.change(screen.getByTestId("confirmpass"), {
      target: { value: "DifferentPassword" },
    });

    const termsCheckbox = screen.getByLabelText("acceptTerms");
    fireEvent.click(termsCheckbox);
    expect(termsCheckbox).toBeChecked();

    const signupBtn = screen.getByTestId("signup");
    fireEvent.click(signupBtn);

    await waitFor(() => {
      expect(screen.getByText('passMissMatch')).toBeInTheDocument();
    });
  });

  it("should display error if institution or affiliation is missing", async () => {

    render(<SignUpPage />);

    // Step 1
    fireEvent.change(screen.getByLabelText("emailAddress"), {
      target: { value: signupData.email },
    });
    fireEvent.click(screen.getByTestId("continue"));

    expect(screen.getByTestId("signup")).toBeInTheDocument();

    // Step 2
    fireEvent.change(screen.getByLabelText("firstName"), {
      target: { value: signupData.givenName },
    });
    fireEvent.change(screen.getByLabelText("lastName"), {
      target: { value: signupData.surName },
    });

    fireEvent.change(screen.getByTestId("institution"), {
      target: { value: "" },
    });

    fireEvent.change(screen.getByTestId("otherinst"), {
      target: { value: "" },
    });

    fireEvent.change(screen.getByTestId("pass"), {
      target: { value: signupData.password },
    });

    fireEvent.change(screen.getByTestId("confirmpass"), {
      target: { value: signupData.password },
    });

    const termsCheckbox = screen.getByLabelText("acceptTerms");
    fireEvent.click(termsCheckbox);
    expect(termsCheckbox).toBeChecked();

    const signupBtn = screen.getByTestId("signup");
    fireEvent.click(signupBtn);

    await waitFor(() => {
      expect(screen.getByText('institutionRequired')).toBeInTheDocument();
    });
  });

  it('should handle 403 error by calling fetchCsrfToken', async () => {
    jest.spyOn(global, 'fetch').mockImplementation(() => {
      return Promise.resolve({
        ok: false,
        status: 403,
        json: () => Promise.resolve({ success: false, message: 'Invalid CSRF token' }),
      } as unknown as Response);
    });

    render(<SignUpPage />);

    doSteps();
    fireEvent.click(screen.getByTestId("signup"));

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
        json: () => Promise.resolve({ success: false, message: 'Internal Server Error' }),
      } as unknown as Response);
    });

    render(<SignUpPage />);

    doSteps();
    fireEvent.click(screen.getByTestId("signup"));

    // Check that user is redirected to 500 error page
    await waitFor(() => {
      expect(mockUseRouter().push).toHaveBeenCalledWith('/500-error')
    })
  });

  it('should render correct errors to user for a 400 error', async () => {
    jest.spyOn(global, 'fetch').mockImplementation(() => {
      return Promise.resolve({
        ok: false,
        status: 400,
        json: () => Promise.resolve({
          success: false,
          message: 'Invalid email address| Password is required',
        }),
      } as unknown as Response);
    });

    render(<SignUpPage />);

    doSteps();
    fireEvent.click(screen.getByTestId("signup"));

    //Check that error is rendered
    await waitFor(() => {
      const errorElement = screen.getByText(/invalid email address/i);
      expect(errorElement).toBeInTheDocument();
    })
  });

  it('should render default error message when no response', async () => {
    jest.spyOn(global, 'fetch').mockImplementation(() => {
      return Promise.resolve(undefined as unknown as Response);
    });

    render(<SignUpPage />);

    doSteps();
    fireEvent.click(screen.getByTestId("signup"));

    await waitFor(() => {
      const errorDiv = screen.getByText('An unexpected error occurred. Please try again.').closest('div');
      expect(errorDiv).toHaveClass('error');
      expect(errorDiv).toContainHTML('<p>An unexpected error occurred. Please try again.</p>')
    });
  });

  it('should handle error returned from the fetch', async () => {
    jest.spyOn(global, 'fetch').mockImplementation(() => {
      return Promise.reject(new Error('Unknown URL'));
    });

    render(<SignUpPage />);

    doSteps();
    fireEvent.click(screen.getByTestId("signup"));

    // Check that error logged
    await waitFor(() => {
      expect(logECS).toHaveBeenCalledWith(
        'error',
        'Signup error',
        expect.objectContaining({
          error: expect.anything(),
          url: { path: '/apollo-signup' },
        })
      )
    });
  });
});
