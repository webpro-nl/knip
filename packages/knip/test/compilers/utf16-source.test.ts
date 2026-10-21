import assert from 'node:assert/strict';
import test from 'node:test';
import config from '../../fixtures/compilers/utf16-source/knip.ts';
import { main } from '../../src/index.ts';
import { wasiParser } from '../../src/native.ts';
import { _parseFile } from '../../src/typescript/ast-nodes.ts';
import { SourceFileManager } from '../../src/typescript/SourceFileManager.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';
import { extractSpecifiers } from '../reference/typescript/follow-imports.ts';

const cwd = resolve('fixtures/compilers/utf16-source');

test('Custom compiler UTF-16 output uses the host parser conversion in production', async () => {
  const filePath = `${cwd}/entry.source`;
  const manager = new SourceFileManager({ compilers: new Map([['.source', config.compilers.source]]) });
  const sourceText = await manager.loadSourceText(filePath);
  assert.equal(sourceText.isWellFormed(), false);
  const expected = extractSpecifiers(_parseFile(filePath, sourceText), sourceText, filePath);
  assert.deepEqual(expected, [wasiParser ? './' + String.fromCodePoint(0x10058) : './�X']);
  const { issues, counters } = await main(await createOptions({ cwd, includedIssueTypes: ['unresolved'] }));
  assert.deepEqual(Object.keys(issues.unresolved['entry.source']), expected);
  assert.equal(counters.unresolved, 1);
});
