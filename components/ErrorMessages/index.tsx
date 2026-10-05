import React, { forwardRef, useEffect, ReactNode } from "react";
import { scrollToTop } from '@/utils/general';
import TransitionLink from '@/components/TransitionLink';

// An error message with links, e.g. to the items that need to be changed before the user can continue
export type ErrorMessageItem = {
  message: string;
  linksHeading?: string; // Shown above the links, e.g. "Edit the display logic on:"
  links?: { href: string; label: string }[];
};

export type ErrorMessage = string | ErrorMessageItem;

type ErrorMessagesProps = {
  errors: ErrorMessage[] | Record<string, string | null | undefined>;
  noScroll?: boolean;
  firstInvalidFieldRef?: React.RefObject<HTMLElement | null>;
};

const isValidError = (error: ErrorMessage | null | undefined): boolean => {
  if (!error) return false;
  if (typeof error === 'string') return error.trim() !== '';
  return error.message.trim() !== '';
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
        ref.current.focus(); // Focus the error message container for accessibility
      }
    }, [errors, ref, noScroll, firstInvalidFieldRef]);


    // Filter out empty or invalid errors
    const hasValidErrors = (): boolean => {
      if (Array.isArray(errors)) {
        return errors.some(isValidError);
      }

      return Object.values(errors).some(isValidError);
    };

    if (!errors || !hasValidErrors()) return null;

    const renderError = (error: ErrorMessage, key: React.Key): ReactNode => {
      if (typeof error === 'string') {
        return <p key={key}>{error}</p>;
      }

      return (
        <div key={key}>
          <p>{error.message}</p>
          {error.links && error.links.length > 0 && (
            <>
              {error.linksHeading && <p>{error.linksHeading}</p>}
              <ul>
                {error.links.map((link) => (
                  <li key={link.href}>
                    <TransitionLink href={link.href}>{link.label}</TransitionLink>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      );
    };

    const renderErrors = (): ReactNode => {
      if (Array.isArray(errors)) {
        return errors
          .filter(isValidError)
          .map((error, index) => renderError(error, index));
      }

      return Object.entries(errors)
        .filter(([_, error]) => isValidError(error))
        .map(([key, error]) => renderError(error as string, key));
    };

    return (
      <div
        className="messages error"
        role="alert"
        aria-live="assertive"
        ref={ref}
        tabIndex={-1}
        data-testid="error-messages">
        {renderErrors()}
      </div>
    );
  }
);

ErrorMessages.displayName = "ErrorMessages";

export default ErrorMessages;
