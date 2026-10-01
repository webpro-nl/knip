import type { MainOptions } from './util/create-options.ts';

/**
 * - Casts messages as a stream to stdout during the process
 */
export class ConsoleStreamer {
  isEnabled = false;
  isWatch = false;
  private lines = 0;
  private stdoutBaseline = 0;
  private stderrBaseline = 0;

  constructor(options: MainOptions) {
    this.isEnabled = options.isShowProgress;
    this.isWatch = options.isWatch;
    this.snapshot();
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

  private snapshot() {
    this.stdoutBaseline = process.stdout.bytesWritten ?? 0;
    this.stderrBaseline = process.stderr.bytesWritten ?? 0;
  }

  private hadExternalWrites() {
    return (
      (process.stdout.bytesWritten ?? 0) > this.stdoutBaseline ||
      (process.stderr.bytesWritten ?? 0) > this.stderrBaseline
    );
  }

  private update(messages: string[]) {
    this.clear();
    process.stdout.write(`${messages.join('\n')}\n`);
    this.lines = messages.length;
  }

  cast(message: string | string[], sub?: string) {
    if (!this.isEnabled) return;
    if (this.hadExternalWrites()) this.lines = 0;
    if (Array.isArray(message)) this.update(message);
    else this.update([`${message}${!sub || sub === '.' ? '' : ` (${sub})`}…`]);
    this.snapshot();
  }

  clear() {
    if (!this.isEnabled) return;
    if (this.hadExternalWrites()) this.lines = 0;
    if (this.isWatch) this.clearScreen();
    else this.clearLines(this.lines);
    this.lines = 0;
    this.snapshot();
  }
}
