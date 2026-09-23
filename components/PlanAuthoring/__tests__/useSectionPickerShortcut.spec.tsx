import { act, renderHook } from "@testing-library/react";
import { useSectionPickerShortcut } from "../useSectionPickerShortcut";

describe("useSectionPickerShortcut", () => {
  it("triggers on Cmd/Ctrl+K and ignores other combinations", () => {
    const onTrigger = jest.fn();
    renderHook(() => useSectionPickerShortcut(onTrigger));

    act(() => {
      window.dispatchEvent(
        new KeyboardEvent("keydown", { key: "k", ctrlKey: true })
      );
    });
    expect(onTrigger).toHaveBeenCalledTimes(1);

    act(() => {
      window.dispatchEvent(
        new KeyboardEvent("keydown", { key: "k", metaKey: true })
      );
    });
    expect(onTrigger).toHaveBeenCalledTimes(2);

    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "k" }));
      window.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "k",
          ctrlKey: true,
          shiftKey: true,
        })
      );
    });
    expect(onTrigger).toHaveBeenCalledTimes(2);
  });

  it("removes the listener on unmount", () => {
    const onTrigger = jest.fn();
    const { unmount } = renderHook(() => useSectionPickerShortcut(onTrigger));

    unmount();

    act(() => {
      window.dispatchEvent(
        new KeyboardEvent("keydown", { key: "k", ctrlKey: true })
      );
    });
    expect(onTrigger).not.toHaveBeenCalled();
  });
});
