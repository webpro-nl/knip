import { DEFAULT_CATALOG } from './util/catalog.js';

export class JsonCatalogPeeker {
  private lines: string[] = [];
  private sections: Record<string, { start: number; end: number }> = {};
  private ready = false;

  constructor(private fileContent: string) {}

  private init() {
    this.lines = this.fileContent.split('\n');
    let inCatalogs = false;
    let catalogName: string | undefined = undefined;
    let braceLevel = 0;

    for (let i = 0; i < this.lines.length; i++) {
      const line = this.lines[i];
      const trimmedLine = line.trim();
      if (catalogName) {
        if (line.includes('{')) braceLevel++;
        if (line.includes('}')) braceLevel--;
        if (braceLevel === 0) {
          this.sections[catalogName].end = i;
          catalogName = undefined;
        }
      } else if (trimmedLine.startsWith('"catalog":')) {
        catalogName = DEFAULT_CATALOG;
        this.sections[catalogName] = { start: i, end: 0 };
        braceLevel = (line.match(/{/g) ?? []).length - (line.match(/}/g) ?? []).length;
        if (braceLevel === 0) {
          this.sections[catalogName].end = i;
          catalogName = undefined;
        }
      } else if (trimmedLine.startsWith('"catalogs":')) {
        inCatalogs = true;
      } else if (inCatalogs) {
        if (trimmedLine.startsWith('}')) {
          inCatalogs = false;
          continue;
        }
        const match = trimmedLine.match(/"(.*?)"/);
        if (match) {
          catalogName = match[1];
          this.sections[catalogName] = { start: i, end: 0 };
          braceLevel = (line.match(/{/g) ?? []).length - (line.match(/}/g) ?? []).length;
        }
      }
    }
    this.ready = true;
  }

  public getLocation(parentSymbol: string, symbol: string) {
    if (!this.ready) this.init();

    const section = this.sections[parentSymbol];

    if (!section) return;

    for (let i = section.start + 1; i < section.end; i++) {
      const line = this.lines[i];
      if (line.trim().startsWith(`"${symbol}":`)) {
        return { line: i + 1, col: line.indexOf(`"${symbol}"`) + 1 };
      }
    }
  }
}
