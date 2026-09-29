import React from "react";
import { act, render, screen } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import { NextIntlClientProvider } from "next-intl";
import planOverviewMessages from "@/messages/en-US/planBuilderPlanOverview.json";
import planAuthoringMessages from "@/messages/en-US/planAuthoring.json";
import PlanQuestionSaveStatus from "../index";
import type { PlanQuestionSaveState } from "../../model";

expect.extend(toHaveNoViolations);

jest.mock("next-intl", () => jest.requireActual("next-intl"));

const messages = { ...planOverviewMessages, ...planAuthoringMessages };

function renderStatus(state: PlanQuestionSaveState, lastSavedAt?: string) {
  return render(
    <NextIntlClientProvider locale="en-US" messages={messages} timeZone="UTC">
      <PlanQuestionSaveStatus state={state} lastSavedAt={lastSavedAt} />
    </NextIntlClientProvider>
  );
}

describe("PlanQuestionSaveStatus", () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it("renders nothing when clean and never saved", () => {
    renderStatus({ status: "clean" });

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it.each<[string, PlanQuestionSaveState, string]>([
    ["dirty", { status: "dirty" }, "Unsaved changes"],
    ["saving", { status: "saving" }, "Saving…"],
    ["saved", { status: "saved" }, "Saved"],
    [
      "invalid",
      { status: "invalid", messages: ["The answer is not in the proper format.", "Too long."] },
      "The answer is not in the proper format. Too long.",
    ],
    ["failed with a message", { status: "failed", message: "Forbidden" }, "Forbidden"],
    ["failed without a message", { status: "failed" }, "Unable to save answer."],
  ])("shows the %s state", (_label, state, text) => {
    renderStatus(state);

    const status = screen.getByRole("status");
    expect(status).toHaveTextContent(text, { normalizeWhitespace: true });
    expect(status).toHaveAttribute("aria-live", "polite");
  });

  it('shows "Saved just now", then "Last saved {relative}" as time passes', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-09-25T12:00:00Z"));

    renderStatus({ status: "saved" }, String(Date.now()));
    expect(screen.getByRole("status")).toHaveTextContent("Saved just now");

    act(() => {
      jest.advanceTimersByTime(60 * 1000);
    });
    expect(screen.getByRole("status")).toHaveTextContent("Last saved 1 minute ago");

    act(() => {
      jest.advanceTimersByTime(4 * 60 * 1000);
    });
    expect(screen.getByRole("status")).toHaveTextContent("Last saved 5 minutes ago");
  });

  it("shows the stored save time for a clean answer loaded from the server", () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-09-25T12:00:00Z"));
    const twoHoursAgo = String(Date.now() - 2 * 60 * 60 * 1000);

    renderStatus({ status: "clean" }, twoHoursAgo);

    expect(screen.getByRole("status")).toHaveTextContent("Last saved 2 hours ago");
  });

  it("prefers unsaved changes over the last saved time", () => {
    renderStatus({ status: "dirty" }, String(Date.now()));

    expect(screen.getByRole("status")).toHaveTextContent("Unsaved changes");
  });

  it("ignores a non-numeric lastSavedAt", () => {
    const { rerender } = renderStatus({ status: "clean" }, "yesterday");
    expect(screen.queryByRole("status")).not.toBeInTheDocument();

    rerender(
      <NextIntlClientProvider locale="en-US" messages={messages} timeZone="UTC">
        <PlanQuestionSaveStatus state={{ status: "saved" }} lastSavedAt="yesterday" />
      </NextIntlClientProvider>
    );
    expect(screen.getByRole("status")).toHaveTextContent(/^Saved$/);
  });

  it("has no accessibility violations", async () => {
    const { container } = renderStatus({ status: "saved" });

    expect(await axe(container)).toHaveNoViolations();
  });
});
