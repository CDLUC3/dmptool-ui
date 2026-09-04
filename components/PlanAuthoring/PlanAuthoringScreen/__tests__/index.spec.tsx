import React from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe, toHaveNoViolations } from "jest-axe";
import PlanAuthoring from "../index";
import {
  createPlanAuthoringDemoDataSource,
  DEMO_PLAN_DOCUMENT,
} from "../../demo";

expect.extend(toHaveNoViolations);

if (typeof global.structuredClone !== "function") {
  global.structuredClone = (val: unknown) => JSON.parse(JSON.stringify(val));
}

global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

jest.mock("../../PlanDocumentUploadDialog", () => ({
  __esModule: true,
  default: ({
    isOpen,
    onOpenChange,
    fileName,
    onUpload,
  }: {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    fileName: string;
    onUpload?: (file: File) => void;
  }) =>
    isOpen ? (
      <div
        role="dialog"
        aria-label="upload-dialog"
      >
        <p>{fileName}</p>
        <button
          type="button"
          onClick={() => {
            onUpload?.(
              new File(["plan"], "replacement.docx", {
                type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
              })
            );
            onOpenChange(false);
          }}
        >
          fake-upload
        </button>
        <button
          type="button"
          onClick={() => onOpenChange(false)}
        >
          close-upload
        </button>
      </div>
    ) : null,
}));

describe("PlanAuthoringScreen", () => {
  it("renders the plan title and section navigation", () => {
    const dataSource = createPlanAuthoringDemoDataSource({ delayMs: 0 });
    render(<PlanAuthoring dataSource={dataSource} />);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "V4.3: Coastal Ocean Processes of North Greenland",
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("navigation", { name: "sectionNav.ariaLabel" })
    ).toBeInTheDocument();
    expect(screen.getByText("Products of research")).toBeInTheDocument();
    expect(
      screen.getByText("Primary character of data produced")
    ).toBeInTheDocument();
  });

  it("renders the plan document card instead of section navigation", () => {
    const dataSource = createPlanAuthoringDemoDataSource({ delayMs: 0 });
    render(
      <PlanAuthoring
        dataSource={dataSource}
        variant="document"
        document={DEMO_PLAN_DOCUMENT}
      />
    );

    expect(
      screen.getByRole("heading", { level: 2, name: "screen.planDocument" })
    ).toBeInTheDocument();
    expect(screen.getByTestId("plan-document-card")).toBeInTheDocument();
    expect(
      screen.getByText("Coastal_Ocean_DMP_Frost_2026.pdf")
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("navigation", { name: "sectionNav.ariaLabel" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "screen.writeYourPlan" })
    ).not.toBeInTheDocument();
  });

  it("does not render a document card when no document is provided", () => {
    const dataSource = createPlanAuthoringDemoDataSource({ delayMs: 0 });
    render(
      <PlanAuthoring
        dataSource={dataSource}
        variant="document"
      />
    );

    expect(
      screen.getByRole("heading", { level: 2, name: "screen.planDocument" })
    ).toBeInTheDocument();
    expect(screen.queryByTestId("plan-document-card")).not.toBeInTheDocument();
  });

  it("opens the upload dialog and replaces the document after upload", async () => {
    const user = userEvent.setup();
    const dataSource = createPlanAuthoringDemoDataSource({ delayMs: 0 });
    render(
      <PlanAuthoring
        dataSource={dataSource}
        variant="document"
        document={DEMO_PLAN_DOCUMENT}
      />
    );

    await user.click(
      screen.getByRole("button", { name: "document.updateDocument" })
    );
    expect(
      screen.getByRole("dialog", { name: "upload-dialog" })
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "fake-upload" }));
    expect(screen.getByText("replacement.docx")).toBeInTheDocument();
  });

  it("removes the document after delete is confirmed", async () => {
    const user = userEvent.setup();
    const dataSource = createPlanAuthoringDemoDataSource({ delayMs: 0 });
    render(
      <PlanAuthoring
        dataSource={dataSource}
        variant="document"
        document={DEMO_PLAN_DOCUMENT}
      />
    );

    await user.click(screen.getByRole("button", { name: "buttons.delete" }));
    await user.click(
      within(screen.getByRole("alertdialog")).getByRole("button", {
        name: "buttons.delete",
      })
    );

    expect(screen.queryByTestId("plan-document-card")).not.toBeInTheDocument();
  });

  it("updates the card when the document prop changes", () => {
    const dataSource = createPlanAuthoringDemoDataSource({ delayMs: 0 });
    const { rerender } = render(
      <PlanAuthoring
        dataSource={dataSource}
        variant="document"
        document={DEMO_PLAN_DOCUMENT}
      />
    );

    rerender(
      <PlanAuthoring
        dataSource={dataSource}
        variant="document"
        document={{
          ...DEMO_PLAN_DOCUMENT,
          fileName: "Updated_Plan.pdf",
        }}
      />
    );

    expect(screen.getByText("Updated_Plan.pdf")).toBeInTheDocument();
  });

  it("has no accessibility violations for the document variant", async () => {
    const dataSource = createPlanAuthoringDemoDataSource({ delayMs: 0 });
    const { container } = render(
      <PlanAuthoring
        dataSource={dataSource}
        variant="document"
        document={DEMO_PLAN_DOCUMENT}
      />
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
