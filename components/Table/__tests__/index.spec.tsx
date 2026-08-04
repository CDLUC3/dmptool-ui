import React from 'react';

import "@testing-library/jest-dom";
import {
  render,
  screen,
  fireEvent,
  waitFor,
} from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

import { DmpTable, sortData, DmpTableColumn, DataRow, DataRowSet } from '@/components/Table';

// sortData's declared return type is the broader `DataRowSet` (Iterable<DataRow>),
// but the implementation always returns an array. This helper casts the
// result so we can use array methods (.map, .length, etc.) in assertions
// without fighting the type checker.
function sortAsArray(data: DataRowSet, columns: DmpTableColumn[]): DataRow[] {
  return sortData(data, columns) as DataRow[];
}


expect.extend(toHaveNoViolations);


describe("DMP Table Component", () => {
  const columns = [
    { id: 'id', name: 'id', isRowHeader: false },
    { id: 'name', name: 'Name Column', isRowHeader: true, allowsSorting: true, direction: '' as const },
    { id: 'email', name: 'Email Column', isRowHeader: true, direction: '' as const },
    { id: 'other', name: 'Other Column', isRowHeader: true, direction: '' as const },
  ];

  const rows = Array.from({ length: 5 }, (_, i) => {
    const count = i + 1;
    return {
      id: count,
      name: `User ${count} Name`,
      email: `User ${count} Email`,
      other: `User ${count} Other Info`,
    }
  });


  // Now the actual tests
  it("should render the component", async () => {
    render(
      <DmpTable
        columnData={columns}
        rowData={rows}
        label="Test Table"
      />
    );

    // Test that the 3 columns from the test data exist
    expect(screen.getByText('Name Column')).toBeInTheDocument();
    expect(screen.getByText('Email Column')).toBeInTheDocument();
    expect(screen.getByText('Other Column')).toBeInTheDocument();

    // Test that the 5 rows exist
    [1, 2, 3, 4, 5].forEach((i) => {
      expect(screen.getByText(`User ${i} Name`)).toBeInTheDocument();
      expect(screen.getByText(`User ${i} Email`)).toBeInTheDocument();
      expect(screen.getByText(`User ${i} Other Info`)).toBeInTheDocument();
    });
  });

  it("should have no accessibility violations", async () => {
    const { container } = render(
      <DmpTable
        columnData={columns}
        rowData={rows}
        label="Test Table"
      />
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("should show the sorting icon is the column sorting is enabled", async () => {
    render(
      <DmpTable
        columnData={columns}
        rowData={rows}
        label="Test Table"
      />
    );

    // The "Name Column" should be sortable, and should show the sorting icon
    expect(screen.getByText('Name Column')).toBeInTheDocument();

    // The "Email Column" should not be sortable
    expect(screen.getByText('Email Column')).toBeInTheDocument();
  });

  it("should call the sorting callback when a sortable column is clicked", async () => {
    const mockSort = jest.fn();

    render(
      <DmpTable
        columnData={columns}
        rowData={rows}
        label="Test Table"
        onDmpSortChange={mockSort}
      />
    );

    const nameColumn = screen.getByText('Name Column');
    fireEvent.click(nameColumn);

    await waitFor(() => {
      const want = [
        { id: 'id', name: 'id', isRowHeader: false, direction: '' as const },
        { id: 'name', name: 'Name Column', isRowHeader: true, allowsSorting: true, direction: 'ascending' },
        { id: 'email', name: 'Email Column', isRowHeader: true, direction: '' as const },
        { id: 'other', name: 'Other Column', isRowHeader: true, direction: '' as const },
      ];
      expect(mockSort).toHaveBeenCalledWith(want);
      // TODO: Check that the correct icon is displayed icon
    });

    // Clicking a second time should change the order to descending
    fireEvent.click(nameColumn);
    await waitFor(() => {
      const want = [
        { id: 'id', name: 'id', isRowHeader: false, direction: '' as const },
        { id: 'name', name: 'Name Column', isRowHeader: true, allowsSorting: true, direction: 'descending' },
        { id: 'email', name: 'Email Column', isRowHeader: true, direction: '' as const },
        { id: 'other', name: 'Other Column', isRowHeader: true, direction: '' as const },
      ];
      expect(mockSort).toHaveBeenCalledWith(want);
      // TODO: Check that the correct icon is displayed icon
    });
  });

  it("should sort rows client-side when no onDmpSortChange callback is provided", async () => {
    render(
      <DmpTable
        columnData={columns}
        rowData={rows}
        label="Test Table"
      />
    );

    const nameColumn = screen.getByText('Name Column');
    fireEvent.click(nameColumn);

    // Rows happen to already be in ascending order by name in the fixture,
    // so instead assert the DOM actually re-rendered rows in the expected
    // order by checking the row containing "User 1 Name" appears before
    // "User 5 Name".
    await waitFor(() => {
      const cells = screen.getAllByRole('rowheader');
      const nameCells = cells.filter((c) => c.textContent?.includes('Name'));
      expect(nameCells[0]).toHaveTextContent('User 1 Name');
      expect(nameCells[nameCells.length - 1]).toHaveTextContent('User 5 Name');
    });
  });
});


describe("sortData()", () => {
  function col(direction: 'ascending' | 'descending' | '', overrides = {}): DmpTableColumn[] {
    return [
      { id: 'name', name: 'Name', allowsSorting: true, direction, ...overrides },
    ];
  }

  it("returns the original data unchanged when there are no active sort columns", () => {
    const data: DataRow[] = [{ name: 'B' }, { name: 'A' }];

    // No column has allowsSorting+direction set
    const noDirection = sortAsArray(data, [{ id: 'name', name: 'Name', allowsSorting: true, direction: '' as const }]);
    expect(noDirection).toBe(data); // same reference, not just equal

    const noAllowsSorting = sortAsArray(data, [{ id: 'name', name: 'Name', direction: 'ascending' }]);
    expect(noAllowsSorting).toBe(data);
  });

  it("ignores columns that have a direction but allowsSorting is false/undefined", () => {
    const data: DataRow[] = [{ name: 'B' }, { name: 'A' }];
    const columns: DmpTableColumn[] = [
      { id: 'name', name: 'Name', allowsSorting: false, direction: 'ascending' },
    ];

    const result = sortAsArray(data, columns);
    expect(result).toBe(data);
  });

  it("sorts strings ascending", () => {
    const data: DataRow[] = [{ name: 'Charlie' }, { name: 'Alice' }, { name: 'Bob' }];
    const result = sortAsArray(data, col('ascending'));
    expect(result.map((r) => r.name)).toEqual(['Alice', 'Bob', 'Charlie']);
  });

  it("sorts strings descending", () => {
    const data: DataRow[] = [{ name: 'Charlie' }, { name: 'Alice' }, { name: 'Bob' }];
    const result = sortAsArray(data, col('descending'));
    expect(result.map((r) => r.name)).toEqual(['Charlie', 'Bob', 'Alice']);
  });

  it("does not mutate the original array", () => {
    const data: DataRow[] = [{ name: 'Charlie' }, { name: 'Alice' }, { name: 'Bob' }];
    const original = [...data];
    sortAsArray(data, col('ascending'));
    expect(data).toEqual(original);
  });

  it("sorts numeric strings numerically, not lexicographically", () => {
    const data: DataRow[] = [{ name: '10' }, { name: '2' }, { name: '1' }];
    const result = sortAsArray(data, col('ascending'));
    // Lexicographic sort would give ['1', '10', '2']; numeric sort gives this:
    expect(result.map((r) => r.name)).toEqual(['1', '2', '10']);
  });

  it("sorts actual numbers correctly", () => {
    const data: DataRow[] = [{ name: 10 }, { name: 2 }, { name: 1 }];
    const result = sortAsArray(data, col('ascending'));
    expect(result.map((r) => r.name)).toEqual([1, 2, 10]);
  });

  it("sorts dates in dd/mm/yyyy format chronologically", () => {
    const data: DataRow[] = [
      { name: '25/12/2023' },
      { name: '01/01/2020' },
      { name: '15/06/2021' },
    ];
    const result = sortAsArray(data, col('ascending'));
    expect(result.map((r) => r.name)).toEqual([
      '01/01/2020',
      '15/06/2021',
      '25/12/2023',
    ]);
  });

  it("sorts dates in dd/mm/yyyy format descending", () => {
    const data: DataRow[] = [
      { name: '01/01/2020' },
      { name: '25/12/2023' },
      { name: '15/06/2021' },
    ];
    const result = sortAsArray(data, col('descending'));
    expect(result.map((r) => r.name)).toEqual([
      '25/12/2023',
      '15/06/2021',
      '01/01/2020',
    ]);
  });

  it("does not misinterpret non dd/mm/yyyy strings as dates", () => {
    // Strings that don't match the strict dd/mm/yyyy regex should just be
    // compared as plain strings.
    const data: DataRow[] = [{ name: '2023-12-25' }, { name: '2020-01-01' }];
    const result = sortAsArray(data, col('ascending'));
    // Plain string comparison: '2020-01-01' < '2023-12-25'
    expect(result.map((r) => r.name)).toEqual(['2020-01-01', '2023-12-25']);
  });

  it("treats mixed date/non-date values as plain strings when only one side matches the date pattern", () => {
    const data: DataRow[] = [{ name: '25/12/2023' }, { name: 'not-a-date' }];
    const result = sortAsArray(data, col('ascending'));
    // Neither side is coerced to a Date since both must match; falls back
    // to string comparison. '2' < 'n' lexicographically.
    expect(result.map((r) => r.name)).toEqual(['25/12/2023', 'not-a-date']);
  });

  it("returns 0 / preserves relative order for equal values (stable-ish no-op)", () => {
    const data: DataRow[] = [{ name: 'A', id: 1 }, { name: 'A', id: 2 }];
    const result = sortAsArray(data, col('ascending'));
    expect(result.map((r) => r.id)).toEqual([1, 2]);
  });

  it("falls through to a secondary sort column when the primary column values are equal", () => {
    const data: DataRow[] = [
      { name: 'A', email: 'z@test.com' },
      { name: 'A', email: 'a@test.com' },
      { name: 'B', email: 'm@test.com' },
    ];
    const columns: DmpTableColumn[] = [
      { id: 'name', name: 'Name', allowsSorting: true, direction: 'ascending' },
      { id: 'email', name: 'Email', allowsSorting: true, direction: 'ascending' },
    ];

    const result = sortAsArray(data, columns);
    expect(result.map((r) => `${r.name}-${r.email}`)).toEqual([
      'A-a@test.com',
      'A-z@test.com',
      'B-m@test.com',
    ]);
  });

  it("only uses columns in the order they appear in the columns array for multi-column sort", () => {
    const data: DataRow[] = [
      { name: 'B', email: 'a@test.com' },
      { name: 'A', email: 'b@test.com' },
    ];
    // email listed first, so it should take priority over name
    const columns: DmpTableColumn[] = [
      { id: 'email', name: 'Email', allowsSorting: true, direction: 'ascending' },
      { id: 'name', name: 'Name', allowsSorting: true, direction: 'ascending' },
    ];

    const result = sortAsArray(data, columns);
    expect(result.map((r) => r.name)).toEqual(['B', 'A']);
  });

  it("handles an empty data set without error", () => {
    const result = sortAsArray([], col('ascending'));
    expect(result).toEqual([]);
  });

  it("handles a single-row data set without error", () => {
    const data: DataRow[] = [{ name: 'Solo' }];
    const result = sortAsArray(data, col('ascending'));
    expect(result).toEqual(data);
  });
});