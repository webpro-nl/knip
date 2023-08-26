import { readFileSync, writeFileSync } from 'fs';
import { EOL } from 'os';
import ts from 'typescript';
import { join } from './util/path.js';
import type { Issues } from './types/issues.js';
import type { PackageJson } from '@npmcli/package-json';

export class IssueFixer {
  isEnabled = false;
  cwd: string = process.cwd();
  isFixDependencies = true;
  isFixUnusedTypes = true;
  isFixUnusedExports = true;

  unusedTypeNodes: Map<string, Set<ts.Node[]>> = new Map();
  unusedExportNodes: Map<string, Set<ts.Node[]>> = new Map();

  constructor({ isEnabled, cwd, fixTypes = [] }: { isEnabled: boolean; cwd: string; fixTypes: string[] }) {
    this.isEnabled = isEnabled;
    this.cwd = cwd;
    this.isFixDependencies = fixTypes.length === 0 || fixTypes.includes('dependencies');
    this.isFixUnusedTypes = fixTypes.length === 0 || fixTypes.includes('types');
    this.isFixUnusedExports = fixTypes.length === 0 || fixTypes.includes('exports');
  }

  public addUnusedTypeNode(filePath: string, fix: ts.Node[]) {
    if (this.unusedTypeNodes.has(filePath)) this.unusedTypeNodes.get(filePath)!.add(fix);
    else this.unusedTypeNodes.set(filePath, new Set([fix]));
  }

  public addUnusedExportNode(filePath: string, fix: ts.Node[]) {
    if (this.unusedExportNodes.has(filePath)) this.unusedExportNodes.get(filePath)!.add(fix);
    else this.unusedExportNodes.set(filePath, new Set([fix]));
  }

  public async fixIssues(issues: Issues) {
    this.removeUnusedExportKeywords();
    await this.removeUnusedDependencies(issues);
  }

  private removeUnusedExportKeywords() {
    const filePaths = new Set([...this.unusedTypeNodes.keys(), ...this.unusedExportNodes.keys()]);
    for (const filePath of filePaths) {
      const nodes: ts.Node[][] = [
        ...(this.isFixUnusedTypes ? this.unusedTypeNodes.get(filePath) ?? [] : []),
        ...(this.isFixUnusedExports ? this.unusedExportNodes.get(filePath) ?? [] : []),
      ].sort((a, b) => b[0].getStart() - a[0].getStart());
      if (nodes.length === 0) continue;
      const sourceFile = nodes[0][0].getSourceFile();
      const sourceFileText = nodes.reduce((text, fix) => {
        fix.reverse().forEach(fix => {
          const start = fix.getStart();
          const end = fix.getEnd();
          const space = fix.kind === ts.SyntaxKind.DefaultKeyword || fix.kind === ts.SyntaxKind.ExportKeyword ? 1 : 0;
          text = text.substring(0, start) + text.substring(end + space);
        });
        return text;
      }, sourceFile.getFullText());

      ts.sys.writeFile(filePath, sourceFileText);
    }
  }

  private async removeUnusedDependencies(issues: Issues) {
    if (!this.isFixDependencies) return;

    const filePaths = new Set([...Object.keys(issues.dependencies), ...Object.keys(issues.devDependencies)]);

    for (const filePath of filePaths) {
      const file = join(this.cwd, 'package.json');

      // Should be `PackageJson.load(dir)` from `@npmcli/package-json` but somehow `readFile` ghosts
      const pkg: PackageJson = JSON.parse(readFileSync(file, 'utf8'));

      if (issues.dependencies[filePath]) {
        Object.keys(issues.dependencies[filePath]).forEach(dependency => {
          if (pkg.dependencies) delete pkg.dependencies[dependency];
        });
      }

      if (issues.devDependencies[filePath]) {
        Object.keys(issues.devDependencies[filePath]).forEach(dependency => {
          if (pkg.devDependencies) delete pkg.devDependencies[dependency];
        });
      }

      writeFileSync(file, `${JSON.stringify(pkg, null, '  ')}\n`.replace(/\n/g, EOL));
    }
  }
}
