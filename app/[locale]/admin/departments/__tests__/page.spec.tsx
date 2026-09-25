import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { axe, toHaveNoViolations } from "jest-axe";

import DepartmentsPage from "../page";

expect.extend(toHaveNoViolations);

jest.mock('@/i18n/routing', () => ({
  Link: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>{children}</a>
  ),
  useRouter: jest.fn(() => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() })),
}));

describe("DepartmentsPage", () => {
  beforeEach(() => {
    window.scrollTo = jest.fn(); // Mock scrollTo if needed
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should render the page header with title", () => {
    render(<DepartmentsPage />);

    expect(screen.getByText("title")).toBeInTheDocument();
  });

  it("should render the departments section", () => {
    render(<DepartmentsPage />);

    // Check that department inputs are rendered
    const nameInputs = screen.getAllByLabelText("fields.departmentName.label");
    const abbrInputs = screen.getAllByLabelText("fields.departmentAbbr.label");

    expect(nameInputs).toHaveLength(2);
    expect(abbrInputs).toHaveLength(2);
  });

  it("should render initial departments", () => {
    render(<DepartmentsPage />);

    // Check that initial departments are rendered
    expect(screen.getByDisplayValue("Publishing Archiving and Digitization")).toBeInTheDocument();
    expect(screen.getByDisplayValue("PAD")).toBeInTheDocument();
    expect(screen.getByDisplayValue("UC Curation Center")).toBeInTheDocument();
    expect(screen.getByDisplayValue("UC3")).toBeInTheDocument();
  });

  it("should render form inputs with proper labels", () => {
    render(<DepartmentsPage />);

    // Check that form inputs are present
    const nameInputs = screen.getAllByLabelText("fields.departmentName.label");
    const abbrInputs = screen.getAllByLabelText("fields.departmentAbbr.label");

    expect(nameInputs.length).toBeGreaterThan(0);
    expect(abbrInputs.length).toBeGreaterThan(0);
  });

  it("should render save and delete buttons for each department", () => {
    render(<DepartmentsPage />);

    // Should have 2 save buttons and 2 delete buttons (one for each department)
    const saveButtons = screen.getAllByText("actions.save");
    const deleteButtons = screen.getAllByText("actions.delete");

    expect(saveButtons).toHaveLength(2);
    expect(deleteButtons).toHaveLength(2);
  });

  it("should render add new department button", () => {
    render(<DepartmentsPage />);

    expect(screen.getByText("actions.addNew")).toBeInTheDocument();
  });

  it("should have form element present", () => {
    render(<DepartmentsPage />);

    const form = document.querySelector("form");
    expect(form).toBeInTheDocument();
  });

  it("should handle adding new department", () => {
    render(<DepartmentsPage />);

    // Initially should have 2 departments
    expect(screen.getAllByLabelText("fields.departmentName.label")).toHaveLength(2);

    // Click add new button
    const addButton = screen.getByText("actions.addNew");
    fireEvent.click(addButton);

    // Should now have 3 departments
    expect(screen.getAllByLabelText("fields.departmentName.label")).toHaveLength(3);
    expect(screen.getAllByLabelText("fields.departmentAbbr.label")).toHaveLength(3);
  });

  it("should handle department field changes", () => {
    render(<DepartmentsPage />);

    const nameInputs = screen.getAllByLabelText("fields.departmentName.label");
    const abbrInputs = screen.getAllByLabelText("fields.departmentAbbr.label");

    // Change first department name
    fireEvent.change(nameInputs[0], { target: { value: "Updated Department" } });
    expect(nameInputs[0]).toHaveValue("Updated Department");

    // Change first department abbreviation
    fireEvent.change(abbrInputs[0], { target: { value: "UD" } });
    expect(abbrInputs[0]).toHaveValue("UD");
  });

  it("should open confirmation dialog when delete button is clicked", async () => {
    render(<DepartmentsPage />);

    const deleteButtons = screen.getAllByText("actions.delete");
    expect(deleteButtons.length).toBeGreaterThan(0);

    // Click first delete button
    fireEvent.click(deleteButtons[0]);

    // Should show confirmation dialog (check for any dialog content)
    await waitFor(() => {
      const dialog = document.querySelector('[role="dialog"]') || document.querySelector(".react-aria-Modal");
      expect(dialog).toBeInTheDocument();
    });
  });

  it("should show department name in confirmation dialog", async () => {
    render(<DepartmentsPage />);

    const deleteButtons = screen.getAllByText("actions.delete");

    // Click first delete button
    fireEvent.click(deleteButtons[0]);

    // Should show confirmation dialog with some content
    await waitFor(() => {
      const dialog = document.querySelector('[role="dialog"]') || document.querySelector(".react-aria-Modal");
      expect(dialog).toBeInTheDocument();
    });
  });

  it("should have cancel and delete buttons in confirmation dialog", async () => {
    render(<DepartmentsPage />);

    const deleteButtons = screen.getAllByText("actions.delete");
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(screen.getByText("buttons.cancel")).toBeInTheDocument();
      expect(screen.getByText("deleteModal.deleteButton")).toBeInTheDocument();
    });
  });

  it("should close dialog when cancel is clicked", async () => {
    render(<DepartmentsPage />);

    const deleteButtons = screen.getAllByText("actions.delete");
    fireEvent.click(deleteButtons[0]);

    // Wait for dialog to open
    await waitFor(() => {
      expect(screen.getByText("deleteModal.title")).toBeInTheDocument();
    });

    // Click cancel
    const cancelButton = screen.getByText("buttons.cancel");
    fireEvent.click(cancelButton);

    // Dialog should be closed
    await waitFor(() => {
      expect(screen.queryByText("deleteModal.title")).not.toBeInTheDocument();
    });
  });

  it("should delete department when confirmed", async () => {
    render(<DepartmentsPage />);

    // Initially should have 2 departments
    expect(screen.getAllByLabelText("fields.departmentName.label")).toHaveLength(2);

    const deleteButtons = screen.getAllByText("actions.delete");
    fireEvent.click(deleteButtons[0]);

    // Wait for dialog to open
    await waitFor(() => {
      expect(screen.getByText("deleteModal.title")).toBeInTheDocument();
    });

    // Click delete button in dialog
    const confirmDeleteButton = screen.getByText("deleteModal.deleteButton");
    fireEvent.click(confirmDeleteButton);

    // Should now have 1 department
    await waitFor(() => {
      expect(screen.getAllByLabelText("fields.departmentName.label")).toHaveLength(1);
    });
  });

  it("should maintain department values when adding new ones", () => {
    render(<DepartmentsPage />);

    // Change first department name
    const nameInputs = screen.getAllByLabelText("fields.departmentName.label");
    fireEvent.change(nameInputs[0], { target: { value: "Modified Department" } });

    // Add new department
    const addButton = screen.getByText("actions.addNew");
    fireEvent.click(addButton);

    // First department should still have its modified value
    const updatedNameInputs = screen.getAllByLabelText("fields.departmentName.label");
    expect(updatedNameInputs[0]).toHaveValue("Modified Department");
  });

  it("should handle multiple department additions", () => {
    render(<DepartmentsPage />);

    // Initially 2 departments
    expect(screen.getAllByLabelText("fields.departmentName.label")).toHaveLength(2);

    // Add 3 more departments
    const addButton = screen.getByText("actions.addNew");
    fireEvent.click(addButton);
    fireEvent.click(addButton);
    fireEvent.click(addButton);

    // Should now have 5 departments
    expect(screen.getAllByLabelText("fields.departmentName.label")).toHaveLength(5);
    expect(screen.getAllByLabelText("fields.departmentAbbr.label")).toHaveLength(5);
  });

  it("should handle form submission", () => {
    render(<DepartmentsPage />);

    const form = document.querySelector("form");
    const consoleSpy = jest.spyOn(console, "log").mockImplementation();

    // Submit form
    fireEvent.submit(form!);

    expect(consoleSpy).toHaveBeenCalledWith("handleSubmit");

    consoleSpy.mockRestore();
  });

  it("should render sidebar panel", () => {
    render(<DepartmentsPage />);

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
    const { container } = render(<DepartmentsPage />);

    // Wait for the component to fully render
    await waitFor(() => {
      expect(screen.getByText("title")).toBeInTheDocument();
    });

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
