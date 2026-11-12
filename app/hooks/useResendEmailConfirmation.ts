import { useCallback, useState } from "react";
import { UserEmailErrors } from "@/generated/graphql";

export interface ResendUserEmailConfirmationData {
  resendUserEmailConfirmation: {
    __typename?: "UserEmail";
    id?: number | null;
    email: string;
    isPrimary: boolean;
    isConfirmed: boolean;
    errors?: UserEmailErrors | null;
  } | null;
}

export interface ResendUserEmailConfirmationOptions {
  variables: { email: string };
}

export const FAKE_RESEND_DELAY_MS = 600;

// Stand-in until dmptool-apollo-server adds the resendUserEmailConfirmation mutation
// (https://github.com/CDLUC3/dmptool-doc/issues/488). It returns the same tuple and response shape
// as useMutation, so it can be replaced with useMutation(ResendUserEmailConfirmationDocument).
export function useResendEmailConfirmation() {
  const [loading, setLoading] = useState(false);

  const resendEmailConfirmation = useCallback(
    async ({ variables }: ResendUserEmailConfirmationOptions): Promise<{ data: ResendUserEmailConfirmationData }> => {
      setLoading(true);
      try {
        await new Promise((resolve) => setTimeout(resolve, FAKE_RESEND_DELAY_MS));
        return {
          data: {
            resendUserEmailConfirmation: {
              __typename: "UserEmail",
              id: null,
              email: variables.email,
              isPrimary: false,
              isConfirmed: false,
              errors: null,
            },
          },
        };
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return [resendEmailConfirmation, { loading }] as const;
}
