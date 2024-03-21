import { readFile, writeFile } from 'fs/promises';
import NPMCliPackageJson, { type PackageJson } from '@npmcli/package-json';
import { dirname, join } from './util/path.js';
import type { Fixes } from './types/exports.js';
import type { Issues } from './types/issues.js';

export class IssueFixer {
  isEnabled = false;
  cwd: string = process.cwd();
  isFixDependencies = true;
  isFixUnusedTypes = true;
  isFixUnusedExports = true;

  unusedTypeNodes: Map<string, Set<[number, number]>> = new Map();
  unusedExportNodes: Map<string, Set<[number, number]>> = new Map();

  constructor({ isEnabled, cwd, fixTypes = [] }: { isEnabled: boolean; cwd: string; fixTypes: string[] }) {
    this.isEnabled = isEnabled;
    this.cwd = cwd;
    this.isFixDependencies = fixTypes.length === 0 || fixTypes.includes('dependencies');
    this.isFixUnusedTypes = fixTypes.length === 0 || fixTypes.includes('types');
    this.isFixUnusedExports = fixTypes.length === 0 || fixTypes.includes('exports');
  }

  public addUnusedTypeNode(filePath: string, fixes: Fixes | undefined) {
    if (!fixes || fixes.length === 0) return;
    if (this.unusedTypeNodes.has(filePath)) fixes.forEach(fix => this.unusedTypeNodes.get(filePath)!.add(fix));
    else this.unusedTypeNodes.set(filePath, new Set(fixes));
  }

  public addUnusedExportNode(filePath: string, fixes: Fixes | undefined) {
    if (!fixes || fixes.length === 0) return;
    if (this.unusedExportNodes.has(filePath)) fixes.forEach(fix => this.unusedExportNodes.get(filePath)!.add(fix));
    else this.unusedExportNodes.set(filePath, new Set(fixes));
  }

  public async fixIssues(issues: Issues) {
    await this.removeUnusedExportKeywords();
    await this.removeUnusedDependencies(issues);
  }

  private async removeUnusedExportKeywords() {
    const filePaths = new Set([...this.unusedTypeNodes.keys(), ...this.unusedExportNodes.keys()]);
    for (const filePath of filePaths) {
      const exportPositions: Fixes = [
        ...(this.isFixUnusedTypes ? this.unusedTypeNodes.get(filePath) ?? [] : []),
        ...(this.isFixUnusedExports ? this.unusedExportNodes.get(filePath) ?? [] : []),
      ].sort((a, b) => b[0] - a[0]);

      if (exportPositions.length > 0) {
        const sourceFileText = exportPositions.reduce(
          (text, [start, end]) => text.substring(0, start) + text.substring(end),
          await readFile(filePath, 'utf-8')
        );
        const withoutEmptyReExports = sourceFileText
          .replaceAll(/export \{[ ,]+\} from ('|")[^'"]+('|");?\n?/g, '')
          .replaceAll(/export \{[ ,]+\};?\n?/g, '');
        await writeFile(filePath, withoutEmptyReExports);
      }
    }
  }

  private async removeUnusedDependencies(issues: Issues) {
    if (!this.isFixDependencies) return;

    const filePaths = new Set([...Object.keys(issues.dependencies), ...Object.keys(issues.devDependencies)]);

    for (const filePath of filePaths) {
      const manifest = await NPMCliPackageJson.load(dirname(join(this.cwd, filePath)));
      const pkg: PackageJson = manifest.content;

      if (filePath in issues.dependencies) {
        Object.keys(issues.dependencies[filePath]).forEach(dependency => {
          if (pkg.dependencies) delete pkg.dependencies[dependency];
        });
      }

      if (filePath in issues.devDependencies) {
        Object.keys(issues.devDependencies[filePath]).forEach(dependency => {
          if (pkg.devDependencies) delete pkg.devDependencies[dependency];
        });
      }

      await manifest.save();
    }
  }
}
