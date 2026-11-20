import React from "react";
import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { axe, toHaveNoViolations } from "jest-axe";
import { useQuery } from "@apollo/client/react";
import { NextIntlClientProvider } from "next-intl";

import { ProjectDocument } from "@/generated/graphql";
import { ProjectPlanSelect, RelatedWorksSelect } from "@/components/RelatedWorksSelect";

expect.extend(toHaveNoViolations);

jest.mock("@apollo/client/react", () => ({
  useQuery: jest.fn(),
}));

const mockUseQuery = jest.mocked(useQuery);

const TestProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <NextIntlClientProvider
    locale="en"
    messages={{}}
  >
    {children}
  </NextIntlClientProvider>
);

describe("ProjectPlanSelect", () => {
  it("renders registered plans only", async () => {
    mockUseQuery.mockImplementation((document) => {
      if (document === ProjectDocument) {
        return {
          data: {
            project: {
              plans: [
                { id: 1, title: "Registered Plan", registered: "2024-01-01" },
                { id: 2, title: "Unregistered Plan", registered: null },
              ],
            },
          },
          loading: false,
          error: undefined,
          /* eslint-disable @typescript-eslint/no-explicit-any */
        } as any;
      }
      return { data: null, loading: false, error: undefined };
    });

    const setSelectedKey = jest.fn();

    render(
      <TestProviders>
        <ProjectPlanSelect
          projectId={1}
          selectedKey={null}
          setSelectedKey={setSelectedKey}
        />
      </TestProviders>,
    );

    // Open select
    await userEvent.click(screen.getByRole("button"));

    const options = within(screen.getByRole("listbox"))
      .getAllByRole("option")
      .map((o) => o.textContent);

    expect(options).toContain("Registered Plan");
    expect(options).not.toContain("Unregistered Plan");
  });
});

describe("RelatedWorksSelect", () => {
  it("renders items and allows selection", async () => {
    const setSelectedKey = jest.fn();

    render(
      <RelatedWorksSelect
        placeholder="Select item"
        selectedKey={null}
        setSelectedKey={setSelectedKey}
        items={[
          { id: 1, label: "Item One" },
          { id: 2, label: "Item Two" },
        ]}
      />,
    );

    // Open select
    await userEvent.click(screen.getByRole("button"));

    const options = within(screen.getByRole("listbox")).getAllByRole("option");
    expect(options.map((o) => o.textContent)).toEqual(["Item One", "Item Two"]);

    await userEvent.click(options[1]);
    expect(setSelectedKey).toHaveBeenCalledWith(2);
  });

  it("supports empty value selection", async () => {
    const setSelectedKey = jest.fn();

    render(
      <RelatedWorksSelect
        placeholder="Select item"
        selectedKey={1}
        setSelectedKey={setSelectedKey}
        includeEmptyValue
        items={[{ id: 1, label: "Item One" }]}
      />,
    );

    await userEvent.click(screen.getByRole("button"));

    const options = within(screen.getByRole("listbox")).getAllByRole("option");

    // Empty placeholder option
    await userEvent.click(options[0]);
    expect(setSelectedKey).toHaveBeenCalledWith(null);
  });

  it("uses the placeholder as the accessible name when there is no visible label", () => {
    const { container } = render(
      <RelatedWorksSelect
        placeholder="Select item"
        selectedKey={null}
        setSelectedKey={jest.fn()}
        items={[{ id: 1, label: "Item One" }]}
      />,
    );

    expect(screen.getByRole("button", { name: /Select item/ })).toBeInTheDocument();
    expect(container.querySelector(".react-aria-Label")).not.toBeInTheDocument();
  });

  it("shows a visible label that names the select", async () => {
    const { container } = render(
      <RelatedWorksSelect
        label="Sort by"
        placeholder="Select item"
        selectedKey={1}
        setSelectedKey={jest.fn()}
        items={[{ id: 1, label: "Item One" }]}
        containerClassName="custom-container"
      />,
    );

    expect(container.querySelector(".react-aria-Label")).toHaveTextContent("Sort by");
    const button = screen.getByRole("button", { name: "Item One Sort by" });
    expect(button.closest(".custom-container")).toBeInTheDocument();

    await userEvent.click(button);
    expect(screen.getByRole("listbox", { name: "Sort by" })).toBeInTheDocument();
  });

  it("can be opened and changed with the keyboard", async () => {
    const setSelectedKey = jest.fn();
    render(
      <RelatedWorksSelect
        label="Sort by"
        placeholder="Select item"
        selectedKey={1}
        setSelectedKey={setSelectedKey}
        items={[
          { id: 1, label: "Item One" },
          { id: 2, label: "Item Two" },
        ]}
      />,
    );

    await userEvent.tab();
    expect(screen.getByRole("button", { name: "Item One Sort by" })).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    expect(screen.getByRole("listbox")).toBeInTheDocument();
    await userEvent.keyboard("{ArrowDown}{Enter}");
    expect(setSelectedKey).toHaveBeenCalledWith(2);
  });

  it("should pass axe accessibility test", async () => {
    const { container } = render(
      <RelatedWorksSelect
        label="Sort by"
        placeholder="Select item"
        selectedKey={1}
        setSelectedKey={jest.fn()}
        items={[{ id: 1, label: "Item One" }]}
      />,
    );

    await act(async () => {
      expect(await axe(container)).toHaveNoViolations();
    });
  });
});

describe("ProjectPlanSelect with a label", () => {
  it("passes the visible label and container class through", () => {
    mockUseQuery.mockReturnValue({
      data: { project: { plans: [{ id: 1, title: "Registered Plan", registered: "2024-01-01" }] } },
      loading: false,
    } as any);

    const { container } = render(
      <TestProviders>
        <ProjectPlanSelect
          projectId={1}
          selectedKey={null}
          setSelectedKey={jest.fn()}
          label="Plan"
          containerClassName="plan-filter"
        />
      </TestProviders>,
    );

    expect(container.querySelector(".react-aria-Label")).toHaveTextContent("Plan");
    expect(screen.getByRole("button", { name: /Plan$/ })).toBeInTheDocument();
    expect(screen.getByRole("button").closest(".plan-filter")).toBeInTheDocument();
  });
});
