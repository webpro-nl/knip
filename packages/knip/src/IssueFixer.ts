import { readFile, rm, writeFile } from 'node:fs/promises';
import type { Fix, Fixes } from './types/exports.js';
import type { Issues } from './types/issues.js';
import { DEFAULT_CATALOG } from './util/catalog.js';
import { load, save } from './util/package-json.js';
import { extname, join, relative } from './util/path.js';
import { removeExport } from './util/remove-export.js';

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
  isFixCatalog = true;

  unusedTypeNodes: Map<string, Set<Fix>> = new Map();
  unusedExportNodes: Map<string, Set<Fix>> = new Map();

  constructor({ isEnabled, cwd, fixTypes = [], isRemoveFiles }: Fixer) {
    this.isEnabled = isEnabled;
    this.cwd = cwd;
    this.isFixFiles = isRemoveFiles && (fixTypes.length === 0 || fixTypes.includes('files'));
    this.isFixDependencies = fixTypes.length === 0 || fixTypes.includes('dependencies');
    this.isFixUnusedTypes = fixTypes.length === 0 || fixTypes.includes('types');
    this.isFixUnusedExports = fixTypes.length === 0 || fixTypes.includes('exports');
    this.isFixCatalog = fixTypes.length === 0 || fixTypes.includes('catalog');
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
    for (const filePath of await this.removeUnusedCatalogEntries(issues)) touchedFiles.add(filePath);
    return touchedFiles;
  }

  private markExportFixed(issues: Issues, filePath: string) {
    const relPath = relative(filePath);

    const types = [
      ...(this.isFixUnusedTypes ? (['types', 'nsTypes', 'classMembers', 'enumMembers'] as const) : []),
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

    for (const issue of Object.values(issues._files).flatMap(Object.values)) {
      await rm(issue.filePath);
      issue.isFixed = true;
    }
  }

  private async removeUnusedExports(issues: Issues) {
    const touchedFiles = new Set<string>();
    const filePaths = new Set([...this.unusedTypeNodes.keys(), ...this.unusedExportNodes.keys()]);
    for (const filePath of filePaths) {
      const types = (this.isFixUnusedTypes && this.unusedTypeNodes.get(filePath)) || [];
      const exports = (this.isFixUnusedExports && this.unusedExportNodes.get(filePath)) || [];
      const exportPositions = [...types, ...exports].filter(fix => fix !== undefined).sort((a, b) => b[0] - a[0]);

      if (exportPositions.length > 0) {
        const sourceFileText = exportPositions.reduce(
          (text, [start, end, flags]) => removeExport({ text, start, end, flags }),
          await readFile(filePath, 'utf-8')
        );

        await writeFile(filePath, sourceFileText);

        touchedFiles.add(filePath);

        this.markExportFixed(issues, filePath);
      }
    }
    return touchedFiles;
  }

  private async removeUnusedDependencies(issues: Issues) {
    const touchedFiles = new Set<string>();
    if (!this.isFixDependencies) return touchedFiles;

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

      touchedFiles.add(filePath);
    }

    return touchedFiles;
  }

  private async removeUnusedCatalogEntries(issues: Issues) {
    const touchedFiles = new Set<string>();
    if (!this.isFixCatalog) return touchedFiles;

    const filePaths = new Set(Object.keys(issues.catalog));

    for (const filePath of filePaths) {
      if (extname(filePath) === '.yaml') {
        const absFilePath = join(this.cwd, filePath);
        const fileContent = await readFile(absFilePath, 'utf-8');
        const remove = new Set<number>();
        const isRemove = (_: string, i: number) => !remove.has(i);
        for (const [key, issue] of Object.entries(issues.catalog[filePath])) {
          if (issue.line) {
            remove.add(issue.line - 1);
            issues.catalog[filePath][key].isFixed = true;
          }
        }
        await writeFile(absFilePath, fileContent.split('\n').filter(isRemove).join('\n'));
        touchedFiles.add(filePath);
      } else {
        const absFilePath = join(this.cwd, filePath);
        const pkg = await load(absFilePath);
        const catalog = pkg.catalog || (!Array.isArray(pkg.workspaces) && pkg.workspaces?.catalog);
        const catalogs = pkg.catalogs || (!Array.isArray(pkg.workspaces) && pkg.workspaces?.catalogs);
        for (const [key, issue] of Object.entries(issues.catalog[filePath])) {
          if (issue.parentSymbol === DEFAULT_CATALOG) {
            if (catalog) {
              delete catalog[issue.symbol];
              issues.catalog[filePath][key].isFixed = true;
            }
          } else {
            if (catalogs && issue.parentSymbol) {
              delete catalogs[issue.parentSymbol][issue.symbol];
              issues.catalog[filePath][key].isFixed = true;
            }
          }
        }
        await save(absFilePath, pkg);
        touchedFiles.add(filePath);
      }
    }

    return touchedFiles;
  }
}
