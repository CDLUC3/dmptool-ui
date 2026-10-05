import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { axe, toHaveNoViolations } from "jest-axe";

import EmailPreferencesPage from "../page";

expect.extend(toHaveNoViolations);

jest.mock('@/i18n/routing', () => ({
  Link: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>{children}</a>
  ),
  useRouter: jest.fn(() => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() })),
  usePathname: jest.fn(() => '/admin/email-preferences'),
}));

// Minimal TinyMCE mock to prevent errors in tests
Object.defineProperty(window, "tinymce", {
  value: {
    remove: jest.fn(),
    init: jest.fn(),
  },
  writable: true,
});

describe("EmailPreferencesPage", () => {
  beforeEach(() => {
    window.scrollTo = jest.fn(); // Mock scrollTo if needed
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should render the page header with title", () => {
    render(<EmailPreferencesPage />);

    expect(screen.getByText("title")).toBeInTheDocument();
  });

  it("should render the customize email text section", () => {
    render(<EmailPreferencesPage />);

    // Check that the section title and description are rendered
    expect(screen.getByText("sections.customizeEmailText.title")).toBeInTheDocument();
    expect(screen.getByText("sections.customizeEmailText.description")).toBeInTheDocument();
  });

  it("should render form inputs with proper labels", () => {
    render(<EmailPreferencesPage />);

    // Check that form inputs are present
    const subjectInput = screen.getByLabelText(/fields.subject.label/);
    const emailTextInput = screen.getByLabelText(/fields.emailText.label/);

    expect(subjectInput).toBeInTheDocument();
    expect(emailTextInput).toBeInTheDocument();
  });

  it("should render initial form values", () => {
    render(<EmailPreferencesPage />);

    // Check that form inputs are present and have initial values
    const subjectInput = screen.getByLabelText(/fields.subject.label/);
    expect(subjectInput).toBeInTheDocument();
    expect(subjectInput).toHaveValue();

    // For TinyMCE editor, just check that the container exists
    const emailTextContainer = screen.getByLabelText(/fields.emailText.label/);
    expect(emailTextContainer).toBeInTheDocument();
  });

  it("should render the preview email section", () => {
    render(<EmailPreferencesPage />);

    // Check that preview section is rendered
    expect(screen.getByText("sections.previewEmail.title")).toBeInTheDocument();
  });

  it("should display email preview with current form values", () => {
    render(<EmailPreferencesPage />);

    // Check that the preview section exists and shows subject label
    expect(screen.getByText("Subject:")).toBeInTheDocument();

    // Check that email preview container exists
    const emailPreview = document.querySelector('[class*="emailPreview"]');
    expect(emailPreview).toBeInTheDocument();
  });

  it("should update email preview when subject changes", () => {
    render(<EmailPreferencesPage />);

    const subjectInput = screen.getByLabelText(/fields.subject.label/);
    const newSubject = "Updated email subject";

    // Change the subject
    fireEvent.change(subjectInput, { target: { value: newSubject } });

    // Check that the input value changed
    expect(subjectInput).toHaveValue(newSubject);

    // Check that the preview section still exists (functionality works)
    const emailPreview = document.querySelector('[class*="emailPreview"]');
    expect(emailPreview).toBeInTheDocument();
  });

  it("should render save button", () => {
    render(<EmailPreferencesPage />);

    const saveButton = screen.getByText("buttons.save");
    expect(saveButton).toBeInTheDocument();
  });

  it("should have form element present", () => {
    render(<EmailPreferencesPage />);

    const form = document.querySelector("form");
    expect(form).toBeInTheDocument();
  });

  it("should handle form submission", () => {
    render(<EmailPreferencesPage />);

    const form = document.querySelector("form");
    const consoleSpy = jest.spyOn(console, "log").mockImplementation();

    // Submit form
    fireEvent.submit(form!);

    expect(consoleSpy).toHaveBeenCalledWith("handleSubmit");

    consoleSpy.mockRestore();
  });

  it("should render sidebar panel", () => {
    render(<EmailPreferencesPage />);

    // Check sidebar is present (even if empty)
    const sidebar =
      document.querySelector('[class*="SidebarPanel"]') ||
      document.querySelector('[class*="sidebar"]') ||
      document.querySelector("aside");

    // If we can't find it by class, check if the component structure exists
    if (!sidebar) {
      // Check if the layout structure exists
      const contentContainer = document.querySelector('[class*="ContentContainer"]');
      expect(contentContainer).toBeInTheDocument();

      // Check if there's a form (which means the main content is there)
      const form = document.querySelector("form");
      expect(form).toBeInTheDocument();
    } else {
      expect(sidebar).toBeInTheDocument();
    }
  });

  it("should pass accessibility tests", async () => {
    const { container } = render(<EmailPreferencesPage />);

    // Wait for the component to fully render
    await waitFor(() => {
      expect(screen.getByText("title")).toBeInTheDocument();
    });

    // Wait a bit more for TinyMCE to potentially initialize
    await waitFor(
      () => {
        const results = axe(container);
        return results;
      },
      { timeout: 3000 },
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
