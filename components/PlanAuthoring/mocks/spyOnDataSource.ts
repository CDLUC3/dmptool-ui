import type { MockPlanAuthoringDataSource } from "./createMockDataSource";

export type SpiedMockDataSource = jest.Mocked<MockPlanAuthoringDataSource>;

/**
 * Test-only (needs the jest global), so index.ts doesn't re-export it.
 * Every method keeps its in-memory behaviour until a spec overrides it.
 */
export function spyOnDataSource(
  dataSource: MockPlanAuthoringDataSource
): SpiedMockDataSource {
  (Object.keys(dataSource) as (keyof MockPlanAuthoringDataSource)[]).forEach(
    (method) => {
      jest.spyOn(dataSource, method);
    }
  );
  return dataSource as SpiedMockDataSource;
}
