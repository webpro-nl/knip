import assert from 'node:assert/strict';
import test from 'node:test';
import { graphSequencer } from '../../src/util/graph-sequencer.js';

test('Sort workspaces by dependencies', () => {
  const graph = new Map([
    ['pkg-a', new Set(['pkg-b', 'pkg-c'])],
    ['pkg-b', new Set()],
    ['pkg-c', new Set(['pkg-b'])],
  ]);

  const sorted = graphSequencer(graph);
  assert.deepEqual(sorted.chunks.flat(), ['pkg-b', 'pkg-c', 'pkg-a']);
});

test('Sort workspaces handles circular dependencies', () => {
  const graph = new Map([
    ['pkg-a', new Set(['pkg-b'])],
    ['pkg-b', new Set(['pkg-c'])],
    ['pkg-c', new Set(['pkg-a'])],
  ]);

  const sorted = graphSequencer(graph);
  assert.equal(sorted.chunks.flat().length, 3);
  assert.deepEqual(sorted.chunks.flat(), ['pkg-a', 'pkg-b', 'pkg-c']);
});

test('Sort workspaces with included subset', () => {
  const graph = new Map([
    ['pkg-a', new Set(['pkg-b', 'pkg-c'])],
    ['pkg-b', new Set()],
    ['pkg-c', new Set(['pkg-b'])],
  ]);

  const workspaces = [
    { dir: 'pkg-a', name: 'pkg-a' },
    { dir: 'pkg-b', name: 'pkg-b' },
  ];

  const sorted = graphSequencer(
    graph,
    workspaces.map(w => w.dir)
  );
  assert.deepEqual(sorted.chunks.flat(), ['pkg-b', 'pkg-a']);
});

test('Sort', () => {
  const graph = new Map([
    ['packages/e2e-tests', new Set()],
    ['packages/server', new Set(['packages/shared', 'packages/app'])],
    ['packages/shared', new Set([])],
    ['packages/app', new Set(['packages/shared'])],
    ['.', new Set()],
  ]);

  const sorted = graphSequencer(graph);
  assert.deepEqual(sorted.chunks.flat(), [
    'packages/e2e-tests',
    'packages/shared',
    '.',
    'packages/app',
    'packages/server',
  ]);
});
