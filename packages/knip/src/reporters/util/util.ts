import picocolors from 'picocolors';
import { ISSUE_TYPE_TITLE } from '../../constants.js';
import { type Issue, type IssueSeverity, type IssueSymbol, SymbolType } from '../../types/issues.js';
import { relative } from '../../util/path.js';
import { Table } from '../../util/table.js';

const plain = (text: string) => text;
export const dim = picocolors.gray;
export const bright = picocolors.whiteBright;
const yellow = picocolors.yellow;

export const getIssueTypeTitle = (reportType: keyof typeof ISSUE_TYPE_TITLE) => ISSUE_TYPE_TITLE[reportType];

export const getColoredTitle = (title: string, count: number) =>
  `${picocolors.yellowBright(picocolors.underline(title))} (${count})`;

export const getDimmedTitle = (title: string, count: number) =>
  `${yellow(`${picocolors.underline(title)} (${count})`)}`;

type LogIssueLine = {
  owner?: string;
  filePath: string;
  symbols?: IssueSymbol[];
  parentSymbol?: string;
  severity?: IssueSeverity;
};

export const getIssueLine = ({ owner, filePath, symbols, parentSymbol, severity }: LogIssueLine) => {
  const symbol = symbols ? `: ${symbols.map(s => s.symbol).join(', ')}` : '';
  const parent = parentSymbol ? ` (${parentSymbol})` : '';
  const print = severity === 'warn' ? dim : plain;
  return `${owner ? `${picocolors.cyan(owner)} ` : ''}${print(`${relative(filePath)}${symbol}${parent}`)}`;
};

export const convert = (issue: Issue | IssueSymbol) => ({
  name: issue.symbol,
  line: issue.line,
  col: issue.col,
  pos: issue.pos,
});

const sortByPos = (a: Issue, b: Issue) => {
  const [filePathA, rowA, colA] = a.filePath.split(':');
  const [filePathB, rowB, colB] = b.filePath.split(':');
  return filePathA === filePathB
    ? Number(rowA) === Number(rowB)
      ? Number(colA) - Number(colB)
      : Number(rowA) - Number(rowB)
    : filePathA.localeCompare(filePathB);
};

const highlightSymbol =
  (issue: Issue) =>
  (_: unknown): string => {
    if (issue.specifier && issue.specifier !== issue.symbol && issue.specifier.includes(issue.symbol)) {
      const parts = issue.specifier.split(issue.symbol);
      const rest = parts.slice(1).join('');
      return [dim(parts[0]), bright(issue.symbol), dim(rest)].join('');
    }
    return issue.symbol;
  };

export const getTableForType = (issues: Issue[], options: { isUseColors?: boolean } = { isUseColors: true }) => {
  const table = new Table({ truncateStart: ['filePath'], noTruncate: ['symbolType'] });

  for (const issue of issues.sort(sortByPos)) {
    table.row();

    const print = options.isUseColors && (issue.isFixed || issue.severity === 'warn') ? dim : plain;

    const symbol = issue.symbols ? issue.symbols.map(s => s.symbol).join(', ') : issue.symbol;
    table.cell('symbol', print(symbol), options.isUseColors ? highlightSymbol(issue) : () => symbol);

    table.cell('parentSymbol', issue.parentSymbol && print(issue.parentSymbol));
    table.cell('symbolType', issue.symbolType && issue.symbolType !== SymbolType.UNKNOWN && print(issue.symbolType));

    const pos = issue.line === undefined ? '' : `:${issue.line}${issue.col === undefined ? '' : `:${issue.col}`}`;
    // @ts-expect-error TODO Fix up in next major
    const cell = issue.type === 'files' ? '' : `${relative(issue.filePath)}${pos}`;
    table.cell('filePath', print(cell));

    table.cell('fixed', issue.isFixed && print('(removed)'));
  }

  return table;
};
