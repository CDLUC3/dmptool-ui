"use client";

import React from "react";
import DOMPurify from "dompurify";

export type SafeHtmlProps = {
  html: string | null | undefined;
  className?: string;
  as?: keyof JSX.IntrinsicElements; // wrapper element for HTML content (when HTML tags exist)
  wrapPlainText?: boolean; // wrap plain strings (no tags) in a block element
  plainTextWrapper?: keyof JSX.IntrinsicElements; // which element to wrap plain text with
};

type PurifyLike = {
  sanitize?: (dirty: string) => string;
};

function resolvePurify(): PurifyLike | null {
  const imported = DOMPurify as unknown as PurifyLike & { default?: PurifyLike };
  const candidate =
    typeof imported?.sanitize === "function"
      ? imported
      : imported?.default && typeof imported.default.sanitize === "function"
        ? imported.default
        : null;
  return candidate;
}

/**
 * DOMPurify needs a browser DOM. On the server (SSR) the default export often has
 * no working `sanitize`, which previously crashed pages that render SafeHtml.
 */
function sanitizeHtml(html: string): string {
  if (typeof window === "undefined") {
    // Keep SSR stable; strip obvious script blocks only.
    return html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "");
  }

  const purify = resolvePurify();
  if (!purify?.sanitize) {
    return html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "");
  }

  return purify.sanitize(html);
}

/**
 * SafeHtml
 * Renders sanitized HTML. If the string contains no HTML tags and wrapPlainText is true,
 * it wraps the content in a plainTextWrapper (defaults to <p>).
 * Note: This is a client component because it uses DOMPurify.
 */
export const SafeHtml: React.FC<SafeHtmlProps> = ({
  html,
  className,
  as = "div",
  wrapPlainText = true,
  plainTextWrapper = "p",
}) => {
  if (!html) return null;

  const sanitized = sanitizeHtml(html);
  if (!sanitized || sanitized.trim() === "") return null;

  const containsTag = /<[^>]+>/i.test(sanitized);

  if (!containsTag && wrapPlainText) {
    const PlainWrapper = (plainTextWrapper || "p") as keyof JSX.IntrinsicElements;
    // Using React.createElement to keep typing simple for dynamic tag
    return React.createElement(PlainWrapper, { className }, sanitized);
  }

  const Wrapper = (as || "div") as keyof JSX.IntrinsicElements;
  // Using React.createElement to support dynamic wrapper element
  return React.createElement(Wrapper, {
    className,
    dangerouslySetInnerHTML: { __html: sanitized },
  });
};

export default SafeHtml;
