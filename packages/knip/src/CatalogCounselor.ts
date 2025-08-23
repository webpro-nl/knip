import { readFile } from 'node:fs/promises';
import type { ManifestCatalog } from './ConfigurationChief.js';
import { JsonCatalogPeeker } from './JsonCatalogPeeker.js';
import { YamlCatalogPeeker } from './YamlCatalogPeeker.js';
import { ROOT_WORKSPACE_NAME } from './constants.js';
import type { Issue } from './types/issues.js';
import type { PackageJson } from './types/package-json.js';
import { extractCatalogReferences, parseCatalog } from './util/catalog.js';
import { extname } from './util/path.js';

export class CatalogCounselor {
  private filePath: string;
  private entries = new Set<string>();
  private referencedEntries = new Set<string>();
  private fileContent?: string;

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

  public async settleCatalogIssues() {
    if (this.entries.size === 0) return [];

    const filePath = this.filePath;
    const workspace = ROOT_WORKSPACE_NAME;
    const catalogIssues: Issue[] = [];

    if (this.entries.size > this.referencedEntries.size) {
      this.fileContent = await readFile(filePath, 'utf-8');
      const isYaml = extname(filePath) === '.yaml';
      const Peeker = isYaml ? YamlCatalogPeeker : JsonCatalogPeeker;
      const peeker = new Peeker(this.fileContent);

      for (const entry of this.entries.keys()) {
        if (!this.referencedEntries.has(entry)) {
          const [parentSymbol, symbol] = entry.split(':');
          const pos = peeker.getLocation(parentSymbol, symbol);
          catalogIssues.push({ type: 'catalog', filePath, workspace, symbol, parentSymbol, ...pos });
        }
      }
    }

    return catalogIssues;
  }
}
