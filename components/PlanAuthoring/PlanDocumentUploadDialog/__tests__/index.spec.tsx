/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { axe, toHaveNoViolations } from "jest-axe";
import PlanDocumentUploadDialog from "../index";

expect.extend(toHaveNoViolations);

// Modal portal/focus-trap is awkward in unit tests; DropZone exposes onDrop for coverage.
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
  DropZone: ({ children, className, ["aria-label"]: ariaLabel, onDrop }: any) => (
    <div
      className={className}
      role="group"
      aria-label={ariaLabel}
      data-testid="drop-zone"
    >
      <button
        type="button"
        data-testid="simulate-drop"
        onClick={() => {
          if (!onDrop) {
            return;
          }
          const dropItems = (globalThis as any).__planUploadDropItems as
            | unknown[]
            | undefined;
          if (dropItems) {
            onDrop({ items: dropItems });
            return;
          }
          const files = (globalThis as any).__planUploadDropFiles as
            | File[]
            | undefined;
          onDrop({
            items: (files ?? []).map((file) => ({
              kind: "file",
              name: file.name,
              type: file.type,
              getFile: async () => file,
            })),
          });
        }}
      >
        Simulate drop
      </button>
      {children}
    </div>
  ),
  FileTrigger: ({ children, onSelect }: any) => (
    <div>
      {children}
      <input
        type="file"
        aria-label="uploadDialog.selectFile"
        onChange={(event) => onSelect(event.target.files)}
      />
    </div>
  ),
  Text: ({ children, className, role }: any) => (
    <p
      className={className}
      role={role}
    >
      {children}
    </p>
  ),
}));

const fileName = "Coastal_Ocean_DMP_Frost_2026.pdf";
const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024;
const DOC_MIME = "application/msword";
const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

function makeFile(
  name: string,
  type: string,
  options?: { sizeBytes?: number; content?: string }
) {
  const file = new File([options?.content ?? "dummy content"], name, { type });
  if (options?.sizeBytes != null) {
    Object.defineProperty(file, "size", { value: options.sizeBytes });
  }
  return file;
}

function selectFile(file: File | null) {
  const input = document.querySelector(
    'input[type="file"]'
  ) as HTMLInputElement;
  expect(input).toBeInTheDocument();
  fireEvent.change(input, {
    target: { files: file ? [file] : [] },
  });
}

async function dropFiles(files: File[]) {
  delete (globalThis as any).__planUploadDropItems;
  (globalThis as any).__planUploadDropFiles = files;
  await act(async () => {
    fireEvent.click(screen.getByTestId("simulate-drop"));
  });
}

async function dropItems(items: unknown[]) {
  delete (globalThis as any).__planUploadDropFiles;
  (globalThis as any).__planUploadDropItems = items;
  await act(async () => {
    fireEvent.click(screen.getByTestId("simulate-drop"));
  });
}

function renderDialog(
  props?: Partial<React.ComponentProps<typeof PlanDocumentUploadDialog>>
) {
  const merged = {
    isOpen: true,
    onOpenChange: jest.fn(),
    fileName,
    ...props,
  };
  return {
    ...render(<PlanDocumentUploadDialog {...merged} />),
    onOpenChange: merged.onOpenChange,
    onUpload: merged.onUpload,
  };
}

describe("PlanDocumentUploadDialog", () => {
  afterEach(() => {
    delete (globalThis as any).__planUploadDropFiles;
    delete (globalThis as any).__planUploadDropItems;
  });

  it("does not render when closed", () => {
    renderDialog({ isOpen: false });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("should render the dialog with the warning, dropzone, and disabled upload", () => {
    renderDialog();

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


  it("should display an error when an invalid file type is uploaded", async () => {
    renderDialog();

    selectFile(makeFile("example.txt", "application/text"));

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(
        "uploadDialog.errors.invalidType"
      )
    );
    expect(screen.getByText("uploadDialog.dropHint")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "uploadDialog.upload" })
    ).toBeDisabled();
  });


  it("should accept a valid file and display its name", async () => {
    renderDialog();

    selectFile(makeFile("example.pdf", "application/pdf"));

    await waitFor(() => {
      expect(screen.getByText("uploadDialog.selectedFile")).toBeInTheDocument();
    });
    expect(
      screen.getByRole("button", { name: "uploadDialog.upload" })
    ).toBeEnabled();
  });


  it("should keep upload disabled when no file has been selected", () => {
    renderDialog();

    expect(
      screen.getByRole("button", { name: "uploadDialog.upload" })
    ).toBeDisabled();
  });

  it("should display an error when the file is larger than 20MB", async () => {
    renderDialog();

    selectFile(
      makeFile("huge.pdf", "application/pdf", {
        sizeBytes: 21 * 1024 * 1024,
      })
    );

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(
        "uploadDialog.errors.tooLarge"
      )
    );
    expect(
      screen.getByRole("button", { name: "uploadDialog.upload" })
    ).toBeDisabled();
  });

  it.each([
    ["plan.doc", DOC_MIME],
    ["plan.docx", DOCX_MIME],
  ])("should accept %s by MIME type", async (name, type) => {
    renderDialog();

    selectFile(makeFile(name, type));

    await waitFor(() => {
      expect(screen.getByText("uploadDialog.selectedFile")).toBeInTheDocument();
    });
    expect(
      screen.getByRole("button", { name: "uploadDialog.upload" })
    ).toBeEnabled();
  });

  it.each(["plan.pdf", "plan.doc", "plan.docx"])(
    "should accept %s via extension when MIME type is missing",
    async (name) => {
      renderDialog();

      selectFile(makeFile(name, ""));

      await waitFor(() => {
        expect(
          screen.getByText("uploadDialog.selectedFile")
        ).toBeInTheDocument();
      });
      expect(
        screen.getByRole("button", { name: "uploadDialog.upload" })
      ).toBeEnabled();
    }
  );

  it("should reject an unknown extension when MIME type is missing", async () => {
    renderDialog();

    selectFile(makeFile("notes.txt", ""));

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(
        "uploadDialog.errors.invalidType"
      )
    );
    expect(
      screen.getByRole("button", { name: "uploadDialog.upload" })
    ).toBeDisabled();
  });

  it("should accept a file that is exactly 20MB", async () => {
    renderDialog();

    selectFile(
      makeFile("exact.pdf", "application/pdf", {
        sizeBytes: MAX_FILE_SIZE_BYTES,
      })
    );

    await waitFor(() => {
      expect(screen.getByText("uploadDialog.selectedFile")).toBeInTheDocument();
    });
    expect(
      screen.getByRole("button", { name: "uploadDialog.upload" })
    ).toBeEnabled();
  });

  it("should reject a file one byte over 20MB", async () => {
    renderDialog();

    selectFile(
      makeFile("over.pdf", "application/pdf", {
        sizeBytes: MAX_FILE_SIZE_BYTES + 1,
      })
    );

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(
        "uploadDialog.errors.tooLarge"
      )
    );
  });

  it("should accept a dropped PDF after validating type", async () => {
    renderDialog();

    await dropFiles([makeFile("dropped.pdf", "application/pdf")]);

    await waitFor(() => {
      expect(screen.getByText("uploadDialog.selectedFile")).toBeInTheDocument();
    });
    expect(
      screen.getByRole("button", { name: "uploadDialog.upload" })
    ).toBeEnabled();
  });

  it("should reject an invalid file type on drop", async () => {
    renderDialog();

    await dropFiles([makeFile("notes.txt", "text/plain")]);

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        "uploadDialog.errors.invalidType"
      );
    });
    expect(
      screen.getByRole("button", { name: "uploadDialog.upload" })
    ).toBeDisabled();
  });

  it("should show tooLarge when an oversized file is dropped", async () => {
    renderDialog();

    await dropFiles([
      makeFile("huge.pdf", "application/pdf", {
        sizeBytes: MAX_FILE_SIZE_BYTES + 1,
      }),
    ]);

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        "uploadDialog.errors.tooLarge"
      );
    });
  });

  it("should warn when multiple files are dropped and keep the first valid file", async () => {
    renderDialog();

    await dropFiles([
      makeFile("first.pdf", "application/pdf"),
      makeFile("second.pdf", "application/pdf"),
    ]);

    await waitFor(() => {
      expect(screen.getByText("uploadDialog.selectedFile")).toBeInTheDocument();
    });
    expect(screen.getByRole("alert")).toHaveTextContent(
      "uploadDialog.errors.multipleFiles"
    );
    expect(
      screen.getByRole("button", { name: "uploadDialog.upload" })
    ).toBeEnabled();
  });

  it("should reject multiple drops when the first file has an invalid type", async () => {
    renderDialog();

    await dropFiles([
      makeFile("notes.txt", "text/plain"),
      makeFile("ok.pdf", "application/pdf"),
    ]);

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        "uploadDialog.errors.invalidType"
      );
    });
    expect(screen.getByText("uploadDialog.dropHint")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "uploadDialog.upload" })
    ).toBeDisabled();
  });

  it("should reject multiple drops when the first file is too large", async () => {
    renderDialog();

    await dropFiles([
      makeFile("huge.pdf", "application/pdf", {
        sizeBytes: MAX_FILE_SIZE_BYTES + 1,
      }),
      makeFile("ok.pdf", "application/pdf"),
    ]);

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        "uploadDialog.errors.tooLarge"
      );
    });
    expect(
      screen.getByRole("button", { name: "uploadDialog.upload" })
    ).toBeDisabled();
  });

  it("should ignore an empty drop", async () => {
    renderDialog();

    await dropItems([]);

    expect(screen.getByText("uploadDialog.dropHint")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("should ignore drops that contain no file items", async () => {
    renderDialog();

    await dropItems([{ kind: "text", types: ["text/plain"] }]);

    expect(screen.getByText("uploadDialog.dropHint")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("should ignore an empty file picker selection", async () => {
    renderDialog();

    selectFile(null);

    expect(screen.getByText("uploadDialog.dropHint")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("should clear a previous error when a valid file is selected", async () => {
    renderDialog();

    selectFile(makeFile("notes.txt", "text/plain"));
    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(
        "uploadDialog.errors.invalidType"
      )
    );

    selectFile(makeFile("ok.pdf", "application/pdf"));

    await waitFor(() => {
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });
    expect(screen.getByText("uploadDialog.selectedFile")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "uploadDialog.upload" })
    ).toBeEnabled();
  });

  it("should reset the selected file and error when the dialog is reopened", async () => {
    const { rerender } = renderDialog();

    selectFile(makeFile("notes.txt", "text/plain"));
    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });

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
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "uploadDialog.upload" })
    ).toBeDisabled();
  });

  it("should call onUpload and close after a valid file is uploaded", async () => {
    const user = userEvent.setup();
    const onOpenChange = jest.fn();
    const onUpload = jest.fn();
    renderDialog({ onOpenChange, onUpload });

    const file = makeFile("example.pdf", "application/pdf");
    selectFile(file);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "uploadDialog.upload" })
      ).toBeEnabled();
    });

    await user.click(
      screen.getByRole("button", { name: "uploadDialog.upload" })
    );

    expect(onUpload).toHaveBeenCalledWith(file);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("should close after upload even when onUpload is omitted", async () => {
    const user = userEvent.setup();
    const onOpenChange = jest.fn();
    renderDialog({ onOpenChange });

    selectFile(makeFile("example.pdf", "application/pdf"));
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "uploadDialog.upload" })
      ).toBeEnabled();
    });

    await user.click(
      screen.getByRole("button", { name: "uploadDialog.upload" })
    );

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("should close when Cancel is pressed", async () => {
    const user = userEvent.setup();
    const onOpenChange = jest.fn();
    renderDialog({ onOpenChange });

    await user.click(screen.getByRole("button", { name: "buttons.cancel" }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("should pass accessibility tests", async () => {
    const { container } = renderDialog();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
