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

      if (colonPos !== -1 && this.manifestStr.startsWith(value, valuePos)) return this.toLocation(propertyPos + 1);

      propertyPos = this.manifestStr.indexOf(property, propertyPos + property.length);
    }
  }

  getPropertyLocation(section: string, property?: string) {
    const str = this.manifestStr;
    let depth = 0;
    let isInSection = false;
    for (let i = 0; i < str.length; i++) {
      const ch = str[i];
      if (ch === '"') {
        const start = i + 1;
        let end = start;
        while (end < str.length && str[end] !== '"') end += str[end] === '\\' ? 2 : 1;
        let next = end + 1;
        while (str.charCodeAt(next) <= 32) next++;
        if (str[next] === ':') {
          const key = str.slice(start, end);
          if (depth === 1) {
            isInSection = key === section;
            if (isInSection && property === undefined) return this.toLocation(start);
          } else if (depth === 2 && isInSection && key === property) return this.toLocation(start);
        }
        i = end;
      } else if (ch === '{' || ch === '[') depth++;
      else if (ch === '}' || ch === ']') depth--;
    }
  }

  private toLocation(pos: number) {
    let line = 1;
    let lineStart = 0;
    for (let index = 0; index < pos; index++) {
      if (this.manifestStr[index] === '\n') {
        line++;
        lineStart = index + 1;
      }
    }
    return { line, col: pos - lineStart + 1, pos };
  }
}
