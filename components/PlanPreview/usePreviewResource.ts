"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { logPreviewLoadError } from "./previewError";

type PreviewResource<T> =
  | { status: "loading" }
  | { status: "ready"; data: T }
  | { status: "error"; error: unknown };

/** `reload` keeps showing the current data until it finishes. */
export function usePreviewResource<T>(
  load: () => Promise<T>
): PreviewResource<T> & { reload: () => void } {
  const [resource, setResource] = useState<PreviewResource<T>>({ status: "loading" });
  const [generation, setGeneration] = useState(0);

  useEffect(() => {
    let cancelled = false;
    load()
      .then((data) => {
        if (!cancelled) {
          setResource({ status: "ready", data });
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          logPreviewLoadError(error);
          setResource({ status: "error", error });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [load, generation]);

  const reload = useCallback(() => setGeneration((value) => value + 1), []);
  return useMemo(() => ({ ...resource, reload }), [resource, reload]);
}
