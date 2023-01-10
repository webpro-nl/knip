import parsedArgs from './cli-arguments.js';

const {
  values: { 'no-progress': isNoProgress = false, debug: isDebug = false },
} = parsedArgs;

export const getLine = (value: number | string, text: string) => `${String(value).padStart(5)} ${text}`;

export class LineRewriter {
  private lines = 0;

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

export const logIfDebug = (error: unknown) => {
  // Console logs destroy fancy progress output, will be reported when --no-progress or --debug
  if (isDebug) {
    console.error(error);
  } else if (isNoProgress && error instanceof Error) {
    console.error(error.toString());
  }
};
