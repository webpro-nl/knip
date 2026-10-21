import assert from 'node:assert/strict';
import test from 'node:test';
import config from '../../fixtures/compilers/utf16-enum/knip.ts';
import { main } from '../../src/index.ts';
import { rawComments, wasiParser } from '../../src/native.ts';
import { SourceFileManager } from '../../src/typescript/SourceFileManager.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/compilers/utf16-enum');

test('Custom compiler enum names retain the host raw literal spelling in production', async () => {
  const manager = new SourceFileManager({ compilers: new Map([['.source', config.compilers.source]]) });
  const sourceText = await manager.loadSourceText(`${cwd}/enum.source`);
  assert.equal(sourceText, 'export enum E { "' + String.fromCharCode(0xd800) + '" }');
  const { issues, counters } = await main(await createOptions({ cwd, includedIssueTypes: ['enumMembers'] }));
  const expected = rawComments || wasiParser ? [] : ['E.�'];
  assert.deepEqual(Object.keys(issues.enumMembers['enum.source'] ?? {}), expected);
  assert.equal(counters.enumMembers, expected.length);
});
