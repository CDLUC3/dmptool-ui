"use client";

import { useEffect, useRef } from "react";

/** The editor removes its draft when it closes, usually after saving, so load the saved version. */
export function useReloadWhenDraftCloses(draft: unknown, reload: () => void) {
  const hadDraftRef = useRef(false);
  useEffect(() => {
    if (draft) {
      hadDraftRef.current = true;
    } else if (hadDraftRef.current) {
      hadDraftRef.current = false;
      reload();
    }
  }, [draft, reload]);
}
