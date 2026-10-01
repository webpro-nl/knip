export class PackagePeeker {
  private lines: string[] = [];
  private sections: Record<string, { startLine: number; startPos: number }> = {};
  private ready = false;
  private manifestStr: string;

  constructor(manifestStr: string) {
    this.manifestStr = manifestStr;
  }

  private init() {
    this.lines = this.manifestStr.split('\n');
    let pos = 0;

    for (let i = 0; i < this.lines.length; i++) {
      const line = this.lines[i];
      const section = line.includes('"dependencies"')
        ? 'dependencies'
        : line.includes('"devDependencies"')
          ? 'devDependencies'
          : line.includes('"optionalPeerDependencies"')
            ? 'optionalPeerDependencies'
            : undefined;
      if (section) this.sections[section] = { startLine: i, startPos: pos };
      pos += line.length + 1;
    }

    this.ready = true;
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

  getCatalogReferenceLocation(packageName: string, catalogName: string) {
    const property = `"${packageName}"`;
    const value = `"catalog:${catalogName === 'default' ? '' : catalogName}"`;
    let propertyPos = this.manifestStr.indexOf(property);

    while (propertyPos !== -1) {
      const colonPos = this.manifestStr.indexOf(':', propertyPos + property.length);
      let valuePos = colonPos + 1;
      while (valuePos > 0 && this.manifestStr[valuePos]?.trim() === '') valuePos++;

      if (colonPos !== -1 && this.manifestStr.startsWith(value, valuePos)) {
        const pos = propertyPos + 1;
        let line = 1;
        let lineStart = 0;
        for (let index = 0; index < pos; index++) {
          if (this.manifestStr[index] === '\n') {
            line++;
            lineStart = index + 1;
          }
        }
        return {
          line,
          col: pos - lineStart + 1,
          pos,
        };
      }

      propertyPos = this.manifestStr.indexOf(property, propertyPos + property.length);
    }
  }
}
