import { readFile } from 'node:fs/promises';
import { ROOT_WORKSPACE_NAME } from './constants.ts';
import { JsonCatalogPeeker } from './JsonCatalogPeeker.ts';
import { PackagePeeker } from './PackagePeeker.ts';
import type { Fixes } from './types/exports.ts';
import type { Issue } from './types/issues.ts';
import type { Catalog, Catalogs, WorkspacePackage } from './types/package-json.ts';
import {
  type CatalogReference,
  extractCatalogReferences,
  getOverrideCatalogReferences,
  type OverrideCatalogReference,
  parseCatalog,
} from './util/catalog.ts';
import type { MainOptions } from './util/create-options.ts';
import { extname } from './util/path.ts';
import { YamlCatalogPeeker } from './YamlCatalogPeeker.ts';

export type CatalogContainer = { filePath: string; catalog?: Catalog; catalogs?: Catalogs; overrides?: Catalog };

export class CatalogCounselor {
  private sources: { filePath: string; entries: Set<string>; overrideReferences: OverrideCatalogReference[] }[] = [];
  private entries = new Set<string>();
  private referencedEntries = new Set<string>();
  private referenceIssues: Issue[] = [];

  constructor(options: MainOptions) {
    for (const container of options.catalog) {
      const entries = parseCatalog(container);
      const overrideReferences = getOverrideCatalogReferences(container.overrides);
      for (const entry of entries) this.entries.add(entry);
      for (const reference of overrideReferences) this.addReference(reference);
      this.sources.push({ filePath: container.filePath, entries, overrideReferences });
    }
  }

  private addReferencedCatalogEntry(entryName: string) {
    this.referencedEntries.add(entryName);
  }

  public addReference({ catalogName, packageName }: CatalogReference) {
    this.addReferencedCatalogEntry(`${catalogName}:${packageName}`);
  }

  public addWorkspace({
    name: workspace,
    manifest,
    manifestPath: filePath,
    manifestStr,
  }: Pick<WorkspacePackage, 'name' | 'manifest' | 'manifestPath' | 'manifestStr'>) {
    const catalogReferences = extractCatalogReferences(manifest);
    if (workspace === ROOT_WORKSPACE_NAME) {
      for (const reference of getOverrideCatalogReferences(manifest.pnpm?.overrides)) catalogReferences.push(reference);
    }
    if (catalogReferences.length === 0) return;

    const peeker = new PackagePeeker(manifestStr);
    for (const { catalogName, packageName, selector } of catalogReferences) {
      const catalogEntryName = `${catalogName}:${packageName}`;
      this.addReferencedCatalogEntry(catalogEntryName);
      if (!this.entries.has(catalogEntryName)) {
        const pos = peeker.getCatalogReferenceLocation(selector ?? packageName, catalogName);
        this.referenceIssues.push({
          type: 'catalogReferences',
          filePath,
          workspace,
          symbol: packageName,
          parentSymbol: catalogName,
          fixes: [],
          ...pos,
        });
      }
    }
  }

  public async settleCatalogIssues(options: MainOptions) {
    const workspace = ROOT_WORKSPACE_NAME;
    const catalogIssues: Issue[] = [];
    const overrideReferenceIssues: Issue[] = [];

    for (const { filePath, entries, overrideReferences } of this.sources) {
      if (entries.size === 0 && overrideReferences.length === 0) continue;

      const fileContent = await readFile(filePath, 'utf-8');
      const isYaml = ['.yml', '.yaml'].includes(extname(filePath));
      const yamlPeeker = isYaml ? new YamlCatalogPeeker(fileContent) : undefined;
      const peeker = yamlPeeker ?? new JsonCatalogPeeker(fileContent);

      for (const entry of entries) {
        if (!this.referencedEntries.has(entry)) {
          const [parentSymbol, symbol] = entry.split(':');
          const pos = peeker.getLocation(parentSymbol, symbol);
          const fixes: Fixes = [];
          if (options.isFix && isYaml && pos) fixes.push([pos.line, 0, 0]);
          catalogIssues.push({ type: 'catalog', filePath, workspace, symbol, parentSymbol, fixes, ...pos });
        }
      }

      for (const { catalogName, packageName, selector } of overrideReferences) {
        if (this.entries.has(`${catalogName}:${packageName}`)) continue;
        const pos = yamlPeeker?.getOverrideCatalogReferenceLocation(selector);
        overrideReferenceIssues.push({
          type: 'catalogReferences',
          filePath,
          workspace,
          symbol: packageName,
          parentSymbol: catalogName,
          fixes: [],
          ...pos,
        });
      }
    }

    return [...catalogIssues, ...this.referenceIssues, ...overrideReferenceIssues];
  }
}
