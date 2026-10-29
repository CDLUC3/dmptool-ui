import type React from "react";
import { useRef, useState } from "react";
import type { RenderQuestionFieldProps } from "@/components/hooks/useRenderQuestionField";
import { getAnswerValue, withAnswer } from "./answerUtils";

// What TypeAheadWithOther's "Other" option passes to updateFormData.
const OTHER_AFFILIATION_ID = "other";
const OTHER_AFFILIATION_LABEL = "Other";

interface AffiliationSearchState {
  affiliationData: { affiliationId: string; affiliationName: string };
  otherField: boolean;
  otherAffiliationName: string;
}

function initialState(draftAnswer: unknown): AffiliationSearchState {
  const value = getAnswerValue(draftAnswer);
  const record =
    value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  const affiliationId = typeof record.affiliationId === "string" ? record.affiliationId : "";
  const affiliationName =
    typeof record.affiliationName === "string" ? record.affiliationName : "";
  if (affiliationId === OTHER_AFFILIATION_ID) {
    return {
      affiliationData: { affiliationId, affiliationName: OTHER_AFFILIATION_LABEL },
      otherField: true,
      otherAffiliationName: affiliationName,
    };
  }
  return {
    affiliationData: { affiliationId, affiliationName },
    otherField: false,
    otherAffiliationName: "",
  };
}

export function useAffiliationSearchAnswer({
  questionType,
  draftAnswer,
  onChange,
}: {
  questionType: string;
  draftAnswer: unknown;
  onChange: (answerJson: unknown) => void;
}): NonNullable<RenderQuestionFieldProps["typeaheadSearchProps"]> {
  const [state, setState] = useState(() => initialState(draftAnswer));
  // The typeahead calls setOtherField and updateFormData in the same event.
  const stateRef = useRef(state);

  const update = (patch: Partial<AffiliationSearchState>) => {
    const next = { ...stateRef.current, ...patch };
    stateRef.current = next;
    setState(next);
    onChange(
      withAnswer(draftAnswer, questionType, {
        affiliationId: next.affiliationData.affiliationId,
        affiliationName: next.otherField
          ? next.otherAffiliationName
          : next.affiliationData.affiliationName,
      })
    );
  };

  return {
    affiliationData: state.affiliationData,
    otherField: state.otherField,
    otherAffiliationName: state.otherAffiliationName,
    setOtherField: (otherField: boolean) => {
      if (otherField !== stateRef.current.otherField) {
        update({ otherField });
      }
    },
    handleAffiliationChange: async (affiliationId: string, affiliationName: string) =>
      update({ affiliationData: { affiliationId, affiliationName } }),
    handleOtherAffiliationChange: (event: React.ChangeEvent<HTMLInputElement>) =>
      update({ otherAffiliationName: event.target.value }),
  };
}
