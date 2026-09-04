import React from "react";
import { act, render, screen } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import PlanCard, { type PlanCardPlan, type PlanCardVariant } from "../index";

expect.extend(toHaveNoViolations);

jest.mock("next-intl", () => ({
  useTranslations: jest.fn(() => jest.fn((key) => key)),
}));

const templatePlan: PlanCardPlan = {
  variant: "template",
  title: "Standard Research Template",
  funding: "National Science Foundation",
  dmpId: "https://doi.org/10.1111/example",
  modified: "14-07-2026",
  created: "13-07-2026",
  versionedSections: [
    {
      versionedSectionId: 1,
      title: "Types of data produced",
      href: "/sections/1",
      answeredQuestions: 1,
      totalQuestions: 2,
    },
    {
      versionedSectionId: 2,
      title: "Data and metadata standards",
      href: "/sections/2",
      answeredQuestions: 0,
      totalQuestions: 1,
    },
    {
      customSectionId: 9,
      title: "Custom section",
      answeredQuestions: 0,
      totalQuestions: 1,
    },
  ],
  downloadHref: "/download",
  actionHref: "/update",
};

const uploadedPlan: PlanCardPlan = {
  variant: "uploaded",
  title: "V4b.1: Coastal Ocean Processes of North Greenland",
  modified: "29 Jul 26",
  created: "29 Jul 26",
  downloadHref: "/download",
  actionHref: "/update",
};

describe("PlanCard", () => {
  describe("variant", () => {
    it("defaults to template when variant is omitted", () => {
      render(<PlanCard plan={{ ...templatePlan, variant: undefined }} />);

      expect(screen.getByTestId("plan-card")).toHaveAttribute("data-variant", "template");
      expect(screen.getByRole("list", { name: "sections" })).toBeInTheDocument();
      expect(screen.queryByText("uploaded")).not.toBeInTheDocument();
    });

    it("treats unknown variants as template", () => {
      render(
        <PlanCard
          plan={{ ...templatePlan, variant: "draft" as PlanCardVariant }}
        />,
      );

      expect(screen.getByTestId("plan-card")).toHaveAttribute("data-variant", "template");
      expect(screen.getByRole("list", { name: "sections" })).toBeInTheDocument();
      expect(screen.queryByText("uploaded")).not.toBeInTheDocument();
    });
  });

  describe("template variant", () => {
    it("renders the plan title, sections, DOI, dates, and actions", () => {
      render(<PlanCard plan={templatePlan} />);

      expect(screen.getByTestId("plan-card")).toHaveAttribute("data-variant", "template");
      expect(screen.getByText("funding: National Science Foundation")).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: "Standard Research Template" })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: "Standard Research Template" })).toHaveAttribute("href", "/update");
      expect(screen.getByRole("heading", { name: "sections" })).toBeInTheDocument();
      expect(screen.getByRole("list", { name: "sections" })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: "Types of data produced" })).toHaveAttribute("href", "/sections/1");
      expect(screen.getAllByText("progress")).toHaveLength(3);
      expect(screen.getByText("Custom section")).toBeInTheDocument();
      expect(screen.getByRole("link", { name: "https://doi.org/10.1111/example" })).toHaveAttribute(
        "href",
        "https://doi.org/10.1111/example",
      );
      expect(screen.getByText(/lastUpdated: 14-07-2026/)).toBeInTheDocument();
      expect(screen.getByText(/created: 13-07-2026/)).toBeInTheDocument();
      expect(screen.getByRole("link", { name: "downloadWithTitle" })).toHaveAttribute("href", "/download");
      expect(screen.getByRole("link", { name: "actionWithTitle" })).toHaveAttribute("href", "/update");
      expect(screen.getByRole("link", { name: "actionWithTitle" })).toHaveTextContent("update");
    });

    it("renders the title as text when there is no actionHref", () => {
      const plan: PlanCardPlan = { ...templatePlan, actionHref: undefined };
      render(<PlanCard plan={plan} />);

      expect(screen.getByRole("heading", { name: "Standard Research Template" })).toBeInTheDocument();
      expect(screen.queryByRole("link", { name: "Standard Research Template" })).not.toBeInTheDocument();
    });

    it("renders a section title as text when it has no href", () => {
      render(<PlanCard plan={templatePlan} />);

      expect(screen.queryByRole("link", { name: "Custom section" })).not.toBeInTheDocument();
      expect(screen.getByText("Custom section")).toBeInTheDocument();
    });

    it("falls back to untitledPlan when the plan title is missing", () => {
      const plan: PlanCardPlan = { ...templatePlan, title: null };
      render(<PlanCard plan={plan} />);

      expect(screen.getByRole("heading", { name: "untitledPlan" })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: "untitledPlan" })).toHaveAttribute("href", "/update");
    });

    it("falls back to untitledSection when a section title is blank", () => {
      const plan: PlanCardPlan = {
        ...templatePlan,
        versionedSections: [
          {
            versionedSectionId: 1,
            title: "   ",
            href: "/sections/1",
            answeredQuestions: 0,
            totalQuestions: 1,
          },
        ],
      };
      render(<PlanCard plan={plan} />);

      expect(screen.getByRole("link", { name: "untitledSection" })).toHaveAttribute("href", "/sections/1");
    });

    it("omits DOI when dmpId is missing", () => {
      const plan: PlanCardPlan = { ...templatePlan, dmpId: null };
      render(<PlanCard plan={plan} />);

      expect(screen.queryByText(/doi:/i)).not.toBeInTheDocument();
      expect(screen.getByText(/lastUpdated: 14-07-2026/)).toBeInTheDocument();
    });

    it("renders dmpId as plain text when it is not a URL", () => {
      const plan: PlanCardPlan = { ...templatePlan, dmpId: "10.1111/example" };
      render(<PlanCard plan={plan} />);

      expect(screen.queryByRole("link", { name: "10.1111/example" })).not.toBeInTheDocument();
      expect(screen.getByText(/doi: 10.1111\/example/i)).toBeInTheDocument();
    });

    it("hides the sections list when none are provided", () => {
      const plan: PlanCardPlan = { ...templatePlan, versionedSections: undefined };
      render(<PlanCard plan={plan} />);

      expect(screen.queryByRole("heading", { name: "sections" })).not.toBeInTheDocument();
      expect(screen.queryByRole("list", { name: "sections" })).not.toBeInTheDocument();
    });

    it("hides Download when downloadHref is missing", () => {
      const plan: PlanCardPlan = { ...templatePlan, downloadHref: undefined };
      render(<PlanCard plan={plan} />);

      expect(screen.queryByRole("link", { name: "downloadWithTitle" })).not.toBeInTheDocument();
      expect(screen.getByRole("link", { name: "actionWithTitle" })).toBeInTheDocument();
    });

    it("hides the footer when both Download and Update hrefs are missing", () => {
      const plan: PlanCardPlan = {
        ...templatePlan,
        downloadHref: undefined,
        actionHref: undefined,
      };
      render(<PlanCard plan={plan} />);

      expect(screen.queryByRole("link", { name: "downloadWithTitle" })).not.toBeInTheDocument();
      expect(screen.queryByRole("link", { name: "actionWithTitle" })).not.toBeInTheDocument();
    });

    it("omits a date when created or modified is missing", () => {
      const { rerender } = render(
        <PlanCard plan={{ ...templatePlan, created: null }} />,
      );

      expect(screen.getByText(/lastUpdated: 14-07-2026/)).toBeInTheDocument();
      expect(screen.queryByText(/created:/)).not.toBeInTheDocument();

      rerender(<PlanCard plan={{ ...templatePlan, modified: null }} />);

      expect(screen.queryByText(/lastUpdated:/)).not.toBeInTheDocument();
      expect(screen.getByText(/created: 13-07-2026/)).toBeInTheDocument();
    });

    it("hides section progress when a count is missing", () => {
      const plan: PlanCardPlan = {
        ...templatePlan,
        versionedSections: [
          {
            versionedSectionId: 1,
            title: "Types of data produced",
            href: "/sections/1",
            answeredQuestions: 1,
          },
        ],
      };
      render(<PlanCard plan={plan} />);

      expect(screen.getByRole("link", { name: "Types of data produced" })).toBeInTheDocument();
      expect(screen.queryByText("progress")).not.toBeInTheDocument();
    });

    it("uses actionLabel when provided", () => {
      render(
        <PlanCard
          plan={{ ...templatePlan, actionLabel: "View plan" }}
        />,
      );

      expect(screen.getByRole("link", { name: "actionWithTitle" })).toHaveTextContent("View plan");
    });

    it("should not have accessibility violations", async () => {
      const { container } = render(<PlanCard plan={templatePlan} />);
      let results;
      await act(async () => {
        results = await axe(container);
      });
      expect(results).toHaveNoViolations();
    });
  });

  describe("uploaded variant", () => {
    it("renders the uploaded badge and compact dates without sections", () => {
      render(<PlanCard plan={uploadedPlan} />);

      expect(screen.getByTestId("plan-card")).toHaveAttribute("data-variant", "uploaded");
      expect(screen.getByText("funding: noFunderSelected")).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { name: "V4b.1: Coastal Ocean Processes of North Greenland" }),
      ).toBeInTheDocument();
      expect(screen.getByText("uploaded")).toBeInTheDocument();
      expect(
        screen.getByRole("link", { name: "V4b.1: Coastal Ocean Processes of North Greenland" }),
      ).toHaveAttribute("href", "/update");
      expect(screen.getByText(/uploadedDocument/)).toBeInTheDocument();
      expect(screen.getByText(/lastUpdated: 29 Jul 26/)).toBeInTheDocument();
      expect(screen.getByText(/created: 29 Jul 26/)).toBeInTheDocument();
      expect(screen.queryByRole("heading", { name: "sections" })).not.toBeInTheDocument();
      expect(screen.queryByRole("list", { name: "sections" })).not.toBeInTheDocument();
      expect(screen.queryByText(/doi:/i)).not.toBeInTheDocument();
      expect(screen.getByRole("link", { name: "downloadWithTitle" })).toHaveAttribute("href", "/download");
      expect(screen.getByRole("link", { name: "actionWithTitle" })).toHaveAttribute("href", "/update");
    });

    it("falls back to untitledPlan when the uploaded plan title is missing", () => {
      render(<PlanCard plan={{ ...uploadedPlan, title: " " }} />);

      expect(screen.getByRole("heading", { name: "untitledPlan" })).toBeInTheDocument();
    });

    it("does not show sections or DOI on an uploaded plan", () => {
      render(
        <PlanCard
          plan={{
            ...uploadedPlan,
            dmpId: "https://doi.org/10.1111/example",
            versionedSections: templatePlan.versionedSections,
          }}
        />,
      );

      expect(screen.queryByRole("list", { name: "sections" })).not.toBeInTheDocument();
      expect(screen.queryByText(/doi:/i)).not.toBeInTheDocument();
      expect(screen.getByText("uploaded")).toBeInTheDocument();
    });

    it("should not have accessibility violations", async () => {
      const { container } = render(<PlanCard plan={uploadedPlan} />);
      let results;
      await act(async () => {
        results = await axe(container);
      });
      expect(results).toHaveNoViolations();
    });
  });
});
