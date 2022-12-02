import chalk from 'chalk';
import { relative } from '../util/path.js';

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
  console.log(`${owner ? `${chalk.cyan(owner)} ` : ''}${relative(filePath)}${symbol}${parent}`);
};

export const logIssueSet = (issues: string[]) => {
  issues.sort().forEach(value => console.log(value.startsWith('/') ? relative(value) : value));
};
