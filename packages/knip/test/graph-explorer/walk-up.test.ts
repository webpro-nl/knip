import assert from 'node:assert/strict';
import test from 'node:test';
import { IMPORT_STAR } from '../../src/constants.js';
import type { RE_EXPORT_KIND } from '../../src/graph-explorer/constants.js';
import { walkUp } from '../../src/graph-explorer/walk-up.js';
import type { Export, FileNode, ImportMaps, ModuleGraph } from '../../src/types/module-graph.js';
import { resolve } from '../helpers/resolve.js';

type ReExportKind = (typeof RE_EXPORT_KIND)[keyof typeof RE_EXPORT_KIND];

const createGraph = (): ModuleGraph => new Map();

const filePath1 = resolve('module-1.ts');
const filePath2 = resolve('module-2.ts');
const filePath3 = resolve('module-3.ts');

const baseFileNode: FileNode = {
  imports: { internal: new Map(), external: new Set(), unresolved: new Set(), resolved: new Set(), imports: new Set() },
  exports: new Map(),
  duplicates: [],
  scripts: new Set(),
  traceRefs: new Set(),
};

const baseImportMaps: ImportMaps = {
  refs: new Set(),
  imported: new Map(),
  importedAs: new Map(),
  importedNs: new Map(),
  reExported: new Map(),
  reExportedAs: new Map(),
  reExportedNs: new Map(),
};

const baseExport: Export = {
  identifier: 'identifier',
  pos: 0,
  line: 1,
  col: 0,
  type: 'unknown',
  members: [],
  jsDocTags: new Set(),
  refs: [0, false],
  fixes: [],
};

test('should find self export (original definition)', () => {
  const graph = createGraph();

  graph.set(filePath1, {
    ...baseFileNode,
    exports: new Map([['identifier', baseExport]]),
  });

  const visited: Array<{ filePath: string; identifier: string; via: ReExportKind }> = [];
  const stopped = walkUp(graph, filePath1, 'identifier', (filePath, identifier, via) => {
    visited.push({ filePath, identifier, via });
    return undefined;
  });

  assert.equal(stopped, false);
  assert.equal(visited.length, 1);
  assert.equal(visited[0].filePath, filePath1);
  assert.equal(visited[0].identifier, 'identifier');
  assert.equal(visited[0].via, 'self');
});

test('should follow direct re-export chain', () => {
  const graph = createGraph();

  graph.set(filePath1, {
    ...baseFileNode,
    exports: new Map([['identifier', { ...baseExport, isReExport: true }]]),
    imports: {
      internal: new Map([
        [filePath2, { ...baseImportMaps, reExported: new Map([['identifier', new Set([filePath1])]]) }],
      ]),
      external: new Set(),
      unresolved: new Set(),
      resolved: new Set(),
      imports: new Set(),
    },
  });

  graph.set(filePath2, {
    ...baseFileNode,
    exports: new Map([['identifier', baseExport]]),
  });

  const visited: Array<{ filePath: string; identifier: string; via: ReExportKind }> = [];
  walkUp(graph, filePath1, 'identifier', (filePath, identifier, via) => {
    visited.push({ filePath, identifier, via });
    return undefined;
  });

  assert.equal(visited.length, 2);
  assert.equal(visited[0].via, 'passthrough');
  assert.equal(visited[0].filePath, filePath2);
  assert.equal(visited[1].via, 'self');
  assert.equal(visited[1].filePath, filePath2);
});

test('should follow aliased re-export', () => {
  const graph = createGraph();

  graph.set(filePath1, {
    ...baseFileNode,
    exports: new Map([['identifier', { ...baseExport, isReExport: true }]]),
    imports: {
      internal: new Map([
        [
          filePath2,
          { ...baseImportMaps, reExportedAs: new Map([['alias', new Map([['identifier', new Set([filePath1])]])]]) },
        ],
      ]),
      external: new Set(),
      unresolved: new Set(),
      resolved: new Set(),
      imports: new Set(),
    },
  });

  graph.set(filePath2, {
    ...baseFileNode,
    exports: new Map([['alias', { ...baseExport, identifier: 'alias' }]]),
  });

  const visited: Array<{ filePath: string; identifier: string; via: ReExportKind }> = [];
  walkUp(graph, filePath1, 'identifier', (filePath, identifier, via) => {
    visited.push({ filePath, identifier, via });
    return undefined;
  });

  assert.equal(visited.length, 2);
  assert.equal(visited[0].via, 'alias');
  assert.equal(visited[0].identifier, 'alias');
  assert.equal(visited[1].via, 'self');
  assert.equal(visited[1].identifier, 'alias');
});

test('should follow namespace re-export', () => {
  const graph = createGraph();

  graph.set(filePath1, {
    ...baseFileNode,
    exports: new Map([['NS', { ...baseExport, identifier: 'NS', isReExport: true }]]),
    imports: {
      internal: new Map([[filePath2, { ...baseImportMaps, reExportedNs: new Map([['NS', new Set([filePath1])]]) }]]),
      external: new Set(),
      unresolved: new Set(),
      resolved: new Set(),
      imports: new Set(),
    },
  });

  graph.set(filePath2, { ...baseFileNode });

  const visited: Array<{ filePath: string; identifier: string; via: ReExportKind }> = [];

  walkUp(graph, filePath1, 'NS', (filePath, identifier, via) => {
    visited.push({ filePath, identifier, via });
    return undefined;
  });

  assert.equal(visited.length, 1);
  assert.equal(visited[0].via, 'namespace');
  assert.equal(visited[0].identifier, 'NS');
});

test('should follow star re-export', () => {
  const graph = createGraph();

  graph.set(filePath1, {
    ...baseFileNode,
    imports: {
      internal: new Map([
        [filePath2, { ...baseImportMaps, reExported: new Map([[IMPORT_STAR, new Set([filePath1])]]) }],
      ]),
      external: new Set(),
      unresolved: new Set(),
      resolved: new Set(),
      imports: new Set(),
    },
  });

  graph.set(filePath2, {
    ...baseFileNode,
    exports: new Map([['identifier', baseExport]]),
  });

  const visited: Array<{ filePath: string; identifier: string; via: ReExportKind }> = [];
  walkUp(graph, filePath1, 'identifier', (filePath, identifier, via) => {
    visited.push({ filePath, identifier, via });
    return undefined;
  });

  assert.equal(visited.length, 2);
  assert.equal(visited[0].via, 'star');
  assert.equal(visited[1].via, 'self');
});

test('should bail out early when visitor returns stop', () => {
  const graph = createGraph();

  graph.set(filePath1, {
    ...baseFileNode,
    imports: {
      internal: new Map([
        [filePath2, { ...baseImportMaps, reExported: new Map([['identifier', new Set([filePath1])]]) }],
      ]),
      external: new Set(),
      unresolved: new Set(),
      resolved: new Set(),
      imports: new Set(),
    },
  });

  graph.set(filePath2, {
    ...baseFileNode,
    imports: {
      internal: new Map([
        [filePath3, { ...baseImportMaps, reExported: new Map([['identifier', new Set([filePath2])]]) }],
      ]),
      external: new Set(),
      unresolved: new Set(),
      resolved: new Set(),
      imports: new Set(),
    },
  });

  graph.set(filePath3, {
    ...baseFileNode,
    exports: new Map([['identifier', baseExport]]),
  });

  const visited: string[] = [];
  const stopped = walkUp(graph, filePath1, 'identifier', filePath => {
    visited.push(filePath);

    if (filePath === filePath2) return 'stop';
    return undefined;
  });

  assert.equal(stopped, true);
  assert.equal(visited.length, 1);
  assert.equal(visited[0], filePath2);
});

test('should handle circular re-exports without infinite loop', () => {
  const graph = createGraph();

  graph.set(filePath1, {
    ...baseFileNode,
    imports: {
      internal: new Map([
        [filePath2, { ...baseImportMaps, reExported: new Map([['identifier', new Set([filePath1])]]) }],
      ]),
      external: new Set(),
      unresolved: new Set(),
      resolved: new Set(),
      imports: new Set(),
    },
  });

  graph.set(filePath2, {
    ...baseFileNode,
    imports: {
      internal: new Map([
        [filePath1, { ...baseImportMaps, reExported: new Map([['identifier', new Set([filePath2])]]) }],
      ]),
      external: new Set(),
      unresolved: new Set(),
      resolved: new Set(),
      imports: new Set(),
    },
  });

  const visited: string[] = [];
  const stopped = walkUp(graph, filePath1, 'identifier', filePath => {
    visited.push(filePath);
    return undefined;
  });

  assert.equal(stopped, false);

  assert.ok(visited.length <= 2);
});
