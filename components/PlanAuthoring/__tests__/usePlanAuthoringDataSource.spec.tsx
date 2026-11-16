import { renderHook } from "@testing-library/react";
import { useApolloClient } from "@apollo/client/react";
import { useLocale } from "next-intl";
import { createPlanAuthoringDataSource } from "../planAuthoringDataSource";
import { usePlanAuthoringDataSource } from "../usePlanAuthoringDataSource";

jest.mock("@apollo/client/react", () => ({
  useApolloClient: jest.fn(),
}));

jest.mock("next-intl", () => ({
  useLocale: jest.fn(),
}));

jest.mock("../planAuthoringDataSource", () => ({
  createPlanAuthoringDataSource: jest.fn((options) => ({ ...options })),
}));

const mockCreate = createPlanAuthoringDataSource as jest.Mock;
const client = { name: "apollo client" };

describe("usePlanAuthoringDataSource", () => {
  beforeEach(() => {
    (useApolloClient as jest.Mock).mockReturnValue(client);
    (useLocale as jest.Mock).mockReturnValue("pt-BR");
  });

  it("creates a data source for the plan with the Apollo client and locale", () => {
    const { result } = renderHook(() => usePlanAuthoringDataSource(26));

    expect(mockCreate).toHaveBeenCalledWith({ client, planId: 26, locale: "pt-BR" });
    expect(result.current).toEqual({ client, planId: 26, locale: "pt-BR" });
  });

  it("keeps the same data source across renders and replaces it for another plan", () => {
    const { result, rerender } = renderHook(
      ({ planId }) => usePlanAuthoringDataSource(planId),
      { initialProps: { planId: 26 } }
    );
    const first = result.current;

    rerender({ planId: 26 });
    expect(result.current).toBe(first);

    rerender({ planId: 27 });
    expect(result.current).not.toBe(first);
    expect(result.current).toEqual({ client, planId: 27, locale: "pt-BR" });
  });
});
