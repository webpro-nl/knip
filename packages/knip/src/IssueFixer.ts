import { readFile, rm, writeFile } from 'node:fs/promises';
import { type ExportsWithElements, type Fix, type Fixes, isFixForExportWithElements } from './types/exports.js';
import type { Issues } from './types/issues.js';
import { load, save } from './util/package-json.js';
import { join, relative } from './util/path.js';

interface Fixer {
  isEnabled: boolean;
  cwd: string;
  fixTypes: string[];
  isRemoveFiles: boolean;
}

export class IssueFixer {
  isEnabled = false;
  cwd: string = process.cwd();
  isFixFiles = true;
  isFixDependencies = true;
  isFixUnusedTypes = true;
  isFixUnusedExports = true;

  unusedTypeNodes: Map<string, Set<Fix>> = new Map();
  unusedExportNodes: Map<string, Set<Fix>> = new Map();

  constructor({ isEnabled, cwd, fixTypes = [], isRemoveFiles }: Fixer) {
    this.isEnabled = isEnabled;
    this.cwd = cwd;
    this.isFixFiles = isRemoveFiles && (fixTypes.length === 0 || fixTypes.includes('files'));
    this.isFixDependencies = fixTypes.length === 0 || fixTypes.includes('dependencies');
    this.isFixUnusedTypes = fixTypes.length === 0 || fixTypes.includes('types');
    this.isFixUnusedExports = fixTypes.length === 0 || fixTypes.includes('exports');
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
    await this.removeUnusedFiles(issues);
    await this.removeUnusedExportKeywords(issues);
    await this.removeUnusedDependencies(issues);
  }

  private markExportFixed(issues: Issues, filePath: string) {
    const relPath = relative(filePath);

    const types = [
      ...(this.isFixUnusedTypes ? (['types', 'nsTypes'] as const) : []),
      ...(this.isFixUnusedExports ? (['exports', 'nsExports'] as const) : []),
    ];

    for (const type of types) {
      for (const id in issues[type][relPath]) {
        issues[type][relPath][id].isFixed = true;
      }
    }
  }

  private async removeUnusedFiles(issues: Issues) {
    if (!this.isFixFiles) return;

    for (const issue of issues._files) {
      await rm(issue.filePath);
      issue.isFixed = true;
    }
  }

  private async removeUnusedExportKeywords(issues: Issues) {
    const filePaths = new Set([...this.unusedTypeNodes.keys(), ...this.unusedExportNodes.keys()]);
    for (const filePath of filePaths) {
      const fixes: Fixes = [
        ...(this.isFixUnusedTypes ? (this.unusedTypeNodes.get(filePath) ?? []) : []),
        ...(this.isFixUnusedExports ? (this.unusedExportNodes.get(filePath) ?? []) : []),
      ].sort((a, b) => b!.pos[0] - a!.pos[0]); // TODO how to handle types?

      // TODO add type guard
      const exportPositions = fixes;
      if (exportPositions.length > 0) {
        console.log(exportPositions);
        const file = await readFile(filePath, 'utf-8');
        const sourceFileText = exportPositions.reduce((text, fix) => {
          if (isFixForExportWithElements(fix)) {
            // TODO this could be called multiple times
            const allElementFixesForExport = exportPositions
              .filter(isFixForExportWithElements)
              .filter(f => f.pos[0] === fix.pos[0] && f.pos[1] === fix.pos[1])
              .map(f => f.element);

            const allElements = fix.allElements.filter(element => !allElementFixesForExport.includes(element));
            debugger;
            if (!allElements.length) {
              return text.substring(0, fix!.allExportPos[0]) + text.substring(fix!.allExportPos[1]);
            }
            return text.substring(0, fix.pos[0]) + `{${allElements.join(', ')}}` + text.substring(fix.pos[1]);
          } else {
            return text.substring(0, fix!.pos[0]) + text.substring(fix!.pos[1]);
          }
        }, file);

        await writeFile(filePath, sourceFileText);

        this.markExportFixed(issues, filePath);
      }
    }
  }

  private async removeUnusedDependencies(issues: Issues) {
    if (!this.isFixDependencies) return;

    const filePaths = new Set([...Object.keys(issues.dependencies), ...Object.keys(issues.devDependencies)]);

    for (const filePath of filePaths) {
      const absFilePath = join(this.cwd, filePath);
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
    }
  }
}
