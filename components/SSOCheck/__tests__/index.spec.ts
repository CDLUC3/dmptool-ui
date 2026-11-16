import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe, toHaveNoViolations } from "jest-axe";
import { SSOCheckContainer } from "../index";
import { handleErrors } from "@/utils/index";
import logECS from "@/utils/clientLogger";

expect.extend(toHaveNoViolations);

const mockGetCsrfToken = jest.fn();
const mockSetIsAuthenticated = jest.fn();
const mockClearCache = jest.fn();
const mockRouter = { push: jest.fn() };

jest.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

jest.mock("@/context/CsrfContext", () => ({
  useCsrf: () => ({ getCsrfToken: mockGetCsrfToken }),
}));

jest.mock("@/context/AuthContext", () => ({
  useAuthContext: () => ({
    setIsAuthenticated: mockSetIsAuthenticated,
    clearCache: mockClearCache,
  }),
}));

jest.mock("@/i18n/routing", () => ({
  useRouter: () => mockRouter,
}));

jest.mock("@/utils/clientLogger", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("@/utils/index", () => ({
  ...jest.requireActual("@/utils/validation"),
  handleErrors: jest.fn(),
  routePath: (name: string) => `#/${name}`,
}));

jest.mock("@/components/Form/TypeAheadWithOther", () => ({
  useAffiliationSearch: () => ({
    suggestions: [],
    handleSearch: jest.fn(),
    isSearching: false,
    searchError: null,
  }),
  TypeAheadWithOther: ({ updateFormData, setOtherField, error, value }: {
    updateFormData: (id: string, value: string) => void;
    setOtherField: (v: boolean) => void;
    error?: string;
    value?: string;
  }) =>
    React.createElement(
      "div",
      { "data-testid": "typeaheadWithOther", "data-pending-value": value },
      React.createElement(
        "button",
        { type: "button", onClick: () => updateFormData("https://ror.org/abc", "Org") },
        "pick-affiliation"
      ),
      React.createElement(
        "button",
        {
          type: "button",
          onClick: () => {
            setOtherField(true);
            updateFormData("", "other");
          },
        },
        "pick-other"
      ),
      error ? React.createElement("span", null, error) : null
    ),
}));

jest.mock("@/components/PasswordRequirementsList", () => ({
  __esModule: true,
  default: () => React.createElement("div", { "data-testid": "pwReqs" }),
}));

const mockFetch = jest.fn();
const mockHandleErrors = handleErrors as jest.Mock;

const jsonResponse = (status: number, body: unknown = {}) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => body,
});

const renderComponent = (
  mode: "login" | "register" = "login",
  initialPendingSignup?: {
    email: string;
    affiliation?: string;
    displayName?: string;
    givenName?: string;
    surName?: string;
  }
) => render(React.createElement(SSOCheckContainer, { mode, initialPendingSignup }));

const getEmailInput = () => screen.getAllByLabelText("emailAddress")[0] as HTMLInputElement;

const submitEmail = async (user: ReturnType<typeof userEvent.setup>, email: string) => {
  await user.clear(getEmailInput());
  await user.type(getEmailInput(), email);
  await user.click(screen.getByTestId("actionContinue"));
};

describe("SSOCheckContainer", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetCsrfToken.mockResolvedValue("csrf-token");
    mockClearCache.mockResolvedValue(undefined);
    global.fetch = mockFetch;
    // A hash-only base URL lets jsdom handle the redirects, which it otherwise does not implement
    process.env.NEXT_PUBLIC_AUTH_ENDPOINT = "#auth";

    window.location.hash = "";
  });

  describe("email step", () => {
    it("renders the email input, continue button and mode link", () => {
      renderComponent("login");

      expect(getEmailInput()).toBeInTheDocument();
      expect(screen.getByTestId("actionContinue")).toHaveTextContent("continue");
      expect(screen.getByText("registerLink")).toBeInTheDocument();
      expect(screen.getByText("getHelpText")).toBeInTheDocument();
    });

    it("shows the login link when in register mode", () => {
      renderComponent("register");
      expect(screen.getByText("loginLink")).toBeInTheDocument();
    });

    it("shows a required error when email is empty and does not call the API", async () => {
      const user = userEvent.setup();
      renderComponent();

      await user.click(screen.getByTestId("actionContinue"));

      expect(await screen.findByText("emailRequired")).toBeInTheDocument();
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("shows an invalid email error and does not call the API", async () => {
      const user = userEvent.setup();
      renderComponent();

      await submitEmail(user, "not-an-email");

      expect(await screen.findByText("invalidEmail")).toBeInTheDocument();
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("clears the inline error when the user edits the email", async () => {
      const user = userEvent.setup();
      renderComponent();

      await submitEmail(user, "bad");
      expect(await screen.findByText("invalidEmail")).toBeInTheDocument();

      await user.type(getEmailInput(), "x");

      await waitFor(() => expect(screen.queryByText("invalidEmail")).not.toBeInTheDocument());
    });

    it("allows resubmitting after fixing an invalid email", async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValue(jsonResponse(404));
      renderComponent();

      await submitEmail(user, "bad");
      expect(await screen.findByText("invalidEmail")).toBeInTheDocument();
      expect(mockFetch).not.toHaveBeenCalled();

      await submitEmail(user, "user@example.com");

      await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1));
      expect(await screen.findByTestId("actionSubmit")).toBeInTheDocument();
    });

    it("posts the email with the CSRF token to the sso-check endpoint", async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValue(jsonResponse(404));
      renderComponent();

      await submitEmail(user, "user@example.com");

      await waitFor(() => expect(mockFetch).toHaveBeenCalled());
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe("#auth/sso-check");
      expect(options.method).toBe("POST");
      expect(options.credentials).toBe("include");
      expect(options.headers["X-CSRF-TOKEN"]).toBe("csrf-token");
      expect(JSON.parse(options.body)).toEqual({ email: "user@example.com" });
    });

    it("uses an empty CSRF header when no token is available", async () => {
      const user = userEvent.setup();
      mockGetCsrfToken.mockResolvedValue(null);
      mockFetch.mockResolvedValue(jsonResponse(404));
      renderComponent();

      await submitEmail(user, "user@example.com");

      await waitFor(() => expect(mockFetch).toHaveBeenCalled());
      expect(mockFetch.mock.calls[0][1].headers["X-CSRF-TOKEN"]).toBe("");
    });
  });

  describe("sso-check results", () => {
    it("moves to the sso step when the email belongs to an SSO provider", async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValue(
        jsonResponse(200, { entityId: "entity-1", displayName: "Test University", affiliationId: "aff-1" })
      );
      renderComponent();

      await submitEmail(user, "user@example.com");

      expect(await screen.findByText("Test University")).toBeInTheDocument();
      expect(screen.getByText("ssoReasoning")).toBeInTheDocument();
      expect(screen.getByTestId("actionSsoSubmit")).toBeInTheDocument();
      expect(screen.getByText("nonSsoLink")).toBeInTheDocument();
      expect(getEmailInput()).toHaveAttribute("readonly");
    });

    it("redirects to the SSO passthru URL when continuing on the sso step", async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValue(
        jsonResponse(200, { entityId: "entity-1", displayName: "Test University", affiliationId: "aff-1" })
      );
      renderComponent();

      await submitEmail(user, "user@example.com");
      await user.click(await screen.findByTestId("actionSsoSubmit"));

      const expected = new URLSearchParams({ email: "user@example.com", entityId: "entity-1" }).toString();
      await waitFor(() => expect(window.location.hash).toBe(`#auth/sso/passthru?${expected}`));
    });

    it("returns to the email step when Back is pressed on the sso step", async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValue(
        jsonResponse(200, { entityId: "entity-1", displayName: "Test University", affiliationId: "aff-1" })
      );
      renderComponent();

      await submitEmail(user, "user@example.com");
      await user.click(await screen.findByText("buttons.back"));

      expect(screen.getByTestId("actionContinue")).toBeInTheDocument();
      expect(screen.queryByTestId("actionSsoSubmit")).not.toBeInTheDocument();
    });

    it("switches to the non-sso form from the sso step", async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValue(
        jsonResponse(200, { entityId: "entity-1", displayName: "Test University", affiliationId: "aff-1" })
      );
      renderComponent();

      await submitEmail(user, "user@example.com");
      await user.click(await screen.findByText("nonSsoLink"));

      expect(screen.getByTestId("actionSubmit")).toBeInTheDocument();
      expect(screen.getByTestId("passInput")).toBeInTheDocument();
    });

    it("moves to the non-sso step on a 404 response", async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValue(jsonResponse(404));
      renderComponent();

      await submitEmail(user, "user@example.com");

      expect(await screen.findByTestId("passInput")).toBeInTheDocument();
      expect(screen.getByTestId("actionSubmit")).toBeInTheDocument();
    });

    it("delegates other error statuses to handleErrors", async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValue(jsonResponse(500));
      renderComponent();

      await submitEmail(user, "user@example.com");

      await waitFor(() => expect(mockHandleErrors).toHaveBeenCalledTimes(1));
      const args = mockHandleErrors.mock.calls[0];
      expect(args[3]).toBe(mockRouter);
      expect(args[4]).toBe("/login");;
    });

    it("passes the signup path to handleErrors in register mode", async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValue(jsonResponse(500));
      renderComponent("register");

      await submitEmail(user, "user@example.com");

      await waitFor(() => expect(mockHandleErrors).toHaveBeenCalled());
      expect(mockHandleErrors.mock.calls[0][4]).toBe("/signup");
    });

    it("logs, shows an error and falls back to non-sso when the request throws", async () => {
      const user = userEvent.setup();
      mockFetch.mockRejectedValue(new Error("network"));
      renderComponent();

      await submitEmail(user, "user@example.com");

      expect(await screen.findByText("ssoCheckError")).toBeInTheDocument();
      expect(screen.getByTestId("actionSubmit")).toBeInTheDocument();
      expect(logECS).toHaveBeenCalledWith("error", "SSO Check error", expect.any(Object));
    });

    it("clears previous errors on a new sso check", async () => {
      const user = userEvent.setup();
      mockFetch.mockRejectedValueOnce(new Error("network"));
      renderComponent();

      await submitEmail(user, "user@example.com");
      expect(await screen.findByText("ssoCheckError")).toBeInTheDocument();

      await user.click(screen.getByText("buttons.back"));
      mockFetch.mockResolvedValueOnce(jsonResponse(404));
      await user.click(screen.getByTestId("actionContinue"));

      await waitFor(() => expect(screen.queryByText("ssoCheckError")).not.toBeInTheDocument());
    });
  });

  describe("login (non-sso) step", () => {
    const goToLogin = async (user: ReturnType<typeof userEvent.setup>) => {
      mockFetch.mockResolvedValueOnce(jsonResponse(404));
      await submitEmail(user, "user@example.com");
      await screen.findByTestId("passInput");
    };

    it("renders the forgot password link", async () => {
      const user = userEvent.setup();
      renderComponent("login");
      await goToLogin(user);

      expect(screen.getByText("forgotPassword.title")).toBeInTheDocument();
    });

    it("shows a password required error and does not submit", async () => {
      const user = userEvent.setup();
      renderComponent("login");
      await goToLogin(user);
      mockFetch.mockClear();

      await user.click(screen.getByTestId("actionSubmit"));

      expect(await screen.findByText("passwordRequired")).toBeInTheDocument();
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("posts credentials to /sign-in and finishes login on success", async () => {
      const user = userEvent.setup();
      renderComponent("login");
      await goToLogin(user);
      mockFetch.mockResolvedValueOnce(jsonResponse(200));

      await user.type(screen.getByTestId("passInput").querySelector("input") ?? screen.getByLabelText("password"), "Secret123!");
      await user.click(screen.getByTestId("actionSubmit"));

      await waitFor(() => expect(window.location.hash).toBe("#/app.home"));
      const [url, options] = mockFetch.mock.calls[1];
      expect(url).toBe("#auth/sign-in");
      expect(JSON.parse(options.body)).toEqual({ email: "user@example.com", password: "Secret123!" });
      expect(mockClearCache).toHaveBeenCalled();
      expect(mockSetIsAuthenticated).toHaveBeenCalledWith(true);
    });

    it("shows a generic login error on a 4xx response", async () => {
      const user = userEvent.setup();
      renderComponent("login");
      await goToLogin(user);
      mockFetch.mockResolvedValueOnce(jsonResponse(401));

      await user.type(screen.getByLabelText("password"), "wrong");
      await user.click(screen.getByTestId("actionSubmit"));

      expect(await screen.findByText("loginError")).toBeInTheDocument();
      expect(window.location.hash).toBe("");
    });

    it("delegates 5xx responses to handleErrors", async () => {
      const user = userEvent.setup();
      renderComponent("login");
      await goToLogin(user);
      mockFetch.mockResolvedValueOnce(jsonResponse(500));

      await user.type(screen.getByLabelText("password"), "pw");
      await user.click(screen.getByTestId("actionSubmit"));

      await waitFor(() => expect(mockHandleErrors).toHaveBeenCalled());
      expect(mockHandleErrors.mock.calls[0][4]).toBe("/login");
    });

    it("shows a generic login error and logs when the request throws", async () => {
      const user = userEvent.setup();
      renderComponent("login");
      await goToLogin(user);
      mockFetch.mockRejectedValueOnce(new Error("boom"));

      await user.type(screen.getByLabelText("password"), "pw");
      await user.click(screen.getByTestId("actionSubmit"));

      expect(await screen.findByText("loginError")).toBeInTheDocument();
      expect(logECS).toHaveBeenCalledWith("error", "login error", expect.any(Object));
    });

    it("returns to the email step when Back is pressed", async () => {
      const user = userEvent.setup();
      renderComponent("login");
      await goToLogin(user);

      await user.click(screen.getByText("buttons.back"));

      expect(screen.getByTestId("actionContinue")).toBeInTheDocument();
      expect(screen.queryByTestId("passInput")).not.toBeInTheDocument();
    });
  });

  describe("register (non-sso) step", () => {
    const goToRegister = async (user: ReturnType<typeof userEvent.setup>) => {
      mockFetch.mockResolvedValueOnce(jsonResponse(404));
      await submitEmail(user, "user@example.com");
      await screen.findByText("firstName");
    };

    it("renders the registration fields", async () => {
      const user = userEvent.setup();
      renderComponent("register");
      await goToRegister(user);

      expect(screen.getByLabelText("firstName")).toBeInTheDocument();
      expect(screen.getByLabelText("lastName")).toBeInTheDocument();
      expect(screen.getByTestId("pwReqs")).toBeInTheDocument();
      expect(screen.getByText("acceptTerms")).toBeInTheDocument();
    });

    it("prepopulates the registration form from a verified pending SSO signup", () => {
      renderComponent("register", {
        email: "jane.doe@example.edu",
        affiliation: "https://ror.org/123",
        displayName: "Example University",
        givenName: "Jane",
        surName: "Doe",
      });

      expect(getEmailInput()).toHaveValue("jane.doe@example.edu");
      expect(screen.getByLabelText("firstName")).toHaveValue("Jane");
      expect(screen.getByLabelText("lastName")).toHaveValue("Doe");
      expect(screen.queryByLabelText("institution")).not.toBeInTheDocument();
      expect(screen.queryByLabelText("password")).not.toBeInTheDocument();
      expect(screen.queryByLabelText("passwordConfirm")).not.toBeInTheDocument();
      expect(screen.getByTestId("actionSubmit")).toBeInTheDocument();
    });

    it("disables submit until the terms are accepted", async () => {
      const user = userEvent.setup();
      renderComponent("register");
      await goToRegister(user);

      expect(screen.getByTestId("actionSubmit")).toBeDisabled();

      await user.click(screen.getByText("acceptTerms"));

      expect(screen.getByTestId("actionSubmit")).toBeEnabled();
    });

    it("shows validation errors for missing fields and does not submit", async () => {
      const user = userEvent.setup();
      renderComponent("register");
      await goToRegister(user);
      mockFetch.mockClear();

      await user.click(screen.getByText("acceptTerms"));
      await user.click(screen.getByTestId("actionSubmit"));

      expect(await screen.findByText("passwordRequirements")).toBeInTheDocument();
      expect(screen.getByText("institutionRequired")).toBeInTheDocument();
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("shows a mismatch error when the passwords differ", async () => {
      const user = userEvent.setup();
      renderComponent("register");
      await goToRegister(user);

      await user.type(screen.getByLabelText("firstName"), "Jane");
      await user.type(screen.getByLabelText("lastName"), "Doe");
      await user.click(screen.getByText("pick-affiliation"));
      await user.type(screen.getByLabelText("password"), "Str0ng!Passw0rd");
      await user.type(screen.getByLabelText("passwordConfirm"), "different");
      await user.click(screen.getByText("acceptTerms"));
      await user.click(screen.getByTestId("actionSubmit"));

      expect(await screen.findByText("messaging.errors.passMissMatch")).toBeInTheDocument();
    });

    it("posts the registration payload to /sign-up and finishes on success", async () => {
      const user = userEvent.setup();
      renderComponent("register");
      await goToRegister(user);
      mockFetch.mockResolvedValueOnce(jsonResponse(200));

      await user.type(screen.getByLabelText("firstName"), "Jane");
      await user.type(screen.getByLabelText("lastName"), "Doe");
      await user.click(screen.getByText("pick-affiliation"));
      await user.type(screen.getByLabelText("password"), "Str0ng!Passw0rd");
      await user.type(screen.getByLabelText("passwordConfirm"), "Str0ng!Passw0rd");
      await user.click(screen.getByText("acceptTerms"));
      await user.click(screen.getByTestId("actionSubmit"));

      await waitFor(() => expect(window.location.hash).toBe("#/app.home"));
      const [url, options] = mockFetch.mock.calls[1];
      expect(url).toBe("#auth/sign-up");
      expect(JSON.parse(options.body)).toMatchObject({
        givenName: "Jane",
        surName: "Doe",
        email: "user@example.com",
        affiliationId: "https://ror.org/abc",
        acceptedTerms: true,
      });
    });

    it("accepts an 'other' affiliation and shows the other-affiliation input", async () => {
      const user = userEvent.setup();
      renderComponent("register");
      await goToRegister(user);

      await user.click(screen.getByText("pick-other"));

      expect(screen.getByTestId("otherAffiliation")).toBeInTheDocument();
    });

    it("shows a generic register error on a 4xx response", async () => {
      const user = userEvent.setup();
      renderComponent("register");
      await goToRegister(user);
      mockFetch.mockResolvedValueOnce(jsonResponse(400));

      await user.type(screen.getByLabelText("firstName"), "Jane");
      await user.type(screen.getByLabelText("lastName"), "Doe");
      await user.click(screen.getByText("pick-affiliation"));
      await user.type(screen.getByLabelText("password"), "Str0ng!Passw0rd");
      await user.type(screen.getByLabelText("passwordConfirm"), "Str0ng!Passw0rd");
      await user.click(screen.getByText("acceptTerms"));
      await user.click(screen.getByTestId("actionSubmit"));

      expect(await screen.findByText("registerError")).toBeInTheDocument();
    });
  });

  describe("form submission", () => {
    it("ignores native submit when step is email and email is invalid", async () => {
      renderComponent();

      fireEvent.change(getEmailInput(), { target: { value: "bad" } });
      fireEvent.submit(getEmailInput().closest("form") as HTMLFormElement);

      expect(await screen.findByText("invalidEmail")).toBeInTheDocument();
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe("accessibility", () => {
    it("has no axe violations on the email step", async () => {
      const { container } = renderComponent();
      expect(await axe(container)).toHaveNoViolations();
    });
  });
});
