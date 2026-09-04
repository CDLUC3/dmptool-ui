import React from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe, toHaveNoViolations } from "jest-axe";
import PlanDocumentCard from "../index";
import type { PlanDocument } from "../../model";

expect.extend(toHaveNoViolations);

const planDocument: PlanDocument = {
  fileName: "Coastal_Ocean_DMP_Frost_2026.pdf",
  fileType: "PDF",
  doi: "https://doi.org/10.48321/D116c4ef8f",
  modified: "04-13-2026",
  created: "04-13-2026",
  downloadHref: "#download",
};

describe("PlanDocumentCard", () => {
  it("renders the file name, DOI, dates, and actions", () => {
    render(
      <PlanDocumentCard
        document={planDocument}
        onUpdate={jest.fn()}
        onDelete={jest.fn()}
      />
    );

    expect(
      screen.getByRole("link", { name: planDocument.fileName })
    ).toHaveAttribute("href", "#download");
    expect(screen.getByRole("link", { name: planDocument.doi })).toHaveAttribute(
      "href",
      planDocument.doi
    );
    expect(screen.getByText("document.lastUpdated")).toBeInTheDocument();
    expect(screen.getByText("document.created")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "document.downloadAria" })
    ).toHaveAttribute("href", "#download");
    expect(
      screen.getByRole("button", { name: "buttons.delete" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "document.updateDocument" })
    ).toBeInTheDocument();
  });

  it("derives the file type from the filename when none is provided", () => {
    render(
      <PlanDocumentCard
        document={{ fileName: "notes.docx" }}
        onUpdate={jest.fn()}
        onDelete={jest.fn()}
      />
    );

    expect(screen.getByText("notes.docx")).toBeInTheDocument();
    expect(screen.getByText("document.fileType")).toBeInTheDocument();
  });

  it("hides download when there is no download href", () => {
    render(
      <PlanDocumentCard
        document={{ fileName: "plan.pdf", fileType: "PDF" }}
        onUpdate={jest.fn()}
        onDelete={jest.fn()}
      />
    );

    expect(
      screen.queryByRole("link", { name: "plan.pdf" })
    ).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "plan.pdf" })).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "document.downloadAria" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "document.downloadAria" })
    ).not.toBeInTheDocument();
  });

  it("omits DOI and date lines that are not provided", () => {
    render(
      <PlanDocumentCard
        document={{ fileName: "plan.pdf", modified: "04-13-2026" }}
        onUpdate={jest.fn()}
        onDelete={jest.fn()}
      />
    );

    expect(screen.queryByText("document.doi")).not.toBeInTheDocument();
    expect(screen.getByText("document.lastUpdated")).toBeInTheDocument();
    expect(screen.queryByText("document.created")).not.toBeInTheDocument();
  });

  it("renders created without a separator when modified is missing", () => {
    render(
      <PlanDocumentCard
        document={{ fileName: "plan.pdf", created: "04-13-2026" }}
        onUpdate={jest.fn()}
        onDelete={jest.fn()}
      />
    );

    expect(screen.getByText("document.created")).toBeInTheDocument();
    expect(screen.queryByText("document.lastUpdated")).not.toBeInTheDocument();
  });

  it("renders a non-URL DOI as text", () => {
    render(
      <PlanDocumentCard
        document={{ fileName: "plan.pdf", doi: "10.1234/example" }}
        onUpdate={jest.fn()}
        onDelete={jest.fn()}
      />
    );

    expect(
      screen.queryByRole("link", { name: "10.1234/example" })
    ).not.toBeInTheDocument();
    expect(screen.getByText("10.1234/example")).toBeInTheDocument();
  });

  it("calls onUpdate when Update document is pressed", async () => {
    const user = userEvent.setup();
    const onUpdate = jest.fn();
    render(
      <PlanDocumentCard
        document={planDocument}
        onUpdate={onUpdate}
        onDelete={jest.fn()}
      />
    );

    await user.click(
      screen.getByRole("button", { name: "document.updateDocument" })
    );
    expect(onUpdate).toHaveBeenCalledTimes(1);
  });

  it("opens a confirm dialog before deleting", async () => {
    const user = userEvent.setup();
    const onDelete = jest.fn();
    render(
      <PlanDocumentCard
        document={planDocument}
        onUpdate={jest.fn()}
        onDelete={onDelete}
      />
    );

    await user.click(screen.getByRole("button", { name: "buttons.delete" }));
    expect(onDelete).not.toHaveBeenCalled();
    const confirm = screen.getByRole("alertdialog");
    expect(within(confirm).getByText("document.deleteTitle")).toBeInTheDocument();
    expect(within(confirm).getByText("document.deleteWarning")).toBeInTheDocument();

    await user.click(
      within(confirm).getByRole("button", { name: "buttons.delete" })
    );
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it("closes the delete confirm dialog on cancel", async () => {
    const user = userEvent.setup();
    const onDelete = jest.fn();
    render(
      <PlanDocumentCard
        document={planDocument}
        onUpdate={jest.fn()}
        onDelete={onDelete}
      />
    );

    await user.click(screen.getByRole("button", { name: "buttons.delete" }));
    await user.click(
      within(screen.getByRole("alertdialog")).getByRole("button", {
        name: "buttons.cancel",
      })
    );

    expect(onDelete).not.toHaveBeenCalled();
    expect(screen.queryByText("document.deleteTitle")).not.toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(
      <PlanDocumentCard
        document={planDocument}
        onUpdate={jest.fn()}
        onDelete={jest.fn()}
      />
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("has no accessibility violations with the delete confirm open", async () => {
    const user = userEvent.setup();
    render(
      <PlanDocumentCard
        document={planDocument}
        onUpdate={jest.fn()}
        onDelete={jest.fn()}
      />
    );

    await user.click(screen.getByRole("button", { name: "buttons.delete" }));
    const results = await axe(document.body);
    expect(results).toHaveNoViolations();
  });
});
