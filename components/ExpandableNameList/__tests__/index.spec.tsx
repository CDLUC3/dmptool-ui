import React from "react";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useTranslations } from "next-intl";
import ExpandableNameList from "../index";
import "@testing-library/jest-dom";
import { axe, toHaveNoViolations } from "jest-axe";

expect.extend(toHaveNoViolations);

// Include the count so the "+N more" label can be checked
const translate = (key: string, values?: { count?: number }) =>
  values?.count == null ? key : `${key}:${values.count}`;

function ExpandableNameListHarness({ maxItems }: { maxItems: number }) {
  return (
    <ExpandableNameList
      items={[{ name: "One" }, { name: "Two" }, { name: "Three" }, { name: "Four" }]}
      matches={[{ index: 0, score: 2 }, { index: 1, score: 1 }]}
      maxItems={maxItems}
      renderItem={(item) => {
        return <span>{item.name}</span>;
      }}
    />
  );
}

describe("ExpandableNameList", () => {
  beforeEach(() => {
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    jest.mocked(useTranslations).mockReturnValue(translate as any);
  });

  it("should render every item without a toggle when they fit", async () => {
    render(<ExpandableNameListHarness maxItems={4} />);

    expect(screen.getByText("One")).toBeInTheDocument();
    expect(screen.getByText("Four")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("should show the first items and a translated toggle for the rest", async () => {
    render(<ExpandableNameListHarness maxItems={2} />);

    expect(screen.getByText("One")).toBeInTheDocument();
    expect(screen.getByText("Two")).toBeInTheDocument();
    expect(screen.queryByText("Three")).not.toBeInTheDocument();

    const toggle = screen.getByRole("button", { name: "showMore:2" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");

    await userEvent.click(toggle);
    expect(screen.getByText("Three")).toBeInTheDocument();
    expect(screen.getByText("Four")).toBeInTheDocument();
    expect(toggle).toHaveTextContent("showLess");
    expect(toggle).toHaveAttribute("aria-expanded", "true");

    await userEvent.click(toggle);
    expect(screen.queryByText("Three")).not.toBeInTheDocument();
    expect(toggle).toHaveTextContent("showMore:2");
  });

  it("should toggle with the keyboard", async () => {
    render(<ExpandableNameListHarness maxItems={2} />);

    await userEvent.tab();
    const toggle = screen.getByRole("button", { name: "showMore:2" });
    expect(toggle).toHaveFocus();

    await userEvent.keyboard("{Enter}");
    expect(screen.getByText("Three")).toBeInTheDocument();
    await userEvent.keyboard(" ");
    expect(screen.queryByText("Three")).not.toBeInTheDocument();
  });

  it("should pass axe accessibility test", async () => {
    const { container } = render(<ExpandableNameListHarness maxItems={2} />);

    await act(async () => {
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
