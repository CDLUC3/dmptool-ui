/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe, toHaveNoViolations } from "jest-axe";
import PlanDocumentUploadDialog from "../index";

expect.extend(toHaveNoViolations);

jest.mock("react-aria-components", () => ({
  ModalOverlay: ({ children, isOpen, className }: any) =>
    isOpen ? <div className={className}>{children}</div> : null,
  Modal: ({ children, className }: any) => (
    <div className={className}>{children}</div>
  ),
  Dialog: ({ children, className, ["aria-label"]: ariaLabel }: any) => (
    <div
      role="dialog"
      aria-label={ariaLabel}
      className={className}
    >
      {children}
    </div>
  ),
  Heading: ({ children, className }: any) => (
    <h2 className={className}>{children}</h2>
  ),
  Button: ({ children, onPress, isDisabled, className }: any) => (
    <button
      type="button"
      onClick={onPress}
      disabled={isDisabled}
      className={className}
    >
      {children}
    </button>
  ),
  DropZone: ({ children, className, ["aria-label"]: ariaLabel }: any) => (
    <div
      className={className}
      role="group"
      aria-label={ariaLabel}
    >
      {children}
    </div>
  ),
  FileTrigger: ({ children, onSelect }: any) => (
    <div>
      {children}
      <input
        type="file"
        data-testid="file-input"
        aria-label="uploadDialog.selectFile"
        onChange={(event) => onSelect(event.target.files)}
      />
    </div>
  ),
}));

const fileName = "Coastal_Ocean_DMP_Frost_2026.pdf";

describe("PlanDocumentUploadDialog", () => {
  it("does not render when closed", () => {
    render(
      <PlanDocumentUploadDialog
        isOpen={false}
        onOpenChange={jest.fn()}
        fileName={fileName}
      />
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders the warning, labelled dropzone, and a disabled upload button", () => {
    render(
      <PlanDocumentUploadDialog
        isOpen
        onOpenChange={jest.fn()}
        fileName={fileName}
      />
    );

    expect(
      screen.getByRole("dialog", { name: "uploadDialog.title" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "uploadDialog.title" })
    ).toBeInTheDocument();
    expect(screen.getByText("uploadDialog.replaceWarning")).toBeInTheDocument();
    expect(screen.getByText("uploadDialog.uploadHeading")).toBeInTheDocument();
    expect(screen.getByText("uploadDialog.fileTypes")).toBeInTheDocument();
    expect(
      screen.getByRole("group", { name: "uploadDialog.dropAria" })
    ).toBeInTheDocument();
    expect(screen.getByText("uploadDialog.dropHint")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "uploadDialog.upload" })
    ).toBeDisabled();
  });

  it("shows the selected file name and enables upload", async () => {
    const user = userEvent.setup();
    render(
      <PlanDocumentUploadDialog
        isOpen
        onOpenChange={jest.fn()}
        fileName={fileName}
      />
    );

    const file = new File(["plan"], "replacement.pdf", {
      type: "application/pdf",
    });
    await user.upload(screen.getByTestId("file-input"), file);

    expect(screen.getByText("uploadDialog.selectedFile")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "uploadDialog.upload" })
    ).toBeEnabled();
  });

  it("resets the selected file when the dialog is reopened", async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <PlanDocumentUploadDialog
        isOpen
        onOpenChange={jest.fn()}
        fileName={fileName}
      />
    );

    const file = new File(["plan"], "replacement.pdf", {
      type: "application/pdf",
    });
    await user.upload(screen.getByTestId("file-input"), file);
    expect(screen.getByText("uploadDialog.selectedFile")).toBeInTheDocument();

    rerender(
      <PlanDocumentUploadDialog
        isOpen={false}
        onOpenChange={jest.fn()}
        fileName={fileName}
      />
    );
    rerender(
      <PlanDocumentUploadDialog
        isOpen
        onOpenChange={jest.fn()}
        fileName={fileName}
      />
    );

    expect(screen.getByText("uploadDialog.dropHint")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "uploadDialog.upload" })
    ).toBeDisabled();
  });

  it("calls onUpload and closes after a file is chosen", async () => {
    const user = userEvent.setup();
    const onOpenChange = jest.fn();
    const onUpload = jest.fn();
    render(
      <PlanDocumentUploadDialog
        isOpen
        onOpenChange={onOpenChange}
        fileName={fileName}
        onUpload={onUpload}
      />
    );

    const file = new File(["plan"], "replacement.pdf", {
      type: "application/pdf",
    });
    await user.upload(screen.getByTestId("file-input"), file);
    await user.click(
      screen.getByRole("button", { name: "uploadDialog.upload" })
    );

    expect(onUpload).toHaveBeenCalledWith(file);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("closes when Cancel is pressed", async () => {
    const user = userEvent.setup();
    const onOpenChange = jest.fn();
    render(
      <PlanDocumentUploadDialog
        isOpen
        onOpenChange={onOpenChange}
        fileName={fileName}
      />
    );

    await user.click(screen.getByRole("button", { name: "buttons.cancel" }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("has no accessibility violations when open", async () => {
    const { container } = render(
      <PlanDocumentUploadDialog
        isOpen
        onOpenChange={jest.fn()}
        fileName={fileName}
      />
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
