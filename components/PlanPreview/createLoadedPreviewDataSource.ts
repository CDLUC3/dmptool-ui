import type { PlanAuthoringModel } from "@/components/PlanAuthoring/model";
import type { PreviewDisplayLogic } from "./displayLogic";
import { createLocalPreviewDataSource, type LocalPreviewDataSource } from "./localPreviewDataSource";
import { previewErrorKind } from "./previewError";

export interface LoadedPreview {
  model: PlanAuthoringModel;
  displayLogic?: Map<number, PreviewDisplayLogic>;
}

/**
 * Loads the preview when first subscribed to, so pages that don't render it never fetch it.
 * A failed load's message is its PreviewErrorKind.
 */
export function createLoadedPreviewDataSource(
  loadPreview: () => Promise<LoadedPreview>
): LocalPreviewDataSource {
  let loadGeneration = 0;

  const load = () => {
    const generation = ++loadGeneration;
    loadPreview()
      .then(({ model, displayLogic }) => {
        if (generation !== loadGeneration) {
          return;
        }
        source.setDisplayLogic(displayLogic ?? new Map());
        source.setState({ status: "ready", model });
      })
      .catch((error: unknown) => {
        if (generation !== loadGeneration) {
          return;
        }
        console.error("Failed to load preview", error);
        source.setState({ status: "error", message: previewErrorKind(error) });
      });
  };

  const source = createLocalPreviewDataSource({ status: "loading" }, load);

  return {
    ...source,
    reload() {
      source.setState({ status: "loading" });
      load();
    },
  };
}
