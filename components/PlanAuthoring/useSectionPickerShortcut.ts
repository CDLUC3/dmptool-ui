"use client";

import { useEffect, useState } from "react";

function isApplePlatform(): boolean {
  if (typeof navigator === "undefined") {
    return false;
  }
  return /Mac|iPhone|iPad|iPod/i.test(
    // userAgentData is not yet in all TS lib DOM typings.
    (navigator as { userAgentData?: { platform?: string } }).userAgentData
      ?.platform ??
      navigator.platform ??
      navigator.userAgent
  );
}

/**
 * Platform-aware label for the section picker shortcut. Renders "Ctrl+K"
 * during SSR and swaps to "⌘K" on Apple platforms after hydration.
 */
export function useSectionPickerShortcutLabel(): string {
  const [label, setLabel] = useState("Ctrl+K");

  useEffect(() => {
    if (isApplePlatform()) {
      setLabel("⌘K");
    }
  }, []);

  return label;
}

/**
 * Global Cmd+K (mac) / Ctrl+K (windows, linux) shortcut that opens the
 * section picker. Ignored while another modal already has the shortcut's
 * default behavior (the picker itself handles Escape).
 */
export function useSectionPickerShortcut(onTrigger: () => void): void {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (
        (event.metaKey || event.ctrlKey) &&
        !event.altKey &&
        !event.shiftKey &&
        event.key.toLowerCase() === "k"
      ) {
        event.preventDefault();
        onTrigger();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onTrigger]);
}
