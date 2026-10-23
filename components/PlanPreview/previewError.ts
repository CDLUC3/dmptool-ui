import { CombinedGraphQLErrors } from "@apollo/client";

export type PreviewErrorKind = "forbidden" | "notFound" | "failed";

export class PreviewNotFoundError extends Error {
  constructor() {
    super("Not found");
    this.name = "PreviewNotFoundError";
  }
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
