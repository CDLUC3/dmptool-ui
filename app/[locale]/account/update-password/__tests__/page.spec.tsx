import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { axe, toHaveNoViolations } from "jest-axe";
import { useQuery, useMutation } from "@apollo/client/react";

import { mockScrollIntoView, mockScrollTo } from "@/__mocks__/common";
import { MeDocument, UpdatePasswordDocument } from "@/generated/graphql";
import { handleApolloError } from "@/utils/apolloErrorHandler";
import { getPasswordRequirements } from "@/utils/validation";
import UpdatePasswordPage from "../page";

expect.extend(toHaveNoViolations);

const mockToastAdd = jest.fn();
jest.mock("@/context/ToastContext", () => ({
  useToast: jest.fn(() => ({
    add: mockToastAdd,
  })),
}));

jest.mock("@apollo/client/react", () => ({
  useQuery: jest.fn(),
  useMutation: jest.fn(),
}));

jest.mock("@/utils/validation", () => {
  const actual = jest.requireActual("@/utils/validation");
  return {
    ...actual,
    getPasswordRequirements: jest.fn(actual.getPasswordRequirements),
  };
});

jest.mock("@/utils/apolloErrorHandler", () => {
  const actual = jest.requireActual("@/utils/apolloErrorHandler");
  return {
    ...actual,
    handleApolloError: jest.fn(actual.handleApolloError),
  };
});

const mockUseQuery = useQuery as unknown as jest.Mock;
const mockUseMutation = useMutation as unknown as jest.Mock;
const mockUpdatePassword = jest.fn();
const realGetPasswordRequirements = jest.requireActual("@/utils/validation").getPasswordRequirements;

const VALID_PASSWORD = "ValidPass123!";
const USER_EMAIL = "admin@nsf.gov";

function setupMocks({
  queryLoading = false,
  email = USER_EMAIL,
  queryError,
}: {
  queryLoading?: boolean;
  email?: string | null;
  queryError?: Error;
} = {}) {
  mockUseQuery.mockImplementation((document) => {
    if (document === MeDocument) {
      return {
        data: email ? { me: { email } } : { me: null },
        loading: queryLoading,
        error: queryError,
      };
    }
    return { data: null, loading: false, error: undefined };
  });

  mockUseMutation.mockImplementation((document) => {
    if (document === UpdatePasswordDocument) {
      return [mockUpdatePassword, { loading: false }];
    }
    return [jest.fn(), { loading: false }];
  });
}

function fillPasswordFields({
  currentPassword = "Password123$9",
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
    mockUpdatePassword.mockReset();
    mockUpdatePassword.mockResolvedValue({
      data: { updatePassword: { id: 1, errors: {} } },
    });
    (getPasswordRequirements as jest.Mock).mockImplementation(realGetPasswordRequirements);
    (handleApolloError as jest.Mock).mockImplementation(
      jest.requireActual("@/utils/apolloErrorHandler").handleApolloError,
    );
    setupMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("shows a loading state while the current user is loading", () => {
    setupMocks({ queryLoading: true });

    render(<UpdatePasswordPage />);

    expect(screen.getByText("messaging.loading")).toBeInTheDocument();
    expect(screen.queryByTestId("change-password")).not.toBeInTheDocument();
  });

  it("does not submit when the new password is too short", async () => {
    render(<UpdatePasswordPage />);

    fillPasswordFields({ newPassword: "bad", confirmPassword: "bad" });
    submitForm();

    expect(await screen.findByText("messaging.fixBelow")).toBeInTheDocument();
    expect(mockUpdatePassword).not.toHaveBeenCalled();
  });

  it("does not submit when passwords do not match", async () => {
    render(<UpdatePasswordPage />);

    fillPasswordFields({ confirmPassword: "DifferentPass123!" });
    submitForm();

    expect(await screen.findByText("messages.errors.passwordsDoNotMatch")).toBeInTheDocument();
    expect(mockUpdatePassword).not.toHaveBeenCalled();
  });

  it("submits updatePassword and shows a success toast", async () => {
    render(<UpdatePasswordPage />);

    fillPasswordFields();
    submitForm();

    await waitFor(() => {
      expect(mockUpdatePassword).toHaveBeenCalledWith({
        variables: {
          email: USER_EMAIL,
          oldPassword: "Password123$9",
          newPassword: VALID_PASSWORD,
        },
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

  it("maps a server general error to incorrect current password", async () => {
    mockUpdatePassword.mockResolvedValueOnce({
      data: {
        updatePassword: {
          id: 1,
          errors: { general: "Unable to update the password at this time" },
        },
      },
    });

    render(<UpdatePasswordPage />);

    fillPasswordFields();
    submitForm();

    expect(await screen.findByText("messages.errors.incorrectCurrentPassword")).toBeInTheDocument();
    expect(screen.getByText("messages.errors.errorUpdatingPassword")).toBeInTheDocument();
    expect(mockToastAdd).not.toHaveBeenCalled();
  });

  it("shows the thrown error message when the mutation fails", async () => {
    mockUpdatePassword.mockRejectedValueOnce(new Error("network error"));

    render(<UpdatePasswordPage />);

    fillPasswordFields();
    submitForm();

    expect(await screen.findByText("network error")).toBeInTheDocument();
    expect(mockToastAdd).not.toHaveBeenCalled();
  });

  it("disables submit while the mutation is in flight", async () => {
    let resolveMutation: (value: unknown) => void = () => {};
    mockUpdatePassword.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveMutation = resolve;
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

    resolveMutation({ data: { updatePassword: { id: 1, errors: {} } } });

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

  it("shows a blocking message when the current user has no email", () => {
    setupMocks({ email: null });

    render(<UpdatePasswordPage />);

    expect(screen.getByText("messages.errors.emailRequiredToUpdatePassword")).toBeInTheDocument();
    expect(screen.queryByTestId("change-password")).not.toBeInTheDocument();
    expect(mockUpdatePassword).not.toHaveBeenCalled();
  });

  it("shows a blocking message when the current user cannot be loaded", () => {
    setupMocks({ email: null, queryError: new Error("failed to load me") });

    render(<UpdatePasswordPage />);

    expect(screen.getByText("messages.errors.errorLoadingAccount")).toBeInTheDocument();
    expect(screen.queryByText("messages.errors.emailRequiredToUpdatePassword")).not.toBeInTheDocument();
    expect(screen.queryByTestId("change-password")).not.toBeInTheDocument();
    expect(mockUpdatePassword).not.toHaveBeenCalled();
  });

  it("keeps loading when the current user query is aborted", () => {
    const abortError = new Error("The operation was aborted.");
    abortError.name = "AbortError";
    setupMocks({ email: null, queryError: abortError });

    render(<UpdatePasswordPage />);

    expect(screen.getByText("messaging.loading")).toBeInTheDocument();
    expect(screen.queryByTestId("change-password")).not.toBeInTheDocument();
  });

  it("maps a server password error onto the new password field", async () => {
    mockUpdatePassword.mockResolvedValueOnce({
      data: {
        updatePassword: {
          id: 1,
          errors: { password: "Password is too weak" },
        },
      },
    });

    render(<UpdatePasswordPage />);

    fillPasswordFields();
    submitForm();

    expect(await screen.findByText("Password is too weak")).toBeInTheDocument();
    expect(screen.getByText("messages.errors.errorUpdatingPassword")).toBeInTheDocument();
    expect(screen.queryByText("messages.errors.incorrectCurrentPassword")).not.toBeInTheDocument();
    expect(mockToastAdd).not.toHaveBeenCalled();
  });

  it("does not submit when confirm password is missing", async () => {
    render(<UpdatePasswordPage />);

    fillPasswordFields({ confirmPassword: "" });
    submitForm();

    expect(await screen.findByText("messages.errors.confirmPasswordRequired")).toBeInTheDocument();
    expect(mockUpdatePassword).not.toHaveBeenCalled();
  });

  it("does not submit when the new password is missing an uppercase letter", async () => {
    render(<UpdatePasswordPage />);

    fillPasswordFields({ newPassword: "validpass123!", confirmPassword: "validpass123!" });
    submitForm();

    expect(await screen.findByText("messages.errors.passwordMissingUppercase")).toBeInTheDocument();
    expect(mockUpdatePassword).not.toHaveBeenCalled();
  });

  it("ignores an aborted updatePassword request", async () => {
    const abortError = new Error("The operation was aborted.");
    abortError.name = "AbortError";
    mockUpdatePassword.mockRejectedValueOnce(abortError);

    render(<UpdatePasswordPage />);

    fillPasswordFields();
    submitForm();

    await waitFor(() => {
      expect(mockUpdatePassword).toHaveBeenCalled();
    });

    expect(screen.queryByText("messages.errors.errorUpdatingPassword")).not.toBeInTheDocument();
    expect(mockToastAdd).not.toHaveBeenCalled();
    expect(screen.getByTestId("current-password")).toHaveValue("Password123$9");
  });

  it("falls back to the short-password error when a requirement has no mapped message", async () => {
    (getPasswordRequirements as jest.Mock).mockImplementation(() => [{ key: "unknownRule", isMet: false }]);

    render(<UpdatePasswordPage />);

    fillPasswordFields();
    submitForm();

    expect(await screen.findByText("messages.errors.passwordTooShort")).toBeInTheDocument();
    expect(mockUpdatePassword).not.toHaveBeenCalled();
  });

  it("falls back to a generic error when the mutation error has no message", async () => {
    (handleApolloError as jest.Mock).mockReturnValueOnce({ wasRealError: true, message: "" });
    mockUpdatePassword.mockRejectedValueOnce(new Error(""));

    render(<UpdatePasswordPage />);

    fillPasswordFields();
    submitForm();

    expect(await screen.findByText("messages.errors.errorUpdatingPassword")).toBeInTheDocument();
    expect(mockToastAdd).not.toHaveBeenCalled();
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
