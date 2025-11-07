import { DEFAULT_CATALOG } from './util/catalog.js';

function matchesKey(line: string, indent: string, key: string) {
  return (
    line.startsWith(`${indent}${key}:`) ||
    line.startsWith(`${indent}"${key}":`) ||
    line.startsWith(`${indent}'${key}':`)
  );
}

export class YamlCatalogPeeker {
  private lines: string[] = [];
  private sections: Record<string, number> = {};
  private ready = false;

  constructor(private fileContent: string) {}

  private init() {
    this.lines = this.fileContent.split('\n');
    for (let i = 0; i < this.lines.length; i++) {
      const line = this.lines[i];
      if (line.startsWith('catalog:')) {
        this.sections.catalog = i;
      } else if (line.startsWith('catalogs:')) {
        this.sections.catalogs = i;
      }
    }
    this.ready = true;
  }

  public getLocation(parentSymbol: string, symbol: string) {
    if (!this.ready) this.init();

    const isDefault = parentSymbol === DEFAULT_CATALOG;
    const startLine = this.sections[isDefault ? 'catalog' : 'catalogs'];

    if (typeof startLine === 'undefined') return;

    if (isDefault) {
      for (let i = startLine + 1; i < this.lines.length; i++) {
        const line = this.lines[i];
        if (!line.startsWith('  ')) break;
        if (matchesKey(line, '  ', symbol)) {
          return { line: i + 1, col: line.indexOf(symbol) + 1 };
        }
      }
    } else {
      let inTargetCatalog = false;
      for (let i = startLine + 1; i < this.lines.length; i++) {
        const line = this.lines[i];
        if (!line.startsWith('  ')) break;

        if (matchesKey(line, '  ', parentSymbol)) {
          inTargetCatalog = true;
        } else if (inTargetCatalog) {
          if (!line.startsWith('    ')) {
            inTargetCatalog = false;
            continue;
          }
          if (matchesKey(line, '    ', symbol)) {
            return { line: i + 1, col: line.indexOf(symbol) + 1 };
          }
        }
      }
    }
  }
}
