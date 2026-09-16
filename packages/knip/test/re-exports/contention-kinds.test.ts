import assert from 'node:assert/strict';
import { test } from 'node:test';
import { join } from '../../src/util/path.ts';
import { resolve } from '../helpers/resolve.ts';
import { createDescriber } from '../session/util.ts';

const { cwd, graph, explorer, describeFile } = await createDescriber(resolve('fixtures/re-exports/ambiguous-barrel'));

const kinds = (relativePath: string) => {
  const result: Record<string, string> = {};
  for (const [identifier, details] of Object.entries(describeFile(relativePath).contention)) {
    result[identifier] = details.sites[0].kind;
  }
  return result;
};

const sitePaths = (relativePath: string, identifier: string) => {
  const paths: string[] = [];
  for (const site of describeFile(relativePath).contention[identifier].sites) paths.push(site.filePath);
  return paths;
};

test('reports competing star sources as ambiguous', () => {
  assert.deepEqual(kinds('barrel.ts'), {
    CrossNamespace: 'ambiguous',
    Entity: 'ambiguous',
    Model: 'ambiguous',
    TypeEntity: 'ambiguous',
    foo: 'ambiguous',
  });
});

test('reports competing type-only star sources as ambiguous', () => {
  assert.deepEqual(kinds('type-barrel.ts'), {
    CrossNamespace: 'ambiguous',
    Entity: 'ambiguous',
    Model: 'ambiguous',
    TypeEntity: 'ambiguous',
    foo: 'ambiguous',
  });
});

test('names every barrel that contends over the same origin export', () => {
  assert.deepEqual(sitePaths('fruits.ts', 'foo'), [join(cwd, 'barrel.ts'), join(cwd, 'type-barrel.ts')]);
});

test('reports an ambiguous name next to an unrelated local member export', () => {
  assert.deepEqual(kinds('member-barrel.ts'), { fruit: 'ambiguous' });
});

test('reports copied imports of one origin as ambiguous', () => {
  assert.deepEqual(kinds('copy-barrel.ts'), { namespaceCopy: 'ambiguous', same: 'ambiguous' });
});

test('reports copied dynamic imports as ambiguous', () => {
  assert.deepEqual(kinds('dynamic-barrel.ts'), { dynamicCopy: 'ambiguous' });
});

test('reports namespace re-exports of different modules as ambiguous', () => {
  assert.deepEqual(kinds('namespace-distinct-barrel.ts'), { Produce: 'ambiguous' });
});

test('reports both entries of an ambiguous re-export cycle', () => {
  assert.deepEqual(kinds('cycle-a.ts'), { cycleName: 'ambiguous' });
  assert.deepEqual(kinds('cycle-b.ts'), { cycleName: 'ambiguous' });
});

test('reports an explicit re-export over a star candidate as shadowed', () => {
  assert.deepEqual(kinds('explicit-barrel.ts'), { fruit: 'shadowed' });
});

test('reports a winning namespace re-export as shadowed', () => {
  assert.deepEqual(kinds('namespace-explicit-barrel.ts'), { fruit: 'shadowed' });
});

test('separates converged aliases from ambiguous ones', () => {
  assert.deepEqual(kinds('alias-barrel.ts'), {
    converged: 'converged',
    declaredDefault: 'converged',
    expressionDefault: 'ambiguous',
    namedDefault: 'converged',
    split: 'ambiguous',
  });
});

test('reports namespace re-exports of one module as converged without a position', () => {
  assert.deepEqual(kinds('namespace-barrel.ts'), { Produce: 'converged' });
  assert.deepEqual(describeFile('namespace-barrel.ts').contention.Produce.sites, [
    {
      kind: 'converged',
      filePath: join(cwd, 'namespace-barrel.ts'),
      identifier: 'Produce',
      origins: [{ filePath: join(cwd, 'origin.ts'), identifier: '*' }],
      sources: [join(cwd, 'namespace-left.ts'), join(cwd, 'namespace-right.ts')],
    },
  ]);
});

test('does not forward default through export star', () => {
  assert.deepEqual(kinds('default-barrel.ts'), {});
  assert.deepEqual(explorer.resolveExportOrigins(join(cwd, 'default-barrel.ts'), 'default'), {
    origins: [],
    hasExplicitExport: false,
  });
});

test('reports the ambiguous alias site from the defining module', () => {
  assert.deepEqual(kinds('bindings.ts'), {
    apple: 'ambiguous',
    leftShared: 'converged',
    pear: 'ambiguous',
    rightShared: 'converged',
  });

  assert.deepEqual(describeFile('bindings.ts').contention.apple.sites, [
    {
      kind: 'ambiguous',
      filePath: join(cwd, 'alias-barrel.ts'),
      identifier: 'split',
      origins: [
        { filePath: join(cwd, 'bindings.ts'), identifier: 'apple', line: 5, col: 55 },
        { filePath: join(cwd, 'bindings.ts'), identifier: 'pear', line: 5, col: 62 },
      ],
      sources: [join(cwd, 'alias-left.ts'), join(cwd, 'alias-right.ts')],
    },
  ]);
});

test('does not converge a name that a cycle relays back to its own barrel', () => {
  assert.deepEqual(kinds('loop-a.ts'), {});
  assert.deepEqual(kinds('loop-b.ts'), {});
  assert.deepEqual(kinds('loop-origin.ts'), {});
});

test('reports the same contention for a file whether or not its cone is cached', () => {
  const cold = new Map<string, unknown>();
  for (const filePath of graph.keys()) {
    explorer.invalidateCache();
    cold.set(filePath, [...explorer.getContention(filePath)]);
  }

  for (const filePath of graph.keys()) explorer.getContention(filePath);
  for (const filePath of graph.keys()) {
    assert.deepEqual([...explorer.getContention(filePath)], cold.get(filePath), filePath);
  }
});
