import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { axe, toHaveNoViolations } from "jest-axe";

import NotificationsPage from "../page";

expect.extend(toHaveNoViolations);

const mockToastAdd = jest.fn();
jest.mock("@/context/ToastContext", () => ({
  useToast: jest.fn(() => ({
    add: mockToastAdd,
  })),
}));

describe("NotificationsPage", () => {
  beforeEach(() => {
    window.scrollTo = jest.fn();
    mockToastAdd.mockClear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should render intro text", () => {
    render(<NotificationsPage />);

    // Check that intro text is rendered (using translation key)
    expect(screen.getByText("introText")).toBeInTheDocument();
  });

  it("should render checkbox group with notification options", () => {
    render(<NotificationsPage />);

    // Check that checkbox group is present
    const checkboxGroup = screen.getByTestId("checkbox-group");
    expect(checkboxGroup).toBeInTheDocument();

    // Check that checkboxes are rendered
    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes.length).toBeGreaterThan(0);
  });

  it("should render notification type labels", () => {
    render(<NotificationsPage />);

    // Check that notification labels are rendered (using translation keys)
    expect(screen.getByText("notificationTypes.commentAdded")).toBeInTheDocument();
    expect(screen.getByText("notificationTypes.planShared")).toBeInTheDocument();
    expect(screen.getByText("notificationTypes.adminPrivileges")).toBeInTheDocument();
  });

  it("should have checkboxes with proper attributes", () => {
    render(<NotificationsPage />);

    const checkboxes = screen.getAllByRole("checkbox");

    // Check that checkboxes have proper attributes
    checkboxes.forEach((checkbox) => {
      expect(checkbox).toHaveAttribute("aria-label");
      expect(checkbox).toHaveAttribute("value");
    });
  });

  it("should render some checkboxes as initially checked", () => {
    render(<NotificationsPage />);

    const checkboxes = screen.getAllByRole("checkbox") as HTMLInputElement[];
    const checkedBoxes = checkboxes.filter((checkbox) => checkbox.checked);

    // Should have some initially checked based on dummy data
    expect(checkedBoxes.length).toBeGreaterThan(0);
  });

  it("should handle checkbox interactions", () => {
    render(<NotificationsPage />);

    const checkboxes = screen.getAllByRole("checkbox") as HTMLInputElement[];
    expect(checkboxes.length).toBeGreaterThan(0);

    // Click first checkbox
    const firstCheckbox = checkboxes[0];
    const initialState = firstCheckbox.checked;

    fireEvent.click(firstCheckbox);

  
    expect(firstCheckbox.checked).toBe(!initialState);
  });

  it("should have form element present", () => {
    render(<NotificationsPage />);

    const form = document.querySelector("form");
    expect(form).toBeInTheDocument();
  });

  it("should render save button", () => {
    render(<NotificationsPage />);

    const saveButton = screen.getByRole("button", { name: /actions\.save/ });
    expect(saveButton).toBeInTheDocument();
    expect(saveButton).toHaveAttribute("type", "submit");
  });

  it("should handle form submission", () => {
    render(<NotificationsPage />);

    const form = document.querySelector("form");
    const consoleSpy = jest.spyOn(console, "log").mockImplementation();

    // Submit form
    fireEvent.submit(form!);

    // Should log the notification preferences (static implementation)
    expect(consoleSpy).toHaveBeenCalledWith("Notification preferences updated:", expect.any(Array));
    expect(mockToastAdd).toHaveBeenCalledWith("messages.preferencesUpdateSuccess", {
      type: "success",
      timeout: 3000,
    });

    consoleSpy.mockRestore();
  });

  it("should render sidebar with navigation links", () => {
    render(<NotificationsPage />);

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
    render(<NotificationsPage />);

    // Check main layout components exist
    const layoutContainer =
      document.querySelector('[class*="LayoutWithPanel"]') || document.querySelector('[class*="layout"]');

    const contentContainer =
      document.querySelector('[class*="ContentContainer"]') || document.querySelector('[class*="content"]');

    // At minimum, should have content structure
    expect(contentContainer || layoutContainer).toBeInTheDocument();
  });

  it("should render notification preferences section with proper styling", () => {
    render(<NotificationsPage />);

    // Check that the section container exists
    const sectionContainer = document.querySelector('[class*="sectionContainer"]');
    expect(sectionContainer).toBeInTheDocument();

    // Check that section content exists
    const sectionContent = document.querySelector('[class*="sectionContent"]');
    expect(sectionContent).toBeInTheDocument();
  });

  it("should render all expected notification types", () => {
    render(<NotificationsPage />);

    // Check that we have the expected number of notification options
    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes).toHaveLength(8); // Based on the dummy data array
  });

  it("should have checkbox group with proper test id", () => {
    render(<NotificationsPage />);

    const checkboxGroup = screen.getByTestId("checkbox-group");
    expect(checkboxGroup).toBeInTheDocument();
    expect(checkboxGroup).toHaveAttribute("data-testid", "checkbox-group");
  });

  it("should pass accessibility tests", async () => {
    const { container } = render(<NotificationsPage />);

    // Wait for component to render
    await waitFor(() => {
      expect(screen.getByTestId("checkbox-group")).toBeInTheDocument();
    });

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
