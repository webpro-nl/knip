import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { byPathDepth, sortWorkspaces } from '../../src/util/workspace.js';

test('Sort workspaces by path depth', () => {
  assert.deepEqual(['first', 'sec/ond', 'th/i/rd'].sort(byPathDepth), ['first', 'sec/ond', 'th/i/rd']);
  assert.deepEqual(['th/i/rd', 'first', 'sec/ond'].sort(byPathDepth), ['first', 'sec/ond', 'th/i/rd']);
  assert.deepEqual(['apps/*', 'apps/first'].sort(byPathDepth), ['apps/*', 'apps/first']);
  assert.deepEqual(['pkg/first', 'pkg/**', 'pkg/de/ep'].sort(byPathDepth), ['pkg/**', 'pkg/first', 'pkg/de/ep']);
});

test('Sort workspaces by path depth (reversed)', () => {
  assert.deepEqual(['first', 'sec/ond', 'th/i/rd'].sort(byPathDepth).reverse(), ['th/i/rd', 'sec/ond', 'first']);
  assert.deepEqual(['pkg/aaa', 'pkg/**', 'pkg/de/ep'].sort(byPathDepth).reverse(), ['pkg/de/ep', 'pkg/aaa', 'pkg/**']);
});

test('Sort workspaces by dependencies', () => {
  const graph = new Map([
    ['pkg-a', new Set(['pkg-b', 'pkg-c'])],
    ['pkg-b', new Set()],
    ['pkg-c', new Set(['pkg-b'])],
  ]);

  const workspaces = [
    { dir: 'pkg-a', name: 'pkg-a' },
    { dir: 'pkg-b', name: 'pkg-b' },
    { dir: 'pkg-c', name: 'pkg-c' },
  ];

  const sorted = sortWorkspaces(graph, workspaces);
  assert.deepEqual(
    sorted.map(w => w.dir),
    ['pkg-b', 'pkg-c', 'pkg-a']
  );
});

test('Sort workspaces handles circular dependencies', () => {
  const graph = new Map([
    ['pkg-a', new Set(['pkg-b'])],
    ['pkg-b', new Set(['pkg-c'])],
    ['pkg-c', new Set(['pkg-a'])],
  ]);

  const workspaces = [
    { dir: 'pkg-a', name: 'pkg-a' },
    { dir: 'pkg-b', name: 'pkg-b' },
    { dir: 'pkg-c', name: 'pkg-c' },
  ];

  const sorted = sortWorkspaces(graph, workspaces);
  assert.equal(sorted.length, 3);
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

  const sorted = sortWorkspaces(graph, workspaces);
  assert.deepEqual(
    sorted.map(w => w.dir),
    ['pkg-b', 'pkg-a']
  );
});
