//
// This component makes heavy use of react-aria's Table componen[1]
// There are many examples of how to use it in their documentation. A lot of the
// initial code in this component is based on this.
//
// - [1] https://react-spectrum.adobe.com/react-aria/Table.html
//
import React, { useEffect, useState } from 'react';
import classNames from 'classnames';
//import { useQuery } from '@apollo/client/react';

import {
  Table,
  TableProps,
  TableBody,
  TableHeader,
  Column,
  Row,
  Cell,
  Collection,
} from 'react-aria-components';
import { SortDescriptor } from '@react-types/shared';

//import { DmpIcon } from '@/components/Icons';

import styles from './table.module.scss';


// Custom types for our components.
export type SortDirection = "ascending" | "descending" | "";

export type DmpTableColumn = {
  id: string;
  name: string;
  isRowHeader?: boolean;
  allowsSorting?: boolean;
  direction?: SortDirection;
}

export type DmpTableColumnSet = Iterable<DmpTableColumn>;


/*eslint-disable @typescript-eslint/no-explicit-any */
export type DataRow = Record<string, any>;
export type DataRowSet = Iterable<DataRow>;

export type DmpTableHeaderProps = {
  columns: DmpTableColumnSet,
  className?: string,
  children: (col: DmpTableColumn) => React.ReactNode,
};

export type DmpTableProps = TableProps & {
  // Set the initial column data
  columnData: DmpTableColumnSet;

  // Specify the initial row data
  rowData: DataRowSet;

  // Other metadata
  label: string;
  className?: string;

  // Callbacks
  onDmpSortChange?: (newColumns: DmpTableColumnSet) => void;
}

interface DmpTableRowProps {
  row: DataRow;
  className?: string;
  columns: DmpTableColumnSet;
  children: (col: DmpTableColumn) => React.ReactElement;
}


// Helper functions

// NOTE:: sortData() should not be used that often.
// This function is to do some sorting on a small dataset on the client side.
// it's not optimized for large datasets.
//
// If there is a large dataset, then it's recommended that you sort that dataset
// on serverside, via your DB queries.
//
export function sortData(data: DataRowSet, columns: DmpTableColumnSet): DataRowSet {
  // Collect active sort columns in the order they appear
  const activeSorts = Array.from(columns).filter(col => col.allowsSorting && col.direction);

  if (activeSorts.length === 0) return data;

  /*eslint-disable @typescript-eslint/no-explicit-any */
  return [...data].sort((a, b) => {
    for (const { id, direction } of activeSorts) {
      let valA: any = a[id];
      let valB: any = b[id];

      // --- Number handling ---
      const numA = parseFloat(valA);
      const numB = parseFloat(valB);
      if (!isNaN(numA) && !isNaN(numB)) {
        valA = numA;
        valB = numB;
      }

      // --- Date handling (dd/mm/yyyy) ---
      const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
      if (
        typeof valA === "string" &&
        typeof valB === "string" &&
        dateRegex.test(valA) &&
        dateRegex.test(valB)
      ) {
        const [dA, mA, yA] = valA.split("/").map(Number);
        const [dB, mB, yB] = valB.split("/").map(Number);
        valA = new Date(yA, mA - 1, dA);
        valB = new Date(yB, mB - 1, dB);
      }

      // --- Comparison ---
      if (valA < valB) return direction === "ascending" ? -1 : 1;
      if (valA > valB) return direction === "ascending" ? 1 : -1;
      // equal → continue to next column
    }
    return 0;
  });
}


// Sub-Components that make up the table
function DmpTableHeader({
  columns,
  className,
  children,
}: DmpTableHeaderProps) {
  return (
    <TableHeader className={classNames(styles.dmpTableHeader, className)}>
      <Collection items={columns}>
        {children}
      </Collection>
    </TableHeader>
  );
}

function DmpTableRow({
  columns,
  row,
  children,
  className,
}: DmpTableRowProps) {
  return (
    <Row
      id={row.id}
      className={classNames(styles.dmpTableRow, className)}
    >
      <Collection items={columns} dependencies={[row]}>
        {(col: DmpTableColumn) => children(col)}
      </Collection>
    </Row>
  );
}

// Actual Table Component
export function DmpTable({
  className,
  columnData,
  rowData,
  label,
  onDmpSortChange,
}: DmpTableProps): React.ReactElement {

  const [sorting, setSorting] = useState<SortDescriptor>({
    column: "",
    direction: "ascending",
  });

  // Track the internal state of columns and row data
  const [columns, setColumns] = useState<DmpTableColumnSet>(columnData);
  const [rows, setRows] = useState<DataRowSet>(rowData);

  function handleOnSortChange(descriptor: SortDescriptor) {
    const newColumns: DmpTableColumnSet = Array.from(columns).map((col: DmpTableColumn) => {
      if (col.id === descriptor.column) {
        return { ...col, direction: descriptor.direction };
      }
      return { ...col, direction: '' as const };  // reset all other columns otherwise it will get stuck on one sortField 
    });

    setSorting(descriptor);
    setColumns(newColumns);
  }

  useEffect(() => {
    if (onDmpSortChange) {
      onDmpSortChange(columns);
    } else {
      // Only use our internal sorting function if we never provided
      // an onDmpSortChange() handler
      const sortedRows = sortData(rows, columns);
      setRows(sortedRows);
    }
  }, [columns]);

  useEffect(() => {
    setRows(rowData);
  }, [rowData]);

  return (
    <Table
      aria-label={label}
      className={classNames(styles.dmpTable, className)}
      onSortChange={handleOnSortChange}
      sortDescriptor={sorting}
    >
      <DmpTableHeader className={styles.dmpTableHeader} columns={columns}>
        {(col) => (
          <Column id={col.id} isRowHeader={col.isRowHeader} allowsSorting={col.allowsSorting}>
            {col.name}
            {col.allowsSorting && (
              <>
                {!col.direction && (<span>⇅</span>)}
                {col.direction == "ascending" && (<span>↑</span>)}
                {col.direction == "descending" && (<span>↓</span>)}
              </>
            )}
          </Column>
        )}
      </DmpTableHeader>

      <TableBody items={rows as DataRowSet} dependencies={[columns]}>
        {(row) => {
          return (
            <DmpTableRow row={row} columns={columns}>
              {(col: DmpTableColumn) => <Cell>{row[col.id]}</Cell>}
            </DmpTableRow>
          );
        }}
      </TableBody>
    </Table>
  );
}
