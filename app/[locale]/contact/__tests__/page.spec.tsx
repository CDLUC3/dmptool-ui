import React, { ReactNode } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import userEvent from "@testing-library/user-event";
import { MockedProvider } from "@apollo/client/testing/react";
import { useTranslations } from "next-intl";
import { mockScrollIntoView, mockScrollTo } from '@/__mocks__/common';

import {
  MeDocument,
  SubmitContactFormDocument,
} from "@/generated/graphql";

import { useAuthContext } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { logECS } from "@/utils/index";

import { axe, toHaveNoViolations } from "jest-axe";
import ContactUsPage from "../page";

expect.extend(toHaveNoViolations);

type RichTranslationValues = Record<string, unknown>;

type MockUseTranslations = {
  (key: string, ...args: unknown[]): string;
  rich: (key: string, values?: RichTranslationValues) => ReactNode;
};

// Mock next-intl
jest.mock("next-intl", () => ({
  useTranslations: jest.fn(),
}));

// Mock AuthContext
jest.mock("@/context/AuthContext", () => ({
  useAuthContext: jest.fn(),
}));

// Mock ToastContext
jest.mock("@/context/ToastContext", () => ({
  useToast: jest.fn(),
}));

// Mock utils (keep routePath simple/deterministic, spy on logECS)
jest.mock("@/utils/index", () => ({
  logECS: jest.fn(),
  routePath: (key: string) => `/${key}`,
}));

const mockToastAdd = jest.fn();

// If the helpdesk email is missing, define it here so the tests pass
if (!process.env.NEXT_PUBLIC_HELPDESK_EMAIL_ADDRESS) {
  process.env.NEXT_PUBLIC_HELPDESK_EMAIL_ADDRESS = 'test@example.com';
}

const mockMeData = {
  me: {
    givenName: "Jane",
    surName: "Doe",
    email: "jane.doe@example.com"
  },
};

const meMock = {
  request: { query: MeDocument },
  result: { data: mockMeData },
};

const formValues = {
  name: "Jane Doe",
  email: "jane.doe@example.com",
  subject: "Test subject",
  message: "Test message body",
};

const submitSuccessMock = {
  request: {
    query: SubmitContactFormDocument,
    variables: { input: formValues },
  },
  result: {
    data: { submitContactForm: true },
  },
};

const submitFailureMock = {
  request: {
    query: SubmitContactFormDocument,
    variables: { input: formValues },
  },
  result: {
    data: { submitContactForm: false },
  },
};

const submitErrorMock = {
  request: {
    query: SubmitContactFormDocument,
    variables: { input: formValues },
  },
  error: new Error("Network error"),
};

  // Helper to fill out and submit the required fields
  async function fillAndSubmit(user: ReturnType<typeof userEvent.setup>) {
    // Wait for the me-query data to populate the pre-filled fields first
    await screen.findByDisplayValue(formValues.email);

    const subjectInput = screen.getByLabelText("form.labels.subject (required)");
    const messageInput = screen.getByLabelText("form.labels.message (required)");

    await user.type(subjectInput, formValues.subject);
    await user.type(messageInput, formValues.message);

    const submitButton = screen.getByRole("button", { name: "buttons.submit" });
    await user.click(submitButton);
  }

describe("ContactUsPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.scrollTo = jest.fn();
    HTMLElement.prototype.scrollIntoView = mockScrollIntoView;
    mockScrollTo();

    (useTranslations as jest.Mock).mockImplementation(() => {
      const mockT: MockUseTranslations = ((key: string) => key) as MockUseTranslations;

      // Generic rich-text handling: find whichever render-prop function was
      // passed (e.g. `link`, `p`, etc.) and invoke it with the key as the
      // "chunks" content, rather than hard-coding one prop name.
      mockT.rich = (key: string, values?: RichTranslationValues) => {
        const renderFn = values
          ? Object.values(values).find((v) => typeof v === "function")
          : undefined;

        if (typeof renderFn === "function") {
          return renderFn(key);
        }
        return key;
      };

      return mockT;
    });

    (useToast as jest.Mock).mockReturnValue({ add: mockToastAdd });
  });

  it("should render a loading state while authentication status is unknown", () => {
    (useAuthContext as jest.Mock).mockReturnValue({ isAuthenticated: null });

    render(
      <MockedProvider mocks={[]}>
        <ContactUsPage />
      </MockedProvider>
    );

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it("should render the page title and breadcrumbs", async () => {
    (useAuthContext as jest.Mock).mockReturnValue({ isAuthenticated: false });

    render(
      <MockedProvider mocks={[]}>
        <ContactUsPage />
      </MockedProvider>
    );

    await waitFor(() => {
      const breadcrumbTitle = screen.getByText(
        (content, element) => content === "title" && element?.tagName.toLowerCase() === "li"
      );
      expect(breadcrumbTitle).toBeInTheDocument();
    });
  });

  it("should not render the contact form when the user is not authenticated", async () => {
    (useAuthContext as jest.Mock).mockReturnValue({ isAuthenticated: false });

    render(
      <MockedProvider mocks={[]}>
        <ContactUsPage />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(
        screen.getByText("contactDescriptionLoggedOut")
      ).toBeInTheDocument();
    });

    expect(
      screen.queryByRole("button", { name: "buttons.submit" })
    ).not.toBeInTheDocument();
  });

  it("should render the contact form pre-filled with the user's name and email when authenticated", async () => {
    (useAuthContext as jest.Mock).mockReturnValue({ isAuthenticated: true });

    render(
      <MockedProvider mocks={[meMock]}>
        <ContactUsPage />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue("Jane Doe")).toBeInTheDocument();
      expect(screen.getByDisplayValue("jane.doe@example.com")).toBeInTheDocument();
    });
  });

  it("should show field-level validation errors when subject and message are missing", async () => {
    const user = userEvent.setup();
    (useAuthContext as jest.Mock).mockReturnValue({ isAuthenticated: true });

    render(
      <MockedProvider mocks={[meMock]}>
        <ContactUsPage />
      </MockedProvider>
    );

    const submitButton = await screen.findByRole("button", {
      name: "buttons.submit",
    });
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getAllByText("messages.errors.invalidSubject").length
      ).toBeGreaterThan(0);
      expect(
        screen.getAllByText("messages.errors.invalidMessage").length
      ).toBeGreaterThan(0);
    });
  });

  it("should submit the form successfully and show a success toast", async () => {
    const user = userEvent.setup();
    (useAuthContext as jest.Mock).mockReturnValue({ isAuthenticated: true });

    render(
      <MockedProvider mocks={[meMock, submitSuccessMock]}>
        <ContactUsPage />
      </MockedProvider>
    );

    await fillAndSubmit(user);

    await waitFor(() => {
      expect(mockToastAdd).toHaveBeenCalledWith(
        "messages.success.messageSent",
        { type: "success" }
      );
    });
  });

  it("should show an error message when submission returns unsuccessful", async () => {
    const user = userEvent.setup();
    (useAuthContext as jest.Mock).mockReturnValue({ isAuthenticated: true });

    render(
      <MockedProvider mocks={[meMock, submitFailureMock]}>
        <ContactUsPage />
      </MockedProvider>
    );

    await fillAndSubmit(user);

    await waitFor(() => {
      expect(
        screen.getByText("messages.errors.formSubmittalFailed")
      ).toBeInTheDocument();
      expect(logECS).toHaveBeenCalled();
    });
  });

  it("should show an error message when the mutation throws a network error", async () => {
    const user = userEvent.setup();
    (useAuthContext as jest.Mock).mockReturnValue({ isAuthenticated: true });

    render(
      <MockedProvider mocks={[meMock, submitErrorMock]}>
        <ContactUsPage />
      </MockedProvider>
    );

    await fillAndSubmit(user);

    await waitFor(() => {
      expect(
        screen.getByText("messages.errors.formSubmittalFailed")
      ).toBeInTheDocument();
      expect(logECS).toHaveBeenCalled();
    });
  });

  it("should clear error messages when a field is edited", async () => {
    const user = userEvent.setup();
    (useAuthContext as jest.Mock).mockReturnValue({ isAuthenticated: true });

    render(
      <MockedProvider mocks={[meMock]}>
        <ContactUsPage />
      </MockedProvider>
    );

    const submitButton = await screen.findByRole("button", {
      name: "buttons.submit",
    });
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getAllByText("messages.errors.invalidSubject").length
      ).toBeGreaterThan(0);
    });

    const subjectInput = screen.getByLabelText("form.labels.subject (required)");
    await user.type(subjectInput, "A new subject line");

    await waitFor(() => {
      expect(
        screen.queryByText("messages.errors.formSubmittalFailed")
      ).not.toBeInTheDocument();
    });
  });

  it("should pass accessibility tests", async () => {
    (useAuthContext as jest.Mock).mockReturnValue({ isAuthenticated: true });

    const { container } = render(
      <MockedProvider mocks={[meMock]}>
        <ContactUsPage />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue("Jane Doe")).toBeInTheDocument();
    });

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
