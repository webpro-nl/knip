import path from 'node:path';
import type { Issue } from './types';

export const getLine = (value: number | string, text: string) => `${String(value).padStart(5)} ${text}`;

const logIssueLine = (cwd: string, filePath: string, description: string, pad: number) => {
  console.log(`${description ? description.padEnd(pad + 2) : ''}${path.relative(cwd, filePath)}`);
};

export const logIssueGroupResult = (cwd: string, title: string, issues: Issue[]) => {
  console.log(`--- ${title} (${issues.length})`);
  if (issues.length) {
    const sortedByFilePath = issues.sort((a, b) => (a.filePath > b.filePath ? 1 : -1));
    const padLength = [...issues].sort((a, b) => b.symbol.length - a.symbol.length);
    sortedByFilePath.forEach(({ filePath, symbol }) => logIssueLine(cwd, filePath, symbol, padLength[0].symbol.length));
  } else {
    console.log('N/A');
  }
};

export class LineRewriter {
  private lines: number = 0;

  private clearLines(count: number) {
    if (count > 0) {
      for (let i = 0; i < count; i++) {
        process.stdout.moveCursor(0, -1);
        process.stdout.clearLine(1);
      }
    }
    process.stdout.cursorTo(0);
  }

  public resetLines() {
    this.clearLines(this.lines);
  }

  public update(messages: string[]) {
    this.resetLines();
    process.stdout.write(messages.join('\n') + '\n');
    this.lines = messages.length;
  }
}
