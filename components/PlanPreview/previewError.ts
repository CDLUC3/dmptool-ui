import { CombinedGraphQLErrors } from "@apollo/client";

const PREVIEW_ERROR_KINDS = ["forbidden", "notFound", "failed"] as const;

export type PreviewErrorKind = (typeof PREVIEW_ERROR_KINDS)[number];

export function toPreviewErrorKind(message: string): PreviewErrorKind {
  return (PREVIEW_ERROR_KINDS as readonly string[]).includes(message) ? (message as PreviewErrorKind) : "failed";
}

export class PreviewNotFoundError extends Error {
  constructor() {
    super("Not found");
    this.name = "PreviewNotFoundError";
  }
}

export function logPreviewLoadError(error: unknown): void {
  console.error("Failed to load preview", error);
}

export function previewErrorKind(error: unknown): PreviewErrorKind {
  if (error instanceof PreviewNotFoundError) {
    return "notFound";
  }
  if (CombinedGraphQLErrors.is(error)) {
    const codes = error.errors.map((graphQLError) => graphQLError.extensions?.code);
    if (codes.includes("FORBIDDEN") || codes.includes("UNAUTHENTICATED")) {
      return "forbidden";
    }
    if (codes.includes("NOT_FOUND")) {
      return "notFound";
    }
  }
  return "failed";
}
