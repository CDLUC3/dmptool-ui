import React from "react";
import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe, toHaveNoViolations } from "jest-axe";
import PlanAuthoring from "../index";
import type { PlanAuthoringState } from "../../dataSource";
import {
  createMockDataSource,
  createScenarioDataSource,
  makeModel,
  MOCK_PLAN_DOCUMENT,
} from "../../mocks";
import { spyOnDataSource } from "../../mocks/spyOnDataSource";

expect.extend(toHaveNoViolations);

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

function createDataSource(initialState: PlanAuthoringState) {
  const dataSource = spyOnDataSource(
    createMockDataSource({ model: makeModel(), initialState })
  );
  dataSource.reload.mockImplementation(() => undefined);
  const emit = (next: PlanAuthoringState) => {
    act(() => {
      dataSource.setState(next);
    });
  };
  return { dataSource, emit };
}

describe("PlanAuthoringScreen load states", () => {
  it("shows the loading state", () => {
    const { dataSource } = createDataSource({ status: "loading" });
    render(<PlanAuthoring dataSource={dataSource} />);

    expect(screen.getByText("screen.loadingPlan")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { level: 2, name: "Data collection" })).not.toBeInTheDocument();
  });

  it("shows the error with its message and a Retry that reloads", async () => {
    const user = userEvent.setup();
    const { dataSource } = createDataSource({
      status: "error",
      message: "Plan 18 could not be fetched",
    });
    render(<PlanAuthoring dataSource={dataSource} />);

    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("screen.loadFailed");
    expect(alert).toHaveTextContent("Plan 18 could not be fetched");

    await user.click(within(alert).getByRole("button", { name: "common.retry" }));

    expect(dataSource.reload).toHaveBeenCalledTimes(1);
  });

  it("renders the sections and questions when ready", () => {
    const { dataSource } = createDataSource({ status: "ready", model: makeModel() });
    render(<PlanAuthoring dataSource={dataSource} />);

    expect(screen.getByRole("heading", { level: 1, name: "Ocean Currents DMP" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Data collection" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Custom sharing section" })).toBeInTheDocument();
    expect(screen.getByText("How you gather data.")).toBeInTheDocument();
    expect(screen.getByText("Funder requirements for data.")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 3, name: "What data will you collect?" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 3, name: "Who can access the data?" })
    ).toBeInTheDocument();
    expect(screen.getAllByRole("textbox", { name: "text" }).map((field) => (field as HTMLInputElement).value)).toEqual([
      "Surveys",
      "",
    ]);
    expect(screen.queryByText("screen.loadingPlan")).not.toBeInTheDocument();
  });

  it("shows the answered state per question, for base and custom questions alike", () => {
    const { dataSource } = createDataSource({ status: "ready", model: makeModel() });
    render(<PlanAuthoring dataSource={dataSource} />);

    const baseQuestion = screen.getByRole("article", { name: "What data will you collect?" });
    const customQuestion = screen.getByRole("article", { name: "Who can access the data?" });

    expect(within(baseQuestion).getByRole("img", { name: "question.answeredAria" })).toBeInTheDocument();
    expect(within(customQuestion).getByRole("img", { name: "question.notAnswered" })).toBeInTheDocument();
    expect(within(baseQuestion).getByRole("button", { name: "question.requiredByFunder" })).toBeInTheDocument();
    expect(within(customQuestion).queryByRole("button", { name: "question.requiredByFunder" })).not.toBeInTheDocument();
  });

  it("renders a section's requirements only when it has them", () => {
    const { dataSource } = createDataSource({ status: "ready", model: makeModel() });
    render(<PlanAuthoring dataSource={dataSource} />);

    const baseSection = screen.getByRole("region", { name: "Data collection" });
    const customSection = screen.getByRole("region", { name: "Custom sharing section" });

    expect(within(baseSection).getByText("Funder requirements for data.")).toBeInTheDocument();
    expect(within(customSection).queryByText("Funder requirements for data.")).not.toBeInTheDocument();
    expect(within(customSection).queryByText("How you gather data.")).not.toBeInTheDocument();
  });

  it("says so when a section has no questions", () => {
    const model = makeModel();
    const { dataSource } = createDataSource({
      status: "ready",
      model: { ...model, sections: [model.sections[0], { ...model.sections[1], questions: [] }] },
    });
    render(<PlanAuthoring dataSource={dataSource} />);

    const emptySection = screen.getByRole("region", { name: "Custom sharing section" });
    const filledSection = screen.getByRole("region", { name: "Data collection" });
    expect(within(emptySection).getByText("section.noQuestions")).toBeInTheDocument();
    expect(within(filledSection).queryByText("section.noQuestions")).not.toBeInTheDocument();
  });

  it("moves from loading to ready when the data source notifies", () => {
    const { dataSource, emit } = createDataSource({ status: "loading" });
    render(<PlanAuthoring dataSource={dataSource} />);
    expect(screen.getByText("screen.loadingPlan")).toBeInTheDocument();

    emit({ status: "ready", model: makeModel() });

    expect(screen.queryByText("screen.loadingPlan")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Data collection" })).toBeInTheDocument();
  });

  it("moves from error back to loading after Retry", async () => {
    const user = userEvent.setup();
    const { dataSource, emit } = createDataSource({ status: "error", message: "Boom" });
    dataSource.reload.mockImplementation(() => emit({ status: "loading" }));
    render(<PlanAuthoring dataSource={dataSource} />);

    await user.click(screen.getByRole("button", { name: "common.retry" }));

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByText("screen.loadingPlan")).toBeInTheDocument();
  });

  it("shows the read-only notice and no Save buttons when answers can't be edited", () => {
    const model = makeModel();
    const { dataSource } = createDataSource({
      status: "ready",
      model: { ...model, capabilities: { ...model.capabilities, canEditAnswers: false } },
    });
    render(<PlanAuthoring dataSource={dataSource} />);

    expect(screen.getByText("screen.readOnlyTitle")).toBeInTheDocument();
    expect(screen.getByText("screen.readOnlyNotice")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "buttons.save" })).not.toBeInTheDocument();
    screen
      .getAllByRole("textbox", { name: "text" })
      .forEach((field) => expect(field).toBeDisabled());
  });

  it("has no read-only notice when answers can be edited", () => {
    const { dataSource } = createDataSource({ status: "ready", model: makeModel() });
    render(<PlanAuthoring dataSource={dataSource} />);

    expect(screen.queryByText("screen.readOnlyTitle")).not.toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "buttons.save" })).toHaveLength(2);
  });

  it("replaces the default top block with the overview slot", () => {
    const { dataSource } = createDataSource({ status: "ready", model: makeModel() });
    render(
      <PlanAuthoring
        dataSource={dataSource}
        overview={<section aria-label="Real plan overview">Overview</section>}
      />
    );

    expect(screen.getByRole("region", { name: "Real plan overview" })).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { level: 1, name: "Ocean Currents DMP" })
    ).not.toBeInTheDocument();
    expect(screen.queryByText("screen.fundingTitle")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Data collection" })).toBeInTheDocument();
  });

  it("warns before unload while an answer has unsaved changes", async () => {
    const user = userEvent.setup();
    const { dataSource } = createDataSource({ status: "ready", model: makeModel() });
    render(<PlanAuthoring dataSource={dataSource} />);

    const unload = () => {
      const event = new Event("beforeunload", { cancelable: true });
      window.dispatchEvent(event);
      return event.defaultPrevented;
    };
    expect(unload()).toBe(false);

    const [, emptyField] = screen.getAllByRole("textbox", { name: "text" });
    await user.type(emptyField, "Only the team");
    expect(unload()).toBe(true);

    const saveButtons = screen.getAllByRole("button", { name: "buttons.save" });
    await user.click(saveButtons[1]);

    expect(dataSource.saveAnswer).toHaveBeenLastCalledWith("custom-question-21", {
      type: "text",
      answer: "Only the team",
    });
    expect(unload()).toBe(false);
  });
});

describe("PlanAuthoringScreen", () => {
  it("loads the plan over GraphQL and renders the title, header and section navigation", async () => {
    const dataSource = createScenarioDataSource("editable");
    render(<PlanAuthoring dataSource={dataSource} />);

    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: "V4.3: Coastal Ocean Processes of North Greenland",
      })
    ).toBeInTheDocument();
    expect(
      screen.getByText("Jennifer Frost (PI), Amelia Snow (Other)")
    ).toBeInTheDocument();
    expect(screen.getByText("University of California CDL")).toBeInTheDocument();
    expect(screen.getByText("screen.relatedWorksEmpty")).toBeInTheDocument();
    expect(
      screen.getByRole("navigation", { name: "sectionNav.ariaLabel" })
    ).toBeInTheDocument();
    expect(screen.getByText("Products of research")).toBeInTheDocument();
    expect(
      screen.getByText("Primary character of data produced")
    ).toBeInTheDocument();
  });

  it("replaces the built-in top block with the overview node", async () => {
    const dataSource = createScenarioDataSource("editable");
    render(
      <PlanAuthoring
        dataSource={dataSource}
        overview={<section aria-label="custom-overview">Real plan overview</section>}
      />
    );

    expect(await screen.findByText("Products of research")).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", {
        level: 1,
        name: "V4.3: Coastal Ocean Processes of North Greenland",
      })
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: "custom-overview" })
    ).toBeInTheDocument();
    expect(screen.getByText("Products of research")).toBeInTheDocument();
  });

  it("renders the plan document card instead of section navigation", () => {
    const dataSource = createMockDataSource();
    render(
      <PlanAuthoring
        dataSource={dataSource}
        variant="document"
        planDocument={MOCK_PLAN_DOCUMENT}
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
    const dataSource = createMockDataSource();
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
    const dataSource = createMockDataSource();
    render(
      <PlanAuthoring
        dataSource={dataSource}
        variant="document"
        planDocument={MOCK_PLAN_DOCUMENT}
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
    const dataSource = createMockDataSource();
    render(
      <PlanAuthoring
        dataSource={dataSource}
        variant="document"
        planDocument={MOCK_PLAN_DOCUMENT}
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
    const dataSource = createMockDataSource();
    const { rerender } = render(
      <PlanAuthoring
        dataSource={dataSource}
        variant="document"
        planDocument={MOCK_PLAN_DOCUMENT}
      />
    );

    rerender(
      <PlanAuthoring
        dataSource={dataSource}
        variant="document"
        planDocument={{
          ...MOCK_PLAN_DOCUMENT,
          fileName: "Updated_Plan.pdf",
        }}
      />
    );

    expect(screen.getByText("Updated_Plan.pdf")).toBeInTheDocument();
  });

  it("has no accessibility violations for the document variant", async () => {
    const dataSource = createMockDataSource();
    const { container } = render(
      <PlanAuthoring
        dataSource={dataSource}
        variant="document"
        planDocument={MOCK_PLAN_DOCUMENT}
      />
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("has no accessibility violations for the questions variant", async () => {
    const dataSource = createScenarioDataSource("editable");
    const { container } = render(<PlanAuthoring dataSource={dataSource} />);
    await screen.findByText("Products of research");

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  }, 60000);
});
