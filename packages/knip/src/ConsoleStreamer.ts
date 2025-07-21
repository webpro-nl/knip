/**
 * - Casts messages as a stream to stdout during the process
 */
export class ConsoleStreamer {
  isEnabled = false;

  constructor({ isEnabled = false }) {
    this.isEnabled = isEnabled;
  }

  private update(messages: string[]) {
    process.stdout.write(`${messages.join('\n')}\n`);
  }

  cast(message: string | string[], sub?: string) {
    if (!this.isEnabled) return;
    if (Array.isArray(message)) this.update(message);
    else this.update([`${message}${!sub || sub === '.' ? '' : ` (${sub})`}…`]);
  }

  clear() {
    if (!this.isEnabled) return;
  }
}
