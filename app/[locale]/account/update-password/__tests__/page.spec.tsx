import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { axe, toHaveNoViolations } from "jest-axe";

import { mockScrollIntoView, mockScrollTo } from "@/__mocks__/common";
import { useCsrf } from "@/context/CsrfContext";
import { getPasswordRequirements } from "@/utils/validation";
import logECS from "@/utils/clientLogger";
import UpdatePasswordPage from "../page";

expect.extend(toHaveNoViolations);

const mockToastAdd = jest.fn();
jest.mock("@/context/ToastContext", () => ({
  useToast: jest.fn(() => ({
    add: mockToastAdd,
  })),
}));
jest.mock('@/i18n/routing', () => ({
  Link: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>{children}</a>
  ),
  useRouter: jest.fn(() => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() })),
}));

jest.mock("@/context/CsrfContext", () => ({
  useCsrf: jest.fn(),
}));

jest.mock("@/utils/clientLogger", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("@/utils/validation", () => {
  const actual = jest.requireActual("@/utils/validation");
  return {
    ...actual,
    getPasswordRequirements: jest.fn(actual.getPasswordRequirements),
  };
});

const mockFetch = jest.fn();
global.fetch = mockFetch as unknown as typeof fetch;

const mockGetCsrfToken = jest.fn();
const realGetPasswordRequirements = jest.requireActual("@/utils/validation").getPasswordRequirements;

const CHANGE_PASSWORD_URL = `${process.env.NEXT_PUBLIC_AUTH_ENDPOINT}/change-password`;
const CURRENT_PASSWORD = "Password123$9";
const VALID_PASSWORD = "ValidPass123!";

function mockResponse(status: number, body: unknown = { success: status === 200, message: "ok" }) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: jest.fn().mockResolvedValue(body),
  };
}

function fillPasswordFields({
  currentPassword = CURRENT_PASSWORD,
  newPassword = VALID_PASSWORD,
  confirmPassword = VALID_PASSWORD,
}: {
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
} = {}) {
  fireEvent.change(screen.getByTestId("current-password"), { target: { value: currentPassword } });
  fireEvent.change(screen.getByTestId("new-password"), { target: { value: newPassword } });
  fireEvent.change(screen.getByTestId("confirm-password"), { target: { value: confirmPassword } });
}

function submitForm() {
  fireEvent.click(screen.getByTestId("change-password"));
}

describe("UpdatePasswordPage", () => {
  beforeEach(() => {
    HTMLElement.prototype.scrollIntoView = mockScrollIntoView;
    mockScrollTo();
    mockToastAdd.mockClear();
    mockFetch.mockReset();
    mockFetch.mockResolvedValue(mockResponse(200));
    mockGetCsrfToken.mockReset();
    mockGetCsrfToken.mockResolvedValue("mocked-csrf-token");
    (useCsrf as jest.Mock).mockReturnValue({ getCsrfToken: mockGetCsrfToken });
    (getPasswordRequirements as jest.Mock).mockImplementation(realGetPasswordRequirements);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("does not submit when the new password is too short", async () => {
    render(<UpdatePasswordPage />);

    fillPasswordFields({ newPassword: "bad", confirmPassword: "bad" });
    submitForm();

    expect(await screen.findByText("messaging.fixBelow")).toBeInTheDocument();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("does not submit when passwords do not match", async () => {
    render(<UpdatePasswordPage />);

    fillPasswordFields({ confirmPassword: "DifferentPass123!" });
    submitForm();

    expect(await screen.findByText("messages.errors.passwordsDoNotMatch")).toBeInTheDocument();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("posts to the auth service change-password endpoint and shows a success toast", async () => {
    render(<UpdatePasswordPage />);

    fillPasswordFields();
    submitForm();

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(CHANGE_PASSWORD_URL, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-TOKEN": "mocked-csrf-token",
        },
        body: JSON.stringify({
          currentPassword: CURRENT_PASSWORD,
          newPassword: VALID_PASSWORD,
          newPasswordConfirmation: VALID_PASSWORD,
        }),
      });
    });

    await waitFor(() => {
      expect(mockToastAdd).toHaveBeenCalledWith("messages.passwordUpdateSuccess", {
        type: "success",
        timeout: 3000,
      });
    });

    expect(screen.getByTestId("current-password")).toHaveValue("");
    expect(screen.getByTestId("new-password")).toHaveValue("");
    expect(screen.getByTestId("confirm-password")).toHaveValue("");
  });

  it("retries with a fresh CSRF token when the first one is rejected", async () => {
    mockGetCsrfToken
      .mockResolvedValueOnce("used-csrf-token")
      .mockResolvedValueOnce("fresh-csrf-token");
    mockFetch
      .mockResolvedValueOnce(mockResponse(403, { message: "Invalid CSRF token" }))
      .mockResolvedValueOnce(mockResponse(200));

    render(<UpdatePasswordPage />);

    fillPasswordFields();
    submitForm();

    await waitFor(() => {
      expect(mockToastAdd).toHaveBeenCalledWith("messages.passwordUpdateSuccess", {
        type: "success",
        timeout: 3000,
      });
    });

    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(mockFetch.mock.calls[1][1].headers["X-CSRF-TOKEN"]).toBe("fresh-csrf-token");
  });

  it("maps an invalid current password 401 onto the current password field", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(401, { success: false, message: "Invalid current password" }));

    render(<UpdatePasswordPage />);

    fillPasswordFields();
    submitForm();

    expect(await screen.findByText("messages.errors.incorrectCurrentPassword")).toBeInTheDocument();
    expect(screen.getByText("messages.errors.errorUpdatingPassword")).toBeInTheDocument();
    expect(screen.getByTestId("current-password")).toHaveValue(CURRENT_PASSWORD);
    expect(mockToastAdd).not.toHaveBeenCalled();
  });

  it("maps an invalid password format 400 onto the new password field", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(400, { success: false, message: "Invalid password format" }));

    render(<UpdatePasswordPage />);

    fillPasswordFields();
    submitForm();

    expect(await screen.findByText("messages.errors.passwordDoesNotMeetRequirements")).toBeInTheDocument();
    expect(screen.getByText("messages.errors.errorUpdatingPassword")).toBeInTheDocument();
    expect(screen.queryByText("messages.errors.incorrectCurrentPassword")).not.toBeInTheDocument();
    expect(mockToastAdd).not.toHaveBeenCalled();
  });

  it("maps a passwords do not match 400 onto the confirm password field", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(400, { success: false, message: "Passwords do not match" }));

    render(<UpdatePasswordPage />);

    fillPasswordFields();
    submitForm();

    expect(await screen.findByText("messages.errors.passwordsDoNotMatch")).toBeInTheDocument();
    expect(screen.getByText("messages.errors.errorUpdatingPassword")).toBeInTheDocument();
    expect(mockToastAdd).not.toHaveBeenCalled();
  });

  it("shows a general error and logs when the access token is invalid", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(401, { success: false, message: "Invalid access token" }));

    render(<UpdatePasswordPage />);

    fillPasswordFields();
    submitForm();

    expect(await screen.findByText("messages.errors.errorUpdatingPassword")).toBeInTheDocument();
    expect(screen.queryByText("messages.errors.incorrectCurrentPassword")).not.toBeInTheDocument();
    expect(logECS).toHaveBeenCalledWith("error", "updatePassword", expect.objectContaining({
      status: 401,
      message: "Invalid access token",
    }));
    expect(mockToastAdd).not.toHaveBeenCalled();
  });

  it("shows a general error when the error response has no JSON body", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: jest.fn().mockRejectedValue(new Error("Unexpected token")),
    });

    render(<UpdatePasswordPage />);

    fillPasswordFields();
    submitForm();

    expect(await screen.findByText("messages.errors.errorUpdatingPassword")).toBeInTheDocument();
    expect(mockToastAdd).not.toHaveBeenCalled();
  });

  it("shows a general error when the request fails", async () => {
    mockFetch.mockRejectedValueOnce(new TypeError("Failed to fetch"));

    render(<UpdatePasswordPage />);

    fillPasswordFields();
    submitForm();

    expect(await screen.findByText("messages.errors.errorUpdatingPassword")).toBeInTheDocument();
    expect(screen.queryByText("Failed to fetch")).not.toBeInTheDocument();
    expect(logECS).toHaveBeenCalledWith("error", "updatePassword", expect.objectContaining({
      error: expect.any(TypeError),
    }));
    expect(mockToastAdd).not.toHaveBeenCalled();
  });

  it("disables submit while the request is in flight", async () => {
    let resolveFetch: (value: unknown) => void = () => { };
    mockFetch.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveFetch = resolve;
        }),
    );

    render(<UpdatePasswordPage />);

    fillPasswordFields();
    submitForm();

    const submitButton = screen.getByTestId("change-password");
    await waitFor(() => {
      expect(submitButton).toBeDisabled();
      expect(submitButton).toHaveTextContent("btnChangingPassword");
    });

    resolveFetch(mockResponse(200));

    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    });
  });

  it("clears a field error when the user types", async () => {
    render(<UpdatePasswordPage />);

    submitForm();
    expect(await screen.findByText("messages.errors.currentPasswordRequired")).toBeInTheDocument();

    fireEvent.change(screen.getByTestId("current-password"), { target: { value: "test" } });
    expect(screen.queryByText("messages.errors.currentPasswordRequired")).not.toBeInTheDocument();
  });

  it("does not submit when confirm password is missing", async () => {
    render(<UpdatePasswordPage />);

    fillPasswordFields({ confirmPassword: "" });
    submitForm();

    expect(await screen.findByText("messages.errors.confirmPasswordRequired")).toBeInTheDocument();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("does not submit when the new password is missing an uppercase letter", async () => {
    render(<UpdatePasswordPage />);

    fillPasswordFields({ newPassword: "validpass123!", confirmPassword: "validpass123!" });
    submitForm();

    expect(await screen.findByText("messages.errors.passwordMissingUppercase")).toBeInTheDocument();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("falls back to the short-password error when a requirement has no mapped message", async () => {
    (getPasswordRequirements as jest.Mock).mockImplementation(() => [{ key: "unknownRule", isMet: false }]);

    render(<UpdatePasswordPage />);

    fillPasswordFields();
    submitForm();

    expect(await screen.findByText("messages.errors.passwordTooShort")).toBeInTheDocument();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<UpdatePasswordPage />);

    await waitFor(() => {
      expect(screen.getByLabelText(/currentPassword/)).toBeInTheDocument();
    });

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
