import assert from 'node:assert/strict';
import test from 'node:test';
import { native } from '../../src/native.ts';

type ContainmentExport = Parameters<typeof native.liveContainingExports>[0][number];

const reference = (exports: ContainmentExport[], root: ContainmentExport, seen = new Set<string>()): boolean => {
  for (const name of root.referencedIn) {
    const container = exports.find(item => item.identifier === name);
    if (!container?.eligible) continue;
    if (container.seed) return true;
    if (!seen.has(name)) {
      seen.add(name);
      if (reference(exports, container, seen)) return true;
    }
  }
  return false;
};

test('Native containment preserves eligible edges, seedless cycles and direct seed boundaries', () => {
  const exports: ContainmentExport[] = [
    { identifier: 'value', referencedIn: [], eligible: true, seed: true },
    { identifier: 'type', referencedIn: ['value'], eligible: false, seed: false },
    { identifier: 'private', referencedIn: ['type'], eligible: false, seed: false },
    { identifier: 'cycleA', referencedIn: ['cycleB'], eligible: true, seed: false },
    { identifier: 'cycleB', referencedIn: ['cycleA'], eligible: true, seed: false },
    { identifier: 'self', referencedIn: ['self'], eligible: true, seed: true },
    { identifier: 'missing', referencedIn: ['absent'], eligible: true, seed: false },
  ];
  assert.deepEqual(native.liveContainingExports(exports), [false, true, false, false, false, true, false]);
  exports[4].referencedIn.push('value');
  assert.deepEqual(native.liveContainingExports(exports), [false, true, false, true, true, true, false]);
});

test('Native containment agrees with the recursive reference on generated graphs', () => {
  let state = 42;
  const next = (limit: number) => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state % limit;
  };
  for (let round = 0; round < 400; round++) {
    const size = 1 + next(60);
    const exports: ContainmentExport[] = [];
    for (let index = 0; index < size; index++) {
      const referencedIn: string[] = [];
      const count = next(5);
      for (let edge = 0; edge < count; edge++) referencedIn.push(`symbol${next(size + 3)}`);
      exports.push({ identifier: `symbol${index}`, referencedIn, eligible: next(4) !== 0, seed: next(7) === 0 });
    }
    const expected: boolean[] = [];
    for (const item of exports) expected.push(reference(exports, item));
    assert.deepEqual(native.liveContainingExports(exports), expected, `graph ${round}`);
  }
});

test('Native containment preserves UTF-16 identity', () => {
  const exports: ContainmentExport[] = [
    { identifier: '\uD800', referencedIn: ['\uDFFF'], eligible: true, seed: false },
    { identifier: '\uDFFF', referencedIn: [], eligible: true, seed: true },
    { identifier: '\uFFFD', referencedIn: [], eligible: true, seed: false },
    { identifier: '🍎', referencedIn: ['\uFFFD'], eligible: true, seed: false },
  ];
  assert.deepEqual(native.liveContainingExports(exports), [true, false, false, false]);
});
