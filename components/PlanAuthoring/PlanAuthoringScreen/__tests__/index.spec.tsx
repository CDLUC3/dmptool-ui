import React from "react";
import { render, screen } from "@testing-library/react";
import PlanAuthoring from "../index";
import { createPlanAuthoringDemoDataSource } from "../../demo";

if (typeof global.structuredClone !== "function") {
  global.structuredClone = (val: unknown) => JSON.parse(JSON.stringify(val));
}

global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
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
});
