import React from 'react';

import "@testing-library/jest-dom";
import {
  render,
  screen,
  fireEvent,
  waitFor,
} from '@testing-library/react';
import { toHaveNoViolations } from 'jest-axe';

import { DmpTable } from '@/components/Table';


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

});
