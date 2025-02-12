export class PackageJsonPeeker {
  private lines: string[] = [];
  private sections: Record<string, { startLine: number; startPos: number }> = {};
  private ready = false;

  constructor(private manifestStr: string) {}

  private init() {
    this.lines = this.manifestStr.split('\n');
    let pos = 0;

    for (let i = 0; i < this.lines.length; i++) {
      const line = this.lines[i];
      const section =
        line.indexOf('"dependencies"') !== -1
          ? 'dependencies'
          : line.indexOf('"devDependencies"') !== -1
            ? 'devDependencies'
            : line.indexOf('"optionalPeerDependencies"') !== -1
              ? 'optionalPeerDependencies'
              : undefined;
      if (section) this.sections[section] = { startLine: i, startPos: pos };
      pos += line.length + 1;
    }
  }

  getLocation(type: 'dependencies' | 'devDependencies' | 'optionalPeerDependencies', packageName: string) {
    if (!this.ready) this.init();

    const lines = this.lines;
    const section = this.sections[type];

    if (lines.length === 0 || !section) return;

    let pos = section.startPos + lines[section.startLine].length + 1;

    for (let i = section.startLine + 1; i < lines.length; i++) {
      const line = lines[i];
      if (line.includes(`"${packageName}"`)) {
        const col = line.indexOf(packageName);
        return { line: i + 1, col: col + 1, pos: pos + col };
      }
      pos += line.length + 1;
    }
  }
}
