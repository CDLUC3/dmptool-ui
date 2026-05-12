import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { RichTranslationValues } from 'next-intl';
import "@testing-library/jest-dom";
import { axe, toHaveNoViolations } from "jest-axe";
import { useQuery, useMutation } from '@apollo/client/react';
import {
  MeDocument,
  UpdateAffiliationDocument,
  AffiliationByIdDocument
} from '@/generated/graphql';
import { mockScrollIntoView, mockScrollTo } from '@/__mocks__/common';

import FeedbackOptions from "../page";

// Extend jest-axe
expect.extend(toHaveNoViolations);

// Mocks
jest.mock("@apollo/client/react", () => ({
  useQuery: jest.fn(),
  useMutation: jest.fn(),
}));


const mockUseQuery = jest.mocked(useQuery);
const mockUseMutation = jest.mocked(useMutation);

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode;[key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

jest.mock("@/components/Form", () => ({
  /*eslint-disable @typescript-eslint/no-explicit-any */
  FormInput: ({ label, onChange, value, isInvalid, errorMessage }: any) => (
    <div>
      <input aria-label={label} value={value} onChange={onChange} />
      {isInvalid && errorMessage && <p role="alert">{errorMessage}</p>}
    </div>
  ),
  /*eslint-disable @typescript-eslint/no-explicit-any */
  FormTextArea: ({ label, onChange, value, description, helpMessage }: any) => (
    <div>
      <textarea aria-label={label} value={value} onChange={(e) => onChange(e.target.value)} />
      {description && <p>{description}</p>}
      {helpMessage && <p>{helpMessage}</p>}
    </div>
  ),
}));


// Mock next-intl
type MockUseTranslations = {
  (key: string, ...args: unknown[]): string;
  rich: (key: string, values?: RichTranslationValues) => React.ReactNode;
};

jest.mock('next-intl', () => ({
  useTranslations: jest.fn(() => {
    const mockUseTranslations: MockUseTranslations = ((key: string) => key) as MockUseTranslations;

    mockUseTranslations.rich = (key, values) => {
      const p = values?.p;
      if (typeof p === 'function') {
        return p(key); // Can return JSX
      }
      return key; // fallback
    };

    return mockUseTranslations;
  }),
}));

jest.mock("@/components/PageHeader", () => () => <div data-testid="mock-page-header" />);


// Mock logECS
jest.mock('@/utils/clientLogger', () => ({
  __esModule: true,
  default: jest.fn(),
}));

// Mock useToast
const mockToastAdd = jest.fn();
jest.mock('@/context/ToastContext', () => ({
  useToast: () => ({ add: mockToastAdd }),
}));

// Mock data
const mockMeData = {
  me: {
    __typename: "User",
    id: 5,
    givenName: "NSF",
    surName: "Admin",
    languageId: "en-US",
    role: "ADMIN",
    emails: [
      {
        __typename: "UserEmail",
        id: 5,
        email: "admin@nsf.gov",
        isPrimary: true,
        isConfirmed: true,
      },
    ],
    errors: {
      __typename: "UserErrors",
      general: null,
      email: null,
      password: null,
      role: null,
    },
    affiliation: {
      __typename: "Affiliation",
      id: 114,
      name: "National Science Foundation",
      displayName: "National Science Foundation (nsf.gov)",
      feedbackEmails: ["admin@nsf.gov"],
      feedbackEnabled: true,
      feedbackMessage: "<p>NSF can provide feedback on your plans</p>",
    },
  },
};
const mockAffiliationData = {
  affiliationById: {
    __typename: "Affiliation",
    id: 114,
    name: "National Science Foundation",
    displayName: "National Science Foundation (nsf.gov)",
    feedbackEmails: ["admin@nsf.gov"],
    feedbackEnabled: true,
    feedbackMessage: "<p>NSF can provide feedback on your plans</p>",
  },
};

const setupApolloMocks = ({
  meLoading = false,
  affiliationLoading = false,
  meError = undefined,
  affiliationError = undefined,
  updateAffiliationResult = undefined,
  updateAffiliationError = undefined,
}: {
  meLoading?: boolean;
  affiliationLoading?: boolean;
  meError?: Error;
  affiliationError?: Error;
  /*eslint-disable @typescript-eslint/no-explicit-any */
  updateAffiliationResult?: any;
  updateAffiliationError?: Error;
} = {}) => {
  const meQueryReturn = {
    data: meLoading ? null : { me: mockMeData.me },
    loading: meLoading,
    error: meError,
  };

  const affiliationByIdQueryReturn = {
    data: affiliationLoading ? null : { affiliationById: mockAffiliationData.affiliationById },
    loading: affiliationLoading,
    error: affiliationError,
    refetch: jest.fn().mockResolvedValue({
      data: { affiliationById: mockAffiliationData.affiliationById },
    }),
  };

  const defaultQueryReturn = {
    data: null,
    loading: false,
    error: undefined
  } as any;

  mockUseQuery.mockImplementation((document) => {
    if (document === MeDocument) {
      return meQueryReturn as ReturnType<typeof useQuery>;
    }
    if (document === AffiliationByIdDocument) {
      /*eslint-disable @typescript-eslint/no-explicit-any */
      return affiliationByIdQueryReturn as any;
    }
    return defaultQueryReturn;
  });

  mockUseMutation.mockImplementation((document) => {
    if (document === UpdateAffiliationDocument) {
      const mutationFn = updateAffiliationError
        ? jest.fn().mockRejectedValue(updateAffiliationError)
        : jest.fn().mockResolvedValue(updateAffiliationResult ?? { data: { updateAffiliation: { errors: null } } });

      /*eslint-disable @typescript-eslint/no-explicit-any */
      return [mutationFn, { loading: false }] as any;
    }
    /*eslint-disable @typescript-eslint/no-explicit-any */
    return [jest.fn(), { loading: false }] as any;
  });
};

describe("FeedbackOptions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupApolloMocks();
    HTMLElement.prototype.scrollIntoView = mockScrollIntoView;
    mockScrollTo();
  });

  it("should show loading state while queries are loading", () => {
    setupApolloMocks({ meLoading: true });
    render(<FeedbackOptions />);
    expect(screen.getByText("messaging.loading")).toBeInTheDocument();
  });

  it("should render the page header and form fields", () => {
    render(<FeedbackOptions />);
    expect(screen.getByTestId("mock-page-header")).toBeInTheDocument();
    expect(screen.getByText("description")).toBeInTheDocument();
    expect(screen.getByLabelText("fields.feedbackEnabled.label")).toBeInTheDocument();
    expect(screen.getByLabelText("fields.feedbackEmail.label", { selector: "input" })).toBeInTheDocument();
    expect(screen.getByLabelText("fields.feedbackText.label", { selector: "textarea" })).toBeInTheDocument();
    expect(screen.getByText("fields.feedbackText.description")).toBeInTheDocument();
    expect(screen.getByText("fields.feedbackText.helpText")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "actions.save" })).toBeInTheDocument();
  });

  it("should toggle feedback enabled and hide/show fields", () => {
    render(<FeedbackOptions />);
    // Feedback enabled by default
    expect(screen.getByLabelText("fields.feedbackEmail.label", { selector: "input" })).toBeInTheDocument();
    // Simulate turning off feedback
    const offRadio = screen.getByLabelText("fields.feedbackEnabled.options.off");
    fireEvent.click(offRadio);
    const emailSection = document.getElementById("feedback-email-section");
    expect(emailSection).toHaveClass("hidden");
  });

  it("should submit the form and show success toast", async () => {
    const updateAffiliationResult = {
      data: { updateAffiliation: { errors: {} } }  // {} instead of null
    };
    setupApolloMocks({ updateAffiliationResult });
    render(<FeedbackOptions />);
    fireEvent.change(screen.getByRole("textbox", { name: "fields.feedbackEmail.label" }),
      { target: { value: "test@nsf.gov" } }
    );
    fireEvent.change(screen.getByRole("textbox", { name: "fields.feedbackText.label" }), { target: { value: "Feedback message" } });
    fireEvent.click(screen.getByRole("button", { name: "actions.save" }));
    await waitFor(() => {
      expect(mockToastAdd).toHaveBeenCalledWith("messages.success.feedbackOptionsUpdated", { type: "success" });
    });
  });

  it("should show error messages from mutation", async () => {
    const updateAffiliationResult = { data: { updateAffiliation: { errors: { general: "Something went wrong" } } } };
    setupApolloMocks({ updateAffiliationResult });
    render(<FeedbackOptions />);
    fireEvent.click(screen.getByRole("button", { name: "actions.save" }));
    await waitFor(() => {
      expect(screen.getByTestId("error-messages")).toHaveTextContent("Something went wrong");
    });
  });

  it("should show error message on mutation network error", async () => {
    setupApolloMocks({ updateAffiliationError: new Error("Network error") });
    render(<FeedbackOptions />);
    fireEvent.click(screen.getByRole("button", { name: "actions.save" }));
    await waitFor(() => {
      expect(screen.getByTestId("error-messages")).toHaveTextContent("messaging.somethingWentWrong");
    });
  });

  it("should show error message when meQuery fails", () => {
    setupApolloMocks({ meError: new Error("Failed to load user data") });
    render(<FeedbackOptions />);
    expect(screen.getByTestId("error-messages")).toHaveTextContent("Failed to load user data");
  });

  it("should show error message when affiliationQuery fails", () => {
    setupApolloMocks({ affiliationError: new Error("Failed to load affiliation") });
    render(<FeedbackOptions />);
    expect(screen.getByTestId("error-messages")).toHaveTextContent("Failed to load affiliation");
  });

  it("should render sidebar panel and related links", () => {
    render(<FeedbackOptions />);
    expect(screen.getByText("headingRelatedActions")).toBeInTheDocument();
    expect(screen.getByText("sections.organizationSettings.items.editOrganizationDetails.title")).toBeInTheDocument();
    expect(screen.getByText("sections.organizationSettings.items.manageUserAccounts.title")).toBeInTheDocument();
    expect(screen.getByText("sections.organizationSettings.items.customizeEmailText.title")).toBeInTheDocument();
    expect(screen.getByText("sections.organizationSettings.items.requestFeedbackOptions.title")).toBeInTheDocument();
  });

  it('should not show email validation error when email is valid', () => {
    render(<FeedbackOptions />);

    const emailInput = screen.getByRole('textbox', { name: 'fields.feedbackEmail.label' });
    fireEvent.change(emailInput, { target: { value: 'valid@example.com' } });

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('should show email validation error when email is invalid', () => {
    render(<FeedbackOptions />);

    const emailInput = screen.getByRole('textbox', { name: 'fields.feedbackEmail.label' });
    fireEvent.change(emailInput, { target: { value: 'not-a-valid-email' } });

    expect(screen.getByRole('alert')).toHaveTextContent('fields.feedbackEmail.invalidEmail');
  });

  it('should not show email validation error when multiple valid emails are entered', () => {
    render(<FeedbackOptions />);

    const emailInput = screen.getByRole('textbox', { name: 'fields.feedbackEmail.label' });
    fireEvent.change(emailInput, { target: { value: 'one@example.com, two@example.com, three@example.com' } });

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('should show email validation error when one of multiple emails is invalid', () => {
    render(<FeedbackOptions />);

    const emailInput = screen.getByRole('textbox', { name: 'fields.feedbackEmail.label' });
    fireEvent.change(emailInput, { target: { value: 'valid@example.com, not-an-email' } });

    expect(screen.getByRole('alert')).toHaveTextContent('fields.feedbackEmail.invalidEmail');
  });

  it("should pass accessibility tests", async () => {
    const { container } = render(<FeedbackOptions />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
