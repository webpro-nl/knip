import { readFile, rm, writeFile } from 'node:fs/promises';
import type { ExportPosTuple, Fix, Fixes } from './types/exports.js';
import type { Issues } from './types/issues.js';
import type { MainOptions } from './util/create-options.js';
import { load, save } from './util/package-json.js';
import { join, relative } from './util/path.js';
import { removeExport } from './util/remove-export.js';

export class IssueFixer {
  options: MainOptions;

  unusedTypeNodes: Map<string, Set<Fix>> = new Map();
  unusedExportNodes: Map<string, Set<Fix>> = new Map();

  constructor(options: MainOptions) {
    this.options = options;
  }

  public addUnusedTypeNode(filePath: string, fixes: Fixes | undefined) {
    if (!fixes || fixes.length === 0) return;
    if (this.unusedTypeNodes.has(filePath)) for (const fix of fixes) this.unusedTypeNodes.get(filePath)?.add(fix);
    else this.unusedTypeNodes.set(filePath, new Set(fixes));
  }

  public addUnusedExportNode(filePath: string, fixes: Fixes | undefined) {
    if (!fixes || fixes.length === 0) return;
    if (this.unusedExportNodes.has(filePath)) for (const fix of fixes) this.unusedExportNodes.get(filePath)?.add(fix);
    else this.unusedExportNodes.set(filePath, new Set(fixes));
  }

  public async fixIssues(issues: Issues) {
    const touchedFiles = new Set<string>();
    await this.removeUnusedFiles(issues);
    for (const filePath of await this.removeUnusedExports(issues)) touchedFiles.add(filePath);
    for (const filePath of await this.removeUnusedDependencies(issues)) touchedFiles.add(filePath);
    return touchedFiles;
  }

  private markExportIssuesFixed(issues: Issues, filePath: string) {
    const relPath = relative(this.options.cwd, filePath);

    const types = [
      ...(this.options.isFixUnusedTypes ? (['types', 'nsTypes', 'classMembers', 'enumMembers'] as const) : []),
      ...(this.options.isFixUnusedExports ? (['exports', 'nsExports'] as const) : []),
    ];

    for (const type of types) {
      for (const id in issues[type][relPath]) {
        issues[type][relPath][id].isFixed = true;
      }
    }
  }

  private async removeUnusedFiles(issues: Issues) {
    if (!this.options.isFixFiles) return;

    for (const issue of Object.values(issues._files).flatMap(Object.values)) {
      await rm(issue.filePath);
      issue.isFixed = true;
    }
  }

  private async removeUnusedExports(issues: Issues) {
    const touchedFiles = new Set<string>();
    const filePaths = new Set([...this.unusedTypeNodes.keys(), ...this.unusedExportNodes.keys()]);
    for (const filePath of filePaths) {
      const types = (this.options.isFixUnusedTypes && this.unusedTypeNodes.get(filePath)) || [];
      const exports = (this.options.isFixUnusedExports && this.unusedExportNodes.get(filePath)) || [];
      const exportPositions = [...types, ...exports]
        .filter((fix): fix is ExportPosTuple => fix !== undefined)
        .sort((a, b) => b[0] - a[0]);

      if (exportPositions.length > 0) {
        const sourceFileText = exportPositions.reduce(
          (text, [start, end, flags]) => removeExport({ text, start, end, flags }),
          await readFile(filePath, 'utf-8')
        );

        await writeFile(filePath, sourceFileText);

        touchedFiles.add(filePath);

        this.markExportIssuesFixed(issues, filePath);
      }
    }
    return touchedFiles;
  }

  private async removeUnusedDependencies(issues: Issues) {
    const touchedFiles = new Set<string>();
    if (!this.options.isFixDependencies) return touchedFiles;

    const filePaths = new Set([...Object.keys(issues.dependencies), ...Object.keys(issues.devDependencies)]);

    for (const filePath of filePaths) {
      const absFilePath = join(this.options.cwd, filePath);
      const pkg = await load(absFilePath);

      if (filePath in issues.dependencies) {
        for (const dependency of Object.keys(issues.dependencies[filePath])) {
          if (pkg.dependencies) {
            delete pkg.dependencies[dependency];
            issues.dependencies[filePath][dependency].isFixed = true;
          }
        }
      }

      if (filePath in issues.devDependencies) {
        for (const dependency of Object.keys(issues.devDependencies[filePath])) {
          if (pkg.devDependencies) {
            delete pkg.devDependencies[dependency];
            issues.devDependencies[filePath][dependency].isFixed = true;
          }
        }
      }

      await save(absFilePath, pkg);

      touchedFiles.add(filePath);
    }

    return touchedFiles;
  }
}
