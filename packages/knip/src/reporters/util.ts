import chalk from 'chalk';
import { ISSUE_TYPE_TITLE } from '../constants.js';
import { toRelative, relative } from '../util/path.js';
import type { Issue, IssueSeverity, IssueSymbol } from '../types/issues.js';

export const identity = (text: string) => text;

export const getTitle = (reportType: keyof typeof ISSUE_TYPE_TITLE) => {
  return ISSUE_TYPE_TITLE[reportType];
};

export const logTitle = (title: string, count: number) =>
  console.log(`${chalk.bold.yellow.underline(title)} (${count})`);

type LogIssueLine = {
  owner?: string;
  filePath: string;
  symbols?: IssueSymbol[];
  parentSymbol?: string;
  severity?: IssueSeverity;
};

export const logIssueLine = ({ owner, filePath, symbols, parentSymbol, severity }: LogIssueLine) => {
  const symbol = symbols ? `: ${symbols.map(s => s.symbol).join(', ')}` : '';
  const parent = parentSymbol ? ` (${parentSymbol})` : '';
  const print = severity === 'warn' ? chalk.grey : identity;
  console.log(`${owner ? `${chalk.cyan(owner)} ` : ''}${print(`${relative(filePath)}${symbol}${parent}`)}`);
};

export const logIssueSet = (issues: string[]) => {
  issues.sort().forEach(value => console.log(toRelative(value)));
};

export const convert = (issue: Issue | IssueSymbol) => ({
  name: issue.symbol,
  line: issue.line,
  col: issue.col,
  pos: issue.pos,
});
