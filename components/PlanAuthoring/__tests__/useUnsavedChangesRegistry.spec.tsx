import { renderHook } from "@testing-library/react";
import { useUnsavedChangesRegistry } from "../useUnsavedChangesRegistry";

function beforeUnloadCalls(spy: jest.SpyInstance) {
  return spy.mock.calls.filter(([type]) => type === "beforeunload");
}

function dispatchBeforeUnload() {
  const event = new Event("beforeunload", { cancelable: true });
  window.dispatchEvent(event);
  return event;
}

describe("useUnsavedChangesRegistry", () => {
  it("adds the beforeunload listener only once a key is registered", () => {
    const addSpy = jest.spyOn(window, "addEventListener");
    const { result } = renderHook(() => useUnsavedChangesRegistry());

    expect(beforeUnloadCalls(addSpy)).toHaveLength(0);

    const unregister = result.current("base-question-1");
    expect(beforeUnloadCalls(addSpy)).toHaveLength(1);

    unregister();
  });

  it("keeps one listener for several keys and removes it after the last unregisters", () => {
    const addSpy = jest.spyOn(window, "addEventListener");
    const removeSpy = jest.spyOn(window, "removeEventListener");
    const { result } = renderHook(() => useUnsavedChangesRegistry());

    const unregisterFirst = result.current("base-question-1");
    const unregisterSecond = result.current("base-question-2");
    expect(beforeUnloadCalls(addSpy)).toHaveLength(1);

    unregisterFirst();
    expect(beforeUnloadCalls(removeSpy)).toHaveLength(0);

    unregisterSecond();
    expect(beforeUnloadCalls(removeSpy)).toHaveLength(1);
  });

  it("prevents unload only while something is registered", () => {
    const { result } = renderHook(() => useUnsavedChangesRegistry());

    expect(dispatchBeforeUnload().defaultPrevented).toBe(false);

    const unregister = result.current("base-question-1");
    expect(dispatchBeforeUnload().defaultPrevented).toBe(true);

    unregister();
    expect(dispatchBeforeUnload().defaultPrevented).toBe(false);
  });

  it("returns a stable register function across renders", () => {
    const { result, rerender } = renderHook(() => useUnsavedChangesRegistry());
    const first = result.current;

    rerender();

    expect(result.current).toBe(first);
  });
});
