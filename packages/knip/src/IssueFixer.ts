import { readFile, rm, writeFile } from 'node:fs/promises';
import type { Fixes } from './types/exports.js';
import type { Issue, Issues } from './types/issues.js';
import { DEFAULT_CATALOG } from './util/catalog.js';
import type { MainOptions } from './util/create-options.js';
import { load, save } from './util/package-json.js';
import { extname, join } from './util/path.js';
import { removeExport } from './util/remove-export.js';

export class IssueFixer {
  options: MainOptions;

  constructor(options: MainOptions) {
    this.options = options;
  }

  public async fixIssues(issues: Issues) {
    const touchedFiles = new Set<string>();
    await this.removeUnusedFiles(issues);
    for (const filePath of await this.removeUnusedExports(issues)) touchedFiles.add(filePath);
    for (const filePath of await this.removeUnusedDependencies(issues)) touchedFiles.add(filePath);
    for (const filePath of await this.removeUnusedCatalogEntries(issues)) touchedFiles.add(filePath);
    return touchedFiles;
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

    const types = [
      ...(this.options.isFixUnusedTypes ? (['types', 'nsTypes', 'classMembers', 'enumMembers'] as const) : []),
      ...(this.options.isFixUnusedExports ? (['exports', 'nsExports'] as const) : []),
    ];

    if (types.length === 0) return touchedFiles;

    const allFixes = new Map<string, Fixes>();

    for (const type of types) {
      for (const [filePath, issueMap] of Object.entries(issues[type])) {
        const fixes = allFixes.get(filePath) ?? [];
        for (const issue of Object.values(issueMap)) fixes.push(...issue.fixes);
        allFixes.set(filePath, fixes);
      }
    }

    for (const [filePath, fixes] of allFixes) {
      const absFilePath = join(this.options.cwd, filePath);
      const sourceFileText = fixes
        .sort((a, b) => b[0] - a[0])
        .reduce(
          (text, [start, end, flags]) => removeExport({ text, start, end, flags }),
          await readFile(absFilePath, 'utf-8')
        );

      await writeFile(absFilePath, sourceFileText);

      touchedFiles.add(absFilePath);

      for (const type of types) {
        const issueMap = issues[type]?.[filePath];
        if (issueMap) for (const issue of Object.values(issueMap)) issue.isFixed = true;
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

      touchedFiles.add(absFilePath);
    }

    return touchedFiles;
  }

  private async removeUnusedCatalogEntries(issues: Issues) {
    const touchedFiles = new Set<string>();
    if (!this.options.isFixCatalog) return touchedFiles;

    const filePaths = new Set(Object.keys(issues.catalog));

    for (const filePath of filePaths) {
      if (['.yml', '.yaml'].includes(extname(filePath))) {
        const absFilePath = join(this.options.cwd, filePath);
        const fileContent = await readFile(absFilePath, 'utf-8');
        const issuesForFile = Object.values(issues.catalog[filePath]);
        const takeLine = (issue: Issue) => issue.fixes.map(fix => fix[0]);
        const remove = new Set(issuesForFile.flatMap(takeLine));
        const keep = (_: string, i: number) => !remove.has(i + 1);

        await writeFile(absFilePath, fileContent.split('\n').filter(keep).join('\n'));

        for (const issue of issuesForFile) issue.isFixed = true;

        touchedFiles.add(filePath);
      } else {
        const absFilePath = join(this.options.cwd, filePath);
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

        touchedFiles.add(absFilePath);
      }
    }

    return touchedFiles;
  }
}
