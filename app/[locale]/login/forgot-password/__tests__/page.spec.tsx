/**eslint-disable @typescript-eslint/no-explicit-any */
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ForgotPassword from "../page";

import { useMutation } from "@apollo/client/react";
import { useRouter } from "next/navigation";
import { axe, toHaveNoViolations } from "jest-axe";

expect.extend(toHaveNoViolations);

jest.mock("@apollo/client/react");
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

jest.mock("next-intl", () => ({
  useTranslations: () => {
    const t = (key: string) => key;

    t.rich = (_key: string, values: any) =>
      values.link("Need help?");

    return t;
  },
}));

const sendPasswordResetEmailMutation = jest.fn();
const push = jest.fn();

describe("ForgotPassword Component", () => {

  beforeEach(() => {
    jest.clearAllMocks();

    (useRouter as jest.Mock).mockReturnValue({
      push,
    });

    (useMutation as jest.Mock).mockReturnValue([
      sendPasswordResetEmailMutation,
      {
        loading: false,
      },
    ]);
  });

  it("should submit a valid email", async () => {
    sendPasswordResetEmailMutation.mockResolvedValue({});

    render(<ForgotPassword />);

    await userEvent.type(
      screen.getByTestId("emailInput"),
      "test@example.com"
    );

    await userEvent.click(screen.getByTestId("actionContinue"));

    await waitFor(() =>
      expect(sendPasswordResetEmailMutation).toHaveBeenCalledWith({
        variables: {
          email: "test@example.com",
        },
      })
    );
  });

  it("should not submit an invalid email", async () => {
    render(<ForgotPassword />);

    await userEvent.type(
      screen.getByTestId("emailInput"),
      "not-an-email"
    );

    await userEvent.click(screen.getByTestId("actionContinue"));

    expect(sendPasswordResetEmailMutation).not.toHaveBeenCalled();

    expect(
      screen.getByText("invalidEmail")
    ).toBeInTheDocument();
  });

  it("should navigate back to login", async () => {
    render(<ForgotPassword />);

    await userEvent.click(
      screen.getByRole("button", {
        name: "buttons.backToLogin",
      })
    );

    expect(push).toHaveBeenCalledWith("/en-US/login");
  });

  it("should show the sending state while submitting", async () => {
    let resolvePromise: () => void;

    sendPasswordResetEmailMutation.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolvePromise = resolve;
        })
    );

    render(<ForgotPassword />);

    await userEvent.type(
      screen.getByTestId("emailInput"),
      "test@example.com"
    );

    await userEvent.click(screen.getByTestId("actionContinue"));

    expect(
      screen.getByRole("button", {
        name: "buttons.sending",
      })
    ).toBeDisabled();

    resolvePromise!();

    await waitFor(() =>
      expect(sendPasswordResetEmailMutation).toHaveBeenCalled()
    );
  });

  it("should render the help link", () => {
    render(<ForgotPassword />);

    const link = screen.getByRole("link");

    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/en-US/contact");
    expect(
      screen.getByRole("link", {
        name: /help/i,
      })
    ).toBeInTheDocument();
  });

  it("should pass axe accessibility test", async () => {
    const { container } = render(
      <ForgotPassword />
    );
    await act(async () => {
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  })
})
