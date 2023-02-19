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
