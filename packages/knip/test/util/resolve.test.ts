import assert from 'node:assert/strict';
import test from 'node:test';
import { _resolveDeclarationSync } from '../../src/util/resolve.ts';
import { resolve } from '../helpers/resolve.ts';

const fixture = 'fixtures/resolution/declaration-extension-alias';
const containingFile = resolve(`${fixture}/index.d.ts`);

test('Resolve TypeScript extensions to emitted declarations', () => {
  for (const [specifier, declaration] of [
    ['./target.ts', 'target.d.ts'],
    ['./target.mts', 'target.d.mts'],
    ['./target.cts', 'target.d.cts'],
  ]) {
    assert.equal(_resolveDeclarationSync(specifier, containingFile)?.path, resolve(`${fixture}/${declaration}`));
  }
});
