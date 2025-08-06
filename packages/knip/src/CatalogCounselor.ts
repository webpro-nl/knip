import type { ManifestCatalog } from './ConfigurationChief.js';
import { ROOT_WORKSPACE_NAME } from './constants.js';
import type { Issue } from './types/issues.js';
import type { PackageJson } from './types/package-json.js';
import { extractCatalogReferences, parseCatalog } from './util/catalog.js';

export class CatalogCounselor {
  private filePath: string;
  private entries = new Set<string>();
  private referencedEntries = new Set<string>();

  constructor(catalog: ManifestCatalog = { filePath: '' }) {
    this.filePath = catalog.filePath;
    this.entries = parseCatalog(catalog);
  }

  private addReferencedCatalogEntry(entryName: string) {
    this.referencedEntries.add(entryName);
  }

  public addWorkspace(manifest: PackageJson) {
    if (this.entries.size === 0) return;
    const catalogReferences = extractCatalogReferences(manifest);
    for (const catalogEntryName of catalogReferences) this.addReferencedCatalogEntry(catalogEntryName);
  }

  public settleCatalogIssues() {
    if (this.entries.size === 0) return [];

    const filePath = this.filePath;
    const workspace = ROOT_WORKSPACE_NAME;
    const catalogIssues: Issue[] = [];

    for (const entry of this.entries.keys()) {
      if (!this.referencedEntries.has(entry)) {
        const [parentSymbol, symbol] = entry.split(':');
        catalogIssues.push({ type: 'catalog', filePath, workspace, symbol, parentSymbol });
      }
    }

    return catalogIssues;
  }
}
