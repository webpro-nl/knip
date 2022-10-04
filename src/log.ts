import path from 'node:path';
import type { SourceFile } from 'ts-morph';
import type { Issues } from './types';

export const getLine = (value: number | string, text: string) => `${String(value).padStart(5)} ${text}`;

const logIssueLine = (cwd: string, sourceFile: SourceFile, description: string, pad: number) => {
  const filePath = path.relative(cwd, sourceFile.getFilePath());
  console.log(`${description ? description.padEnd(pad + 2) : ''}${filePath}`);
};

export const logIssueGroupResult = (cwd: string, title: string, unusedItems: Issues) => {
  console.log(`--- ${title} (${unusedItems.length})`);
  if (unusedItems.length) {
    const padLength = Array.from(unusedItems).sort((a, b) => b.name.length - a.name.length)[0]?.name.length ?? 0;
    const sortedItems = unusedItems.sort((a, b) => (b.sourceFile.getFilePath() < a.sourceFile.getFilePath() ? 1 : -1));
    sortedItems.forEach(({ sourceFile, name }) => logIssueLine(cwd, sourceFile, name, padLength));
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
