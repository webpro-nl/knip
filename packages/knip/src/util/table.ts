import { stripVTControlCharacters } from 'node:util';
import { pad, truncate, truncateStart } from './string.js';

type Value = string | number | undefined | false | null;
type Align = 'left' | 'center' | 'right';
type Row = Record<string, Cell>;
type Cell = { value: Value; formatted?: string; fill?: string; align?: Align };

const DEFAULT_MAX_WIDTH = process.stdout.columns || 120;
const MIN_TRUNCATED_WIDTH = 4;
const COLUMN_SEPARATOR = '  ';

export class Table {
  private columns: string[] = [];
  private rows: Row[] = [];
  private header: boolean;
  private maxWidth: number;
  private truncateStart: string[] = [];
  private noTruncate: string[] = [];

  constructor(options?: {
    maxWidth?: number;
    header?: boolean;
    truncateStart?: string[];
    noTruncate?: string[];
  }) {
    this.header = options?.header ?? false;
    this.maxWidth = options?.maxWidth || DEFAULT_MAX_WIDTH;
    this.truncateStart = options?.truncateStart || [];
    this.noTruncate = options?.noTruncate || [];
  }

  row() {
    this.rows.push({});
    return this;
  }

  cell(column: string, value: Value, formatter?: (value: Value) => string) {
    if (!this.columns.includes(column)) this.columns.push(column);
    const row = this.rows[this.rows.length - 1];
    const align = typeof value === 'number' ? 'right' : 'left';
    const formatted = formatter ? formatter(value) : undefined;
    row[column] = { value, formatted, align };
    return this;
  }

  sort(column: string) {
    this.rows.sort((a, b) => {
      const [columnName, order] = column.split('|');
      const vA = a[columnName].value;
      const vB = b[columnName].value;
      if (typeof vA === 'string' && typeof vB === 'string') return (order === 'desc' ? -1 : 1) * vA.localeCompare(vB);
      if (typeof vA === 'number' && typeof vB === 'number') return order === 'desc' ? vB - vA : vA - vB;
      return !vA ? 1 : !vB ? -1 : 0;
    });
    return this;
  }

  toCells() {
    const columns = this.columns.filter(col =>
      this.rows.some(row => typeof row[col].value === 'string' || typeof row[col].value === 'number')
    );

    if (this.header) {
      const headerRow: Row = {};
      const linesRow: Row = {};
      for (const col of columns) {
        headerRow[col] = { value: col, align: this.rows[0][col].align === 'right' ? 'center' : 'left' };
        linesRow[col] = { value: '', fill: '-' };
      }
      this.rows.unshift(linesRow);
      this.rows.unshift(headerRow);
    }

    const columnWidths = columns.reduce(
      (acc, col) => {
        acc[col] = Math.max(
          ...this.rows.map(row =>
            row[col]?.formatted
              ? stripVTControlCharacters(row[col].formatted).length
              : String(row[col]?.value || '').length
          )
        );
        return acc;
      },
      {} as Record<string, number>
    );

    const separatorWidth = (columns.length - 1) * COLUMN_SEPARATOR.length;
    const totalWidth = Object.values(columnWidths).reduce((sum, width) => sum + width, 0) + separatorWidth;

    if (totalWidth > this.maxWidth) {
      const reservedWidth = columns
        .filter(col => this.noTruncate.includes(col))
        .reduce((sum, col) => sum + columnWidths[col], 0);

      const truncatableColumns = columns.filter(col => !this.noTruncate.includes(col));
      const minWidth = truncatableColumns.length * 4;
      const availableWidth = this.maxWidth - separatorWidth - reservedWidth - minWidth;
      const truncatableWidth = truncatableColumns.reduce((sum, col) => sum + columnWidths[col], 0) - minWidth;

      const reduction = availableWidth / truncatableWidth;
      let roundingDiff = availableWidth;

      for (const col of truncatableColumns) {
        const reducedWidth = MIN_TRUNCATED_WIDTH + Math.floor((columnWidths[col] - MIN_TRUNCATED_WIDTH) * reduction);
        columnWidths[col] = reducedWidth;
        roundingDiff -= reducedWidth - MIN_TRUNCATED_WIDTH;
      }

      if (roundingDiff > 0) {
        columnWidths[truncatableColumns.length > 0 ? truncatableColumns[0] : columns[0]] += roundingDiff;
      }
    }

    return this.rows.map(row =>
      columns.map((col, index) => {
        const cell = row[col];
        const width = columnWidths[col];
        const fill = cell.fill || ' ';
        const padded = pad(String(cell.formatted || cell.value || ''), width, fill, cell.align);
        const truncated = this.truncateStart.includes(col) ? truncateStart(padded, width) : truncate(padded, width);
        return index === 0 ? truncated : COLUMN_SEPARATOR + truncated;
      })
    );
  }

  toRows() {
    return this.toCells().map(row => row.join(''));
  }

  toString() {
    return this.toRows().join('\n');
  }
}
