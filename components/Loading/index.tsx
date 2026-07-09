"use client";

import React from "react";
import Spinner from "@/components/Spinner";
import "./loading.scss";

interface LoadingProps {
  /** Custom loading message. If not provided, uses Global('messaging.loading') */
  message?: string;
  /** Whether to show the spinner animation */
  showSpinner?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Whether the loading state is active */
  isActive?: boolean;
  /** Loading variant: 'page' | 'inline' | 'minimal' | 'fullscreen' */
  variant?: "page" | "inline" | "minimal" | "fullscreen";
}

/**
 * Reusable Loading component that displays a loading message with optional spinner
 * Replaces repetitive loading divs throughout the application
 *
 * @example
 * // Full page loading (pushes footer to bottom)
 * <Loading variant="page" />
 *
 * // Inline loading (compact, doesn't affect layout)
 * <Loading variant="inline" />
 *
 * // Minimal loading (very small)
 * <Loading variant="minimal" />
 *
 * // Fullscreen overlay (for modals)
 * <Loading variant="fullscreen" />
 */
const Loading: React.FC<LoadingProps> = ({
  message,
  showSpinner = true,
  className = "",
  isActive = true,
  variant = "page",
}) => {
  if (!isActive) {
    return null;
  }

  // Build className with appropriate variant
  const loadingClassName = ["loading-component", `loading-${variant}`, className].filter(Boolean).join(" ");

  return (
    <div
      className={loadingClassName}
      role="status"
      aria-live="polite"
      data-testid="loading-component"
    >
      {showSpinner && (
        <Spinner
          isActive={true}
          className="loading-spinner"
        />
      )}
      {message && <span className="loading-message">{message}</span>}
    </div>
  );
};

export default Loading;
