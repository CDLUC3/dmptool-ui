"use client";

import { useCallback, useRef } from "react";

export type RegisterUnsavedChange = (questionKeyValue: string) => () => void;

function warnBeforeUnload(event: BeforeUnloadEvent) {
  event.preventDefault();
  event.returnValue = "";
}

export function useUnsavedChangesRegistry(): RegisterUnsavedChange {
  const pendingRef = useRef(new Set<string>());

  return useCallback((questionKeyValue) => {
    const pending = pendingRef.current;
    pending.add(questionKeyValue);
    if (pending.size === 1) {
      window.addEventListener("beforeunload", warnBeforeUnload);
    }
    return () => {
      pending.delete(questionKeyValue);
      if (pending.size === 0) {
        window.removeEventListener("beforeunload", warnBeforeUnload);
      }
    };
  }, []);
}
