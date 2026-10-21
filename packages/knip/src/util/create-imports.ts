import type { ImportMaps } from '../types/module-graph.ts';

export const createImports = (): ImportMaps => ({
  refs: new Set(),
  enumerated: undefined,
  import: new Map(),
  importAs: new Map(),
  importNs: new Map(),
  reExport: new Map(),
  reExportAs: new Map(),
  reExportNs: new Map(),
});
