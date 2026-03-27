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
      const jsonDeps = line.indexOf('"dependencies"') !== -1;
      const jsonDevDeps = line.indexOf('"devDependencies"') !== -1;
      const jsonOptPeerDeps = line.indexOf('"optionalPeerDependencies"') !== -1;
      const yamlDeps = /^\s*dependencies:\s*/.test(line);
      const yamlDevDeps = /^\s*devDependencies:\s*/.test(line);
      const yamlOptPeerDeps = /^\s*optionalPeerDependencies:\s*/.test(line);
      const section =
        jsonDeps || yamlDeps
          ? 'dependencies'
          : jsonDevDeps || yamlDevDeps
            ? 'devDependencies'
            : jsonOptPeerDeps || yamlOptPeerDeps
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
    const escapedPackageName = packageName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const yamlMatcher = new RegExp(`^\\s*${escapedPackageName}:\\s*`);

    for (let i = section.startLine + 1; i < lines.length; i++) {
      const line = lines[i];
      const jsonMatch = line.includes(`"${packageName}"`);
      const yamlMatch = yamlMatcher.test(line);
      if (jsonMatch || yamlMatch) {
        const col = line.indexOf(packageName);
        return { line: i + 1, col: col + 1, pos: pos + col };
      }
      pos += line.length + 1;
    }
  }
}
