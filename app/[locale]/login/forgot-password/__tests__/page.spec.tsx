/* eslint-disable @typescript-eslint/no-explicit-any */
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ForgotPassword from "../page";

import { useRouter } from "next/navigation";
import { useCsrf } from "@/context/CsrfContext";
import { axe, toHaveNoViolations } from "jest-axe";
import React from "react";

expect.extend(toHaveNoViolations);

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

jest.mock("next-intl", () => ({
  useTranslations: () => {
    const t = (key: string) => key;
    /**eslint-disable-next-line @typescript-eslint/no-explicit-any */
    t.rich = (_key: string, values: any) =>
      values.link("Need help?");

    return t;
  },
}));

jest.mock("@/context/CsrfContext", () => ({
  CsrfProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="mock-csrf-provider">{children}</div>,
  useCsrf: jest.fn(),
}));

const push = jest.fn();
const passwordResetTokenUrl = `${process.env.NEXT_PUBLIC_AUTH_ENDPOINT}/password-reset/token`;

describe("ForgotPassword Component", () => {

  beforeEach(() => {
    jest.clearAllMocks();

    (useRouter as jest.Mock).mockReturnValue({
      push,
    });
    (useCsrf as jest.Mock).mockReturnValue({ csrfToken: "mocked-csrf-token" });
    global.fetch = jest.fn().mockResolvedValue({ ok: true });
  });

  it("should submit a valid email", async () => {
    render(<ForgotPassword />);

    await userEvent.type(
      screen.getByTestId("emailInput"),
      "test@example.com"
    );

    await userEvent.click(screen.getByTestId("actionContinue"));

    await waitFor(() => expect(global.fetch).toHaveBeenCalledWith(
      passwordResetTokenUrl,
      {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-TOKEN": "mocked-csrf-token",
        },
        body: JSON.stringify({ email: "test@example.com" }),
      }
    ));
  });

  it("should not submit an invalid email", async () => {
    render(<ForgotPassword />);

    await userEvent.type(
      screen.getByTestId("emailInput"),
      "not-an-email"
    );

    await userEvent.click(screen.getByTestId("actionContinue"));

    expect(global.fetch).not.toHaveBeenCalled();

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
    let resolveRequest: (response: { ok: boolean }) => void;
    global.fetch = jest.fn().mockImplementation(
      () =>
        new Promise<{ ok: boolean }>((resolve) => {
          resolveRequest = resolve;
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

    resolveRequest!({ ok: true });

    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
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
