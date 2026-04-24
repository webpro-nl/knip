import { stripVTControlCharacters } from 'node:util';
import { pad, truncate, truncateStart } from './string.ts';

type Value = string | number | undefined | false | null;
type Align = 'left' | 'center' | 'right';
type TruncateMode = 'start' | 'end' | 'none';
type SortOrder = 'asc' | 'desc';
type Cell = { value: Value; formatted?: string; width: number; fill?: string; align?: Align };
type Row = Record<string, Cell>;

const MIN_TRUNCATED_WIDTH = 4;
const COLUMN_SEPARATOR = '  ';

const visibleLength = (text: string) => stripVTControlCharacters(text).length;

const isPrintable = (value: Value) => typeof value === 'string' || typeof value === 'number';

const toDisplay = (value: Value) => (isPrintable(value) ? String(value) : '');

export class Table {
  private columns: string[] = [];
  private rows: Row[] = [];
  private header: boolean;
  private maxWidth: number;
  private truncateModes: Record<string, TruncateMode>;

  constructor(options?: { maxWidth?: number; header?: boolean; truncate?: Record<string, TruncateMode> }) {
    this.header = options?.header ?? false;
    this.maxWidth = options?.maxWidth || process.stdout.columns || 120;
    this.truncateModes = options?.truncate ?? {};
  }

  row() {
    this.rows.push({});
    return this;
  }

  cell(column: string, value: Value, formatter?: (value: Value) => string) {
    if (!this.columns.includes(column)) this.columns.push(column);
    const row = this.rows[this.rows.length - 1];
    const align: Align = typeof value === 'number' ? 'right' : 'left';
    const formatted = formatter?.(value);
    const display = formatted ?? toDisplay(value);
    row[column] = { value, formatted, align, width: visibleLength(display) };
    return this;
  }

  sort(column: string, order: SortOrder = 'asc') {
    const dir = order === 'desc' ? -1 : 1;
    this.rows.sort((a, b) => {
      const vA = a[column]?.value;
      const vB = b[column]?.value;
      if (typeof vA === 'string' && typeof vB === 'string') return dir * vA.localeCompare(vB);
      if (typeof vA === 'number' && typeof vB === 'number') return dir * (vA - vB);
      return !isPrintable(vA) ? 1 : !isPrintable(vB) ? -1 : 0;
    });
    return this;
  }

  private modeFor(column: string): TruncateMode {
    return this.truncateModes[column] ?? 'end';
  }

  private distributeWidths(columns: string[], widths: Record<string, number>, separatorWidth: number) {
    const truncatable = columns.filter(col => this.modeFor(col) !== 'none');
    if (truncatable.length === 0) return;

    const reserved = columns.filter(col => this.modeFor(col) === 'none').reduce((sum, col) => sum + widths[col], 0);

    const budget = Math.max(0, this.maxWidth - separatorWidth - reserved);
    const original: Record<string, number> = {};
    for (const col of truncatable) original[col] = widths[col];

    const unresolved = new Set(truncatable);
    let remainingBudget = budget;
    let changed = true;
    while (changed && unresolved.size > 0) {
      changed = false;
      const share = Math.floor(remainingBudget / unresolved.size);
      for (const col of unresolved) {
        if (original[col] <= share) {
          widths[col] = original[col];
          remainingBudget -= original[col];
          unresolved.delete(col);
          changed = true;
        }
      }
    }

    if (unresolved.size === 0) return;

    const overMin = [...unresolved].reduce((sum, col) => sum + (original[col] - MIN_TRUNCATED_WIDTH), 0);
    const excess = Math.max(0, remainingBudget - unresolved.size * MIN_TRUNCATED_WIDTH);
    let distributed = 0;
    for (const col of unresolved) {
      const share = overMin > 0 ? Math.floor(((original[col] - MIN_TRUNCATED_WIDTH) * excess) / overMin) : 0;
      widths[col] = MIN_TRUNCATED_WIDTH + share;
      distributed += share;
    }
    const leftover = excess - distributed;
    if (leftover > 0) widths[[...unresolved][0]] += leftover;
  }

  toCells() {
    const columns = this.columns.filter(col => this.rows.some(row => isPrintable(row[col]?.value)));

    const rows: Row[] = [];
    if (this.header && this.rows.length > 0) {
      const headerRow: Row = {};
      const linesRow: Row = {};
      for (const col of columns) {
        const align: Align = this.rows[0][col]?.align === 'right' ? 'center' : 'left';
        headerRow[col] = { value: col, align, width: col.length };
        linesRow[col] = { value: '', fill: '-', width: 0 };
      }
      rows.push(headerRow, linesRow);
    }
    rows.push(...this.rows);

    const columnWidths: Record<string, number> = {};
    for (const col of columns) {
      let max = 0;
      for (const row of rows) {
        const w = row[col]?.width ?? 0;
        if (w > max) max = w;
      }
      columnWidths[col] = max;
    }

    const separatorWidth = columns.length > 1 ? (columns.length - 1) * COLUMN_SEPARATOR.length : 0;
    const totalWidth = columns.reduce((sum, col) => sum + columnWidths[col], 0) + separatorWidth;

    if (totalWidth > this.maxWidth) {
      this.distributeWidths(columns, columnWidths, separatorWidth);
    }

    return rows.map(row =>
      columns.map((col, index) => {
        const cell = row[col];
        const width = columnWidths[col];
        const fill = cell?.fill || ' ';
        const display = cell?.formatted ?? toDisplay(cell?.value);
        const padded = pad(display, width, fill, cell?.align);
        const mode = this.modeFor(col);
        const rendered =
          mode === 'none' ? padded : mode === 'start' ? truncateStart(padded, width) : truncate(padded, width);
        return index === 0 ? rendered : COLUMN_SEPARATOR + rendered;
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
