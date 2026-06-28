import { test } from 'node:test';
import assert from 'node:assert';
import childProcess from 'node:child_process';
import { getStagedFiles, formatAndStageFiles } from './pre-commit.ts';

test('getStagedFiles filters valid extensions', t => {
  t.mock.method(childProcess, 'spawnSync', () => {
    return {
      status: 0,
      stdout: 'src/index.ts\nREADME.md\nimage.png\n\n',
    };
  });

  const files = getStagedFiles();
  assert.deepStrictEqual(files, ['src/index.ts', 'README.md']);
});

test('formatAndStageFiles returns 0 when empty array is provided', () => {
  const result = formatAndStageFiles([]);
  assert.strictEqual(result, 0);
});

test('formatAndStageFiles executes fmt and git add on files', t => {
  const executedCommands: string[] = [];

  t.mock.method(childProcess, 'spawnSync', (command: string, args: string[]) => {
    executedCommands.push(`${command} ${args[0]}`);
    return { status: 0 };
  });

  const result = formatAndStageFiles(['test.ts']);
  assert.strictEqual(result, 0);
  assert.deepStrictEqual(executedCommands, ['pnpm fmt', 'git add']);
});

test('formatAndStageFiles aborts when formatting fails', t => {
  t.mock.method(childProcess, 'spawnSync', () => {
    return { status: 1 };
  });

  const result = formatAndStageFiles(['test.ts']);
  assert.strictEqual(result, 1);
});
