import assert from 'node:assert/strict';
import test from 'node:test';
import { getIncludedCompilers, normalizeCompilers } from '../../src/compilers/index.ts';

test('Normalize compiler extensions and give the legacy async map precedence', async () => {
  const compilers = normalizeCompilers({
    compilers: { template: () => 'sync', '.other': () => Promise.resolve('promise'), scss: true },
    asyncCompilers: { '.template': async () => 'legacy' },
  });
  assert.deepEqual([...compilers.keys()], ['.template', '.other', '.scss']);
  const included = getIncludedCompilers(compilers, new Set());
  assert.equal(await included.get('.template')?.('', 'view.template'), 'legacy');
  assert.equal(await included.get('.other')?.('', 'view.other'), 'promise');
  assert.equal(typeof included.get('.scss'), 'function');
  assert.equal(compilers.get('.scss'), true);
});

test('Keep configured compilers ahead of built-ins and collect compiler dependencies', async () => {
  const references: string[] = [];
  const configured = normalizeCompilers({ compilers: { scss: () => Promise.resolve('custom') } });
  const compilers = getIncludedCompilers(configured, new Set(['sass', 'less']), dependency =>
    references.push(dependency)
  );
  assert.equal(await compilers.get('.scss')?.('', 'style.scss'), 'custom');
  assert.equal(typeof compilers.get('.sass'), 'function');
  assert.equal(typeof compilers.get('.less'), 'function');
  assert.deepEqual(references, ['sass', 'less']);
});
