import { toPreviewErrorKind } from "../previewError";

describe("toPreviewErrorKind", () => {
  it.each(["forbidden", "notFound", "failed"])("keeps %s", (kind) => {
    expect(toPreviewErrorKind(kind)).toBe(kind);
  });

  it("treats anything else as failed", () => {
    expect(toPreviewErrorKind("Network down")).toBe("failed");
  });
});
