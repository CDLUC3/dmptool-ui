import React, { forwardRef, useEffect, ReactNode } from "react";
import { scrollToTop } from '@/utils/general';

type ErrorMessagesProps = {
  errors: string[] | Record<string, string | null | undefined>;
  noScroll?: boolean;
  firstInvalidFieldRef?: React.RefObject<HTMLElement>;
};

// Shared Error Message rendering component for both arrays and objects
const ErrorMessages = forwardRef<HTMLDivElement, ErrorMessagesProps>(
  ({ errors, noScroll, firstInvalidFieldRef }, ref) => {
    useEffect(() => {
      if (noScroll || !errors || Object.keys(errors).length === 0) return;

      // If we have a specific field ref, scroll to that field instead of the error message
      if (firstInvalidFieldRef?.current) {
        firstInvalidFieldRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Focus the field for accessibility
        if ('focus' in firstInvalidFieldRef.current && typeof firstInvalidFieldRef.current.focus === 'function') {
          firstInvalidFieldRef.current.focus();
        }
      } else if (ref && "current" in ref && ref.current) {
        // Fall back to scrolling to the error message container
        scrollToTop(ref);
      }
    }, [errors, ref, noScroll, firstInvalidFieldRef]);


    // Filter out empty or invalid errors
    const hasValidErrors = (): boolean => {
      if (Array.isArray(errors)) {
        return errors.some((error) => error && error.trim() !== "");
      }

      return Object.values(errors).some((error) => error && error.trim() !== "");
    };

    if (!errors || !hasValidErrors()) return null;

    const renderErrors = (): ReactNode => {
      if (Array.isArray(errors)) {
        return errors
          .filter((error) => error && error.trim() !== "")
          .map((error, index) => <p key={index}>{error}</p>);
      }

      return Object.entries(errors)
        .filter(([_, error]) => error && error.trim() !== "")
        .map(([key, error]) => <p key={key}>{error}</p>);
    };

    return (
      <div className="messages error" role="alert" aria-live="assertive" ref={ref} data-testid="error-messages">
        {renderErrors()}
      </div>
    );
  }
);

ErrorMessages.displayName = "ErrorMessages";

export default ErrorMessages;