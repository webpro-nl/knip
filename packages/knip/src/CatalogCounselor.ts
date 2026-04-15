import { readFile } from 'node:fs/promises';
import { ROOT_WORKSPACE_NAME } from './constants.ts';
import { JsonCatalogPeeker } from './JsonCatalogPeeker.ts';
import type { Fixes } from './types/exports.ts';
import type { Issue } from './types/issues.ts';
import type { Catalog, Catalogs, PackageJson } from './types/package-json.ts';
import { extractCatalogReferences, parseCatalog } from './util/catalog.ts';
import type { MainOptions } from './util/create-options.ts';
import { extname } from './util/path.ts';
import { YamlCatalogPeeker } from './YamlCatalogPeeker.ts';

export type CatalogContainer = { filePath: string; catalog?: Catalog; catalogs?: Catalogs };

export class CatalogCounselor {
  private filePath: string;
  private entries = new Set<string>();
  private referencedEntries = new Set<string>();
  private fileContent?: string;

  constructor(options: MainOptions) {
    this.filePath = options.catalog.filePath;
    this.entries = parseCatalog(options.catalog);
  }

  private addReferencedCatalogEntry(entryName: string) {
    this.referencedEntries.add(entryName);
  }

  public addWorkspace(manifest: PackageJson) {
    if (this.entries.size === 0) return;
    const catalogReferences = extractCatalogReferences(manifest);
    for (const catalogEntryName of catalogReferences) this.addReferencedCatalogEntry(catalogEntryName);
  }

  public async settleCatalogIssues(options: MainOptions) {
    if (this.entries.size === 0) return [];

    const filePath = this.filePath;
    const workspace = ROOT_WORKSPACE_NAME;
    const catalogIssues: Issue[] = [];

    if (this.entries.size > this.referencedEntries.size) {
      this.fileContent = await readFile(filePath, 'utf-8');
      const isYaml = ['.yml', '.yaml'].includes(extname(filePath));
      const Peeker = isYaml ? YamlCatalogPeeker : JsonCatalogPeeker;
      const peeker = new Peeker(this.fileContent);

      for (const entry of this.entries.keys()) {
        if (!this.referencedEntries.has(entry)) {
          const [parentSymbol, symbol] = entry.split(':');
          const pos = peeker.getLocation(parentSymbol, symbol);
          const fixes: Fixes = [];
          if (options.isFix && isYaml && pos) fixes.push([pos.line, 0, 0]);
          catalogIssues.push({ type: 'catalog', filePath, workspace, symbol, parentSymbol, fixes, ...pos });
        }
      }
    }

    return catalogIssues;
  }
}
