import { useCallback, useState } from "react";
import { useCsrf } from "@/context/CsrfContext";
import { postToAuthService, readAuthServiceBody } from "@/utils/emailConfirmation";

export type SendEmailConfirmationResult =
  | { sent: true }
  | { sent: false; reason: "alreadyConfirmed" | "claimedByOther" | "failed" };

/**
 * Ask the Auth service to email a confirmation link for an email address on the signed-in user's account.
 * Used right after an alias is added and when the user asks for the link to be sent again. Sending a new link
 * makes any earlier link stop working.
 *
 * Network errors are thrown so the caller can log them.
 */
export function useSendEmailConfirmation() {
  const { getCsrfToken } = useCsrf();
  const [loading, setLoading] = useState(false);

  const sendEmailConfirmation = useCallback(
    async (email: string): Promise<SendEmailConfirmationResult> => {
      setLoading(true);
      try {
        const response = await postToAuthService("/email-confirmation/token", { email }, getCsrfToken);
        if (response.ok) {
          return { sent: true };
        }
        if (response.status === 409) {
          // Use the Auth service's reason code rather than its message, so rewording the message doesn't break this
          const { reason } = await readAuthServiceBody(response);
          if (reason === "alreadyConfirmed" || reason === "claimedByOther") {
            return { sent: false, reason };
          }
        }
        return { sent: false, reason: "failed" };
      } finally {
        setLoading(false);
      }
    },
    [getCsrfToken]
  );

  return [sendEmailConfirmation, { loading }] as const;
}
