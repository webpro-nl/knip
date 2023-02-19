import chalk from 'chalk';
import { ISSUE_TYPE_TITLE } from '../constants.js';
import { isAbsolute, relativePosix } from '../util/path.js';

export const getTitle = (reportType: keyof typeof ISSUE_TYPE_TITLE) => {
  return ISSUE_TYPE_TITLE[reportType];
};

export const logTitle = (title: string, count: number) =>
  console.log(`${chalk.bold.yellow.underline(title)} (${count})`);

type LogIssueLine = {
  owner?: string;
  filePath: string;
  symbols?: string[];
  parentSymbol?: string;
};

export const logIssueLine = ({ owner, filePath, symbols, parentSymbol }: LogIssueLine) => {
  const symbol = symbols ? `: ${symbols.join(', ')}` : '';
  const parent = parentSymbol ? ` (${parentSymbol})` : '';
  console.log(`${owner ? `${chalk.cyan(owner)} ` : ''}${relativePosix(filePath)}${symbol}${parent}`);
};

export const logIssueSet = (issues: string[]) => {
  issues.sort().forEach(value => console.log(isAbsolute(value) ? relativePosix(value) : value));
};
