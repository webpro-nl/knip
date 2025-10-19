import type { MainOptions } from './util/create-options.js';

/**
 * - Casts messages as a stream to stdout during the process
 */
export class ConsoleStreamer {
  isEnabled = false;
  isWatch = false;
  private lines = 0;

  constructor(options: MainOptions) {
    this.isEnabled = options.isShowProgress && !options.isDebug;
    this.isWatch = options.isWatch;
  }

  private clearLines(count: number) {
    if (count > 0) {
      for (let i = 0; i < count; i++) {
        process.stdout.moveCursor(0, -1);
        process.stdout.clearLine(1);
      }
    }
    process.stdout.cursorTo(0);
  }

  private clearScreen() {
    process.stdout.write('\x1b[2J\x1b[1;1f');
  }

  private update(messages: string[]) {
    this.clear();
    process.stdout.write(`${messages.join('\n')}\n`);
    this.lines = messages.length;
  }

  cast(message: string | string[], sub?: string) {
    if (!this.isEnabled) return;
    if (Array.isArray(message)) this.update(message);
    else this.update([`${message}${!sub || sub === '.' ? '' : ` (${sub})`}…`]);
  }

  clear() {
    if (!this.isEnabled) return;
    if (this.isWatch) this.clearScreen();
    else this.clearLines(this.lines);
  }
}
