import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import globalMessages from "@/messages/en-US/global.json";
import planAuthoringMessages from "@/messages/en-US/planAuthoring.json";
import PlanSectionPickerDialog from "../index";
import { sectionKey, type PlanSectionDefinition } from "../../model";
import { makeQuestion, makeSection } from "../../mocks";

jest.mock("next-intl", () => jest.requireActual("next-intl"));

const messages = { ...globalMessages, ...planAuthoringMessages };

function section(id: number, title: string, answered: boolean[] = []) {
  return makeSection({
    identity: { kind: "base", versionedSectionId: id },
    title,
    questions: answered.map((hasAnswer, index) =>
      makeQuestion({
        identity: { kind: "base", versionedQuestionId: id * 100 + index },
        hasAnswer,
      })
    ),
  });
}

const sections = [
  section(1, "Data collection", [true, true]),
  section(2, "Documentation", [true, false]),
  section(3, "Storage and backup"),
  section(4, "Data sharing", [false]),
];

function renderPicker({
  activeSection = sections[1],
}: { activeSection?: PlanSectionDefinition | null } = {}) {
  const onOpenChange = jest.fn();
  const onSelect = jest.fn();
  render(
    <NextIntlClientProvider locale="en-US" messages={messages} timeZone="UTC">
      <PlanSectionPickerDialog
        isOpen
        onOpenChange={onOpenChange}
        sections={sections}
        activeSectionKey={activeSection ? sectionKey(activeSection.identity) : null}
        onSelect={onSelect}
      />
    </NextIntlClientProvider>
  );
  return { onOpenChange, onSelect, search: screen.getByRole("textbox", { name: "Search sections" }) };
}

const option = (title: string) => screen.getByRole("button", { name: new RegExp(title) });
const highlighted = () =>
  document.querySelector<HTMLElement>('[data-highlighted="true"]')?.textContent;

beforeAll(() => {
  Element.prototype.scrollIntoView = jest.fn();
});

describe("PlanSectionPickerDialog", () => {
  it("lists every section with its answered count and marks the current one", () => {
    renderPicker();

    expect(option("Data collection")).toHaveTextContent("✓2/2");
    expect(option("Documentation")).toHaveTextContent("1/2");
    expect(option("Storage and backup")).toHaveTextContent("0/0");
    expect(option("Documentation")).toHaveAttribute("aria-current", "true");
    expect(option("Documentation")).toHaveTextContent("Current");
    expect(option("Data collection")).not.toHaveAttribute("aria-current");
  });

  it("starts the highlight on the current section", () => {
    renderPicker();
    expect(highlighted()).toContain("Documentation");
  });

  it("starts on the first section when there is no current one", () => {
    renderPicker({ activeSection: null });
    expect(highlighted()).toContain("Data collection");
  });

  it("filters by title, keeps the original numbering, and highlights the first match", async () => {
    const user = userEvent.setup();
    const { search } = renderPicker();

    await user.type(search, "  DATA ");

    expect(screen.queryByRole("button", { name: /Documentation/ })).not.toBeInTheDocument();
    expect(option("Data sharing")).toHaveTextContent(/^4/);
    expect(highlighted()).toContain("Data collection");
  });

  it("says so when nothing matches, and ignores navigation keys", async () => {
    const user = userEvent.setup();
    const { search, onSelect } = renderPicker();

    await user.type(search, "zzz");
    expect(screen.getByText("No sections match.")).toBeInTheDocument();

    await user.keyboard("{ArrowDown}{Enter}");
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("moves the highlight with the arrow, Home and End keys, wrapping at both ends", async () => {
    const user = userEvent.setup();
    const { search } = renderPicker({ activeSection: sections[0] });
    search.focus();

    await user.keyboard("{ArrowUp}");
    expect(highlighted()).toContain("Data sharing");
    await user.keyboard("{ArrowDown}");
    expect(highlighted()).toContain("Data collection");
    await user.keyboard("{ArrowDown}");
    expect(highlighted()).toContain("Documentation");
    await user.keyboard("{End}");
    expect(highlighted()).toContain("Data sharing");
    await user.keyboard("{Home}");
    expect(highlighted()).toContain("Data collection");
  });

  it("selects the highlighted section on Enter and closes", async () => {
    const user = userEvent.setup();
    const { search, onSelect, onOpenChange } = renderPicker({ activeSection: sections[0] });
    search.focus();

    await user.keyboard("{ArrowDown}{ArrowDown}{Enter}");

    expect(onSelect).toHaveBeenCalledWith(sections[2]);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("selects a clicked section and closes", async () => {
    const user = userEvent.setup();
    const { onSelect, onOpenChange } = renderPicker();

    await user.click(option("Data sharing"));

    expect(onSelect).toHaveBeenCalledWith(sections[3]);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("moves the highlight to a hovered section", async () => {
    const user = userEvent.setup();
    renderPicker();

    await user.hover(option("Storage and backup"));
    expect(highlighted()).toContain("Storage and backup");
  });

  it("closes from the close button and clears the search", async () => {
    const user = userEvent.setup();
    const { search, onOpenChange } = renderPicker();

    await user.type(search, "zzz");
    await user.click(screen.getByRole("button", { name: "Close" }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(search).toHaveValue("");
  });

  it("closes on Escape", async () => {
    const user = userEvent.setup();
    const { search, onOpenChange } = renderPicker();
    search.focus();

    await user.keyboard("{Escape}");
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
