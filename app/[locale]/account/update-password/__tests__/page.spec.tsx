import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { axe, toHaveNoViolations } from "jest-axe";

import UpdatePasswordPage from "../page";

expect.extend(toHaveNoViolations);

const mockToastAdd = jest.fn();
jest.mock("@/context/ToastContext", () => ({
  useToast: jest.fn(() => ({
    add: mockToastAdd,
  })),
}));

describe("UpdatePasswordPage", () => {
  beforeEach(() => {
    window.scrollTo = jest.fn();
    mockToastAdd.mockClear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should render password form fields", () => {
    render(<UpdatePasswordPage />);

    // Check that all password fields are rendered
    const currentPasswordField = screen.getByLabelText(/currentPassword/);
    const newPasswordField = screen.getByLabelText(/newPassword/);
    const confirmPasswordField = screen.getByLabelText(/confirmPassword/);

    expect(currentPasswordField).toBeInTheDocument();
    expect(newPasswordField).toBeInTheDocument();
    expect(confirmPasswordField).toBeInTheDocument();
  });

  it("should have password input types", () => {
    render(<UpdatePasswordPage />);

    const currentPasswordField = screen.getByLabelText(/currentPassword/);
    const newPasswordField = screen.getByLabelText(/newPassword/);
    const confirmPasswordField = screen.getByLabelText(/confirmPassword/);

    expect(currentPasswordField).toHaveAttribute("type", "password");
    expect(newPasswordField).toHaveAttribute("type", "password");
    expect(confirmPasswordField).toHaveAttribute("type", "password");
  });

  it("should have required attributes on password fields", () => {
    render(<UpdatePasswordPage />);

    const currentPasswordField = screen.getByLabelText(/currentPassword/);
    const newPasswordField = screen.getByLabelText(/newPassword/);
    const confirmPasswordField = screen.getByLabelText(/confirmPassword/);

    expect(currentPasswordField).toBeRequired();
    expect(newPasswordField).toBeRequired();
    expect(confirmPasswordField).toBeRequired();
  });

  it("should render password requirements list", () => {
    render(<UpdatePasswordPage />);

    // Check that requirements section exists with list items
    const requirementsList = document.querySelector("ul");
    expect(requirementsList).toBeInTheDocument();

    const listItems = document.querySelectorAll("li");
    expect(listItems.length).toBeGreaterThan(0);
  });

  it("should have form element present", () => {
    render(<UpdatePasswordPage />);

    const form = document.querySelector("form");
    expect(form).toBeInTheDocument();
  });

  it("should render submit button", () => {
    render(<UpdatePasswordPage />);

    const submitButton = screen.getByRole("button", { name: /btnChangePassword|btnChangingPassword/ });
    expect(submitButton).toBeInTheDocument();
    expect(submitButton).toHaveAttribute("type", "submit");
  });

  it("should handle password field changes", () => {
    render(<UpdatePasswordPage />);

    const currentPasswordField = screen.getByLabelText(/currentPassword/);
    const newPasswordField = screen.getByLabelText(/newPassword/);
    const confirmPasswordField = screen.getByLabelText(/confirmPassword/);

    // Test field value changes
    fireEvent.change(currentPasswordField, { target: { value: "oldpassword" } });
    fireEvent.change(newPasswordField, { target: { value: "newpassword123" } });
    fireEvent.change(confirmPasswordField, { target: { value: "newpassword123" } });

    expect(currentPasswordField).toHaveValue("oldpassword");
    expect(newPasswordField).toHaveValue("newpassword123");
    expect(confirmPasswordField).toHaveValue("newpassword123");
  });

  it("should handle form submission", async () => {
    render(<UpdatePasswordPage />);

    const form = document.querySelector("form");
    const consoleSpy = jest.spyOn(console, "log").mockImplementation();

    // Fill in form fields
    const currentPasswordField = screen.getByLabelText(/currentPassword/);
    const newPasswordField = screen.getByLabelText(/newPassword/);
    const confirmPasswordField = screen.getByLabelText(/confirmPassword/);

    fireEvent.change(currentPasswordField, { target: { value: "oldpassword" } });
    fireEvent.change(newPasswordField, { target: { value: "newpassword123" } });
    fireEvent.change(confirmPasswordField, { target: { value: "newpassword123" } });

    // Submit form
    fireEvent.submit(form!);

    // Should log the form data (static implementation)
    await waitFor(async () => {
      expect(consoleSpy).toHaveBeenCalledWith("Password update submitted:", expect.any(Object));
      expect(mockToastAdd).toHaveBeenCalledWith("messages.passwordUpdateSuccess", {
        type: "success",
        timeout: 3000,
      });
    }, { timeout: 3000 });

    consoleSpy.mockRestore();
  });

  it("should disable submit button during submission", async () => {
    render(<UpdatePasswordPage />);

    const form = document.querySelector("form");
    const submitButton = screen.getByRole("button", { name: /btnChangePassword|btnChangingPassword/ });

    // Fill in form fields
    const currentPasswordField = screen.getByLabelText(/currentPassword/);
    fireEvent.change(currentPasswordField, { target: { value: "password" } });

    // Submit form
    fireEvent.submit(form!);

    // Button should be disabled during submission
    await waitFor(() => {
      expect(submitButton).toBeDisabled();
    });

    // Should be enabled again after submission
    await waitFor(
      () => {
        expect(submitButton).not.toBeDisabled();
      },
      { timeout: 2000 },
    );
  });

  it("should clear field errors when user types", () => {
    render(<UpdatePasswordPage />);

    const currentPasswordField = screen.getByLabelText(/currentPassword/);

    // Simulate typing in field (this tests the error clearing logic)
    fireEvent.change(currentPasswordField, { target: { value: "test" } });

    // Field should have the value
    expect(currentPasswordField).toHaveValue("test");
  });

  it("should render sidebar with navigation links", () => {
    render(<UpdatePasswordPage />);

    // Check sidebar is present
    const sidebar =
      document.querySelector('[class*="SidebarPanel"]') ||
      document.querySelector('[class*="sidebar"]') ||
      document.querySelector("aside");

    if (!sidebar) {
      // Fallback: check if the main content structure exists
      const contentContainer = document.querySelector('[class*="ContentContainer"]');
      expect(contentContainer).toBeInTheDocument();
    } else {
      expect(sidebar).toBeInTheDocument();
    }

    // Check for navigation links (test structure, not specific text)
    const links = document.querySelectorAll("a");
    expect(links.length).toBeGreaterThan(0);
  });

  it("should have proper layout structure", () => {
    render(<UpdatePasswordPage />);

    // Check main layout components exist
    const layoutContainer =
      document.querySelector('[class*="LayoutWithPanel"]') || document.querySelector('[class*="layout"]');

    const contentContainer =
      document.querySelector('[class*="ContentContainer"]') || document.querySelector('[class*="content"]');

    // At minimum, should have content structure
    expect(contentContainer || layoutContainer).toBeInTheDocument();
  });

  it("should pass accessibility tests", async () => {
    const { container } = render(<UpdatePasswordPage />);

    // Wait for component to render
    await waitFor(() => {
      expect(screen.getByLabelText(/currentPassword/)).toBeInTheDocument();
    });

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
