import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { deserialize, serialize } from 'node:v8';

test('Should serialize and deserialize file back to original', () => {
  const file = {
    imported: undefined,
    internalImportCache: undefined,
    imports: {
      internal: new Map([
        [
          'file',
          {
            refs: new Set(['ref1', 'ref2']),
            imported: new Map([['name', new Set(['file', 'file2'])]]),
            importedAs: new Map([['name', new Map([['alias', new Set(['file', 'file2'])]])]]),
            importedNs: new Map([['namespace', new Set(['file', 'file2'])]]),
            reExported: new Map([['*', new Set(['file', 'file2'])]]),
            reExportedAs: new Map([['name', new Map([['alias', new Set(['file', 'file2'])]])]]),
            reExportedNs: new Map([['namespace', new Set(['file', 'file2'])]]),
          },
        ],
        [
          'file2',
          {
            refs: new Set(['ref1', 'ref2']),
            imported: new Map([['name', new Set(['file', 'file2'])]]),
            importedAs: new Map([
              [
                'name',
                new Map([
                  ['alias', new Set(['file', 'file2'])],
                  ['alias2', new Set(['file', 'file2'])],
                ]),
              ],
            ]),
            importedNs: new Map([['namespace', new Set(['file', 'file2'])]]),
            reExported: new Map([
              ['*', new Set(['file', 'file2'])],
              ['id', new Set(['file', 'file2'])],
            ]),
            reExportedAs: new Map([['name', new Map([['alias', new Set(['file', 'file2'])]])]]),
            reExportedNs: new Map([
              ['namespace', new Set(['file', 'file2'])],
              ['namespace2', new Set(['file', 'file2'])],
            ]),
          },
        ],
      ]),
      external: new Set(['ext']),
      unresolved: new Set([{ specifier: 'unresolved', pos: 1, line: 1, col: 1 }]),
    },
    exports: {
      exported: new Map(),
      duplicate: new Set([
        [
          { symbol: 'def', pos: 1, line: 1, col: 1 },
          { symbol: 'dup', pos: 1, line: 2, col: 2 },
        ],
      ]),
    },
    scripts: new Set(['script', 'script2']),
    traceRefs: new Set(['ref']),
  };

  assert.deepEqual(deserialize(serialize(file)), file);
});
