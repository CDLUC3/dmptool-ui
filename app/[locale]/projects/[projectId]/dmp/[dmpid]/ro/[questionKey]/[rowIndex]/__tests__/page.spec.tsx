import React from "react";
import { render, screen, within } from "@testing-library/react";
import "@testing-library/jest-dom";
import { axe, toHaveNoViolations } from "jest-axe";
import { useParams } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { usePlanAuthoringDataSource } from "@/components/PlanAuthoring/usePlanAuthoringDataSource";
import PlanResearchOutputEditScreen from "@/components/PlanAuthoring/PlanResearchOutputEditScreen";
import PlanResearchOutputPage from "../page";

expect.extend(toHaveNoViolations);

jest.mock("@/components/PlanAuthoring/usePlanAuthoringDataSource", () => ({
  usePlanAuthoringDataSource: jest.fn(),
}));

jest.mock("@/components/PlanAuthoring/PlanResearchOutputEditScreen", () => ({
  __esModule: true,
  default: jest.fn(),
}));

const mockUseParams = useParams as jest.Mock;
const mockUseDataSource = usePlanAuthoringDataSource as jest.Mock;
const MockEditScreen = PlanResearchOutputEditScreen as unknown as jest.Mock;
const dataSource = { name: "plan data source" };

function renderPage(locale = "en-US") {
  return render(
    <NextIntlClientProvider locale={locale} messages={{}} onError={() => {}}>
      <PlanResearchOutputPage />
    </NextIntlClientProvider>
  );
}

describe("PlanResearchOutputPage", () => {
  beforeEach(() => {
    mockUseParams.mockReturnValue({
      projectId: "36",
      dmpid: "26",
      questionKey: "base-question-13164",
      rowIndex: "2",
    });
    mockUseDataSource.mockReturnValue(dataSource);
    MockEditScreen.mockImplementation(({ breadcrumbs }) => (
      <main>{breadcrumbs("Edit research output")}</main>
    ));
  });

  it("edits the requested row of the plan's research output question", () => {
    renderPage();

    expect(mockUseDataSource).toHaveBeenCalledWith(26);
    expect(MockEditScreen).toHaveBeenCalledWith(
      expect.objectContaining({
        dataSource,
        questionKeyParam: "base-question-13164",
        rowIndexParam: "2",
        planHref: "/en-US/projects/36/dmp/26",
      }),
      undefined
    );
  });

  it("links the breadcrumbs back to the plan in the current locale", () => {
    renderPage("pt-BR");

    const nav = screen.getByRole("list", { name: "breadcrumbs.navigation" });
    const hrefs = within(nav)
      .getAllByRole("link")
      .map((link) => link.getAttribute("href"));
    expect(hrefs).toEqual([
      "/pt-BR",
      "/pt-BR/projects",
      "/pt-BR/projects/36",
      "/pt-BR/projects/36/dmp/26",
    ]);
    expect(within(nav).getByText("Edit research output")).toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    const { container } = renderPage();
    expect(await axe(container)).toHaveNoViolations();
  });
});
