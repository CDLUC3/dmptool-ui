import React from "react";
import { render, screen } from "@/utils/test-utils";
import { mockScrollIntoView, mockScrollTo } from "@/__mocks__/common";
import { createMockDataSource } from "@/components/PlanAuthoring/mocks";
import type { PlanAuthoringDataSource } from "@/components/PlanAuthoring";
import TemplatePreviewPage from "../page";
import {
  toTemplatePreviewModel,
  type TemplatePreviewTemplate,
} from "../toTemplatePreviewModel";

let mockDataSource: PlanAuthoringDataSource;
const mockCustomizeGuidance = jest.fn();

jest.mock("next/navigation", () => ({
  useParams: jest.fn(() => ({ templateId: "7" })),
}));

jest.mock("@/i18n/routing", () => ({
  Link: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>{children}</a>
  ),
  useRouter: jest.fn(() => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() })),
}));

jest.mock("@/components/BackButton", () => ({
  __esModule: true,
  default: () => <div>Mocked Back Button</div>,
}));

jest.mock("@/components/PlanAuthoring", () => ({
  PlanAuthoring: ({ onCustomizeGuidance }: { onCustomizeGuidance?: () => void }) => (
    <button type="button" onClick={onCustomizeGuidance}>
      Plan authoring
    </button>
  ),
}));

jest.mock("@/components/PlanPreview/PreviewProvider", () => ({
  usePreviewDataSource: () => mockDataSource,
}));

jest.mock("@/components/PlanPreview/usePreviewCustomizeGuidance", () => ({
  usePreviewCustomizeGuidance: () => mockCustomizeGuidance,
}));

const EXAMPLE_GUIDANCE = { label: "Example org", shortName: "Example", bodyHtml: "<p>Example</p>", noTemplateGuidanceNoteHtml: "" };

function renderWith(sections: TemplatePreviewTemplate["sections"]) {
  mockDataSource = createMockDataSource({
    model: toTemplatePreviewModel(
      { id: 7, name: "NSF DMP", owner: null, sections },
      EXAMPLE_GUIDANCE
    ),
  });
  render(<TemplatePreviewPage />);
}

describe("TemplatePreviewPage", () => {
  beforeEach(() => {
    HTMLElement.prototype.scrollIntoView = mockScrollIntoView;
    mockScrollTo();
  });

  it("asks for a section when the template has none", () => {
    renderWith([]);

    expect(screen.getByText("empty.noSectionsTitle")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "empty.addSection" })).toHaveAttribute(
      "href",
      "/template/7/section/new"
    );
    expect(screen.queryByText("Plan authoring")).not.toBeInTheDocument();
  });

  it("asks for a question when no section has one", () => {
    renderWith([
      { id: 1, name: "Data", displayOrder: 1, questions: [] },
      { id: 2, name: "Sharing", displayOrder: 2, questions: null },
    ]);

    expect(screen.getByText("empty.noQuestionsTitle")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "empty.addQuestion" })).toHaveAttribute(
      "href",
      "/template/7"
    );
    expect(screen.queryByText("Plan authoring")).not.toBeInTheDocument();
  });

  it("shows the preview once a section has a question, with customize guidance intercepted", () => {
    renderWith([
      { id: 1, name: "Empty", displayOrder: 1, questions: [] },
      {
        id: 2,
        name: "Data",
        displayOrder: 2,
        questions: [{ id: 10, displayOrder: 1, json: '{"type":"text"}' }],
      },
    ]);

    expect(screen.queryByText("empty.noSectionsTitle")).not.toBeInTheDocument();
    expect(screen.queryByText("empty.noQuestionsTitle")).not.toBeInTheDocument();
    screen.getByRole("button", { name: "Plan authoring" }).click();
    expect(mockCustomizeGuidance).toHaveBeenCalled();
  });

  it("explains when the template can't be previewed", () => {
    const dataSource = createMockDataSource({ model: toTemplatePreviewModel({ id: 7, name: "NSF DMP", owner: null, sections: [] }, EXAMPLE_GUIDANCE) });
    const errorState = { status: "error" as const, message: "forbidden" };
    mockDataSource = { ...dataSource, getState: () => errorState };
    render(<TemplatePreviewPage />);

    expect(screen.getByText("errors.forbidden.title")).toBeInTheDocument();
    expect(screen.queryByText("Plan authoring")).not.toBeInTheDocument();
  });
});
