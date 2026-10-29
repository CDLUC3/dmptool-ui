import { renderHook } from "@testing-library/react";
import { useUnsavedChangesRegistry } from "../useUnsavedChangesRegistry";

function dispatchBeforeUnload() {
  const event = new Event("beforeunload", { cancelable: true });
  window.dispatchEvent(event);
  return event;
}

describe("useUnsavedChangesRegistry", () => {
  it("prevents unload only while a key is registered", () => {
    const { result } = renderHook(() => useUnsavedChangesRegistry());

    expect(dispatchBeforeUnload().defaultPrevented).toBe(false);

    const unregister = result.current("base-question-1");
    expect(dispatchBeforeUnload().defaultPrevented).toBe(true);

    unregister();
    expect(dispatchBeforeUnload().defaultPrevented).toBe(false);
  });

  it("keeps warning until the last key unregisters", () => {
    const { result } = renderHook(() => useUnsavedChangesRegistry());

    const unregisterFirst = result.current("base-question-1");
    const unregisterSecond = result.current("base-question-2");
    expect(dispatchBeforeUnload().defaultPrevented).toBe(true);

    unregisterFirst();
    expect(dispatchBeforeUnload().defaultPrevented).toBe(true);

    unregisterSecond();
    expect(dispatchBeforeUnload().defaultPrevented).toBe(false);
  });

  it("returns a stable register function across renders", () => {
    const { result, rerender } = renderHook(() => useUnsavedChangesRegistry());
    const first = result.current;

    rerender();

    expect(result.current).toBe(first);
  });
});
