/**
 * - Casts messages as a stream to stdout during the process
 */
export class ConsoleStreamer {
  isEnabled = false;
  private lines = 0;

  constructor({ isEnabled = false }) {
    this.isEnabled = isEnabled;
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

  private resetLines() {
    this.clearLines(this.lines);
  }

  private update(messages: string[]) {
    this.resetLines();
    process.stdout.write(`${messages.join('\n')}\n`);
    this.lines = messages.length;
  }

  cast(message: string | string[]) {
    if (!this.isEnabled) return;
    if (Array.isArray(message)) this.update(message);
    else this.update([message]);
  }

  clear() {
    if (!this.isEnabled) return;
    this.resetLines();
  }
}
