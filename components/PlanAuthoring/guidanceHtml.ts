const HTML_ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (char) => HTML_ESCAPES[char]);
}

/** Tagged guidance gets its tag name as an h5; untitled guidance is the text alone. */
export function guidanceBlockHtml(
  title: string | null | undefined,
  guidanceText: string | null | undefined
): string {
  if (!guidanceText) {
    return "";
  }
  return title ? `<h5>${escapeHtml(title)}</h5>${guidanceText}` : guidanceText;
}
