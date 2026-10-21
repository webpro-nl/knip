import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { mkdtemp, realpath, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import test from 'node:test';
import { setTimeout } from 'node:timers/promises';
import { join } from '../../src/util/path.ts';
import { resolve } from '../helpers/resolve.ts';

test('CLI watch observes --directory, rebuilds source changes and exits on executable config changes', async t => {
  const cwd = await realpath(await mkdtemp(join(tmpdir(), 'knip-cli-watch-')));
  await writeFile(join(cwd, 'package.json'), '{"name":"cli-watch"}');
  await writeFile(join(cwd, 'settings.ts'), "export const entry = ['index.ts'];\n");
  await writeFile(
    join(cwd, 'knip.ts'),
    "import { entry } from './settings.ts'; export default { entry, project: ['*.ts'] };\n"
  );
  await writeFile(join(cwd, 'index.ts'), "import { value } from './value.ts'; console.log(value);\n");
  await writeFile(join(cwd, 'value.ts'), 'export const value = 1;\nexport const originalUnused = 2;\n');

  const runtime = process.argv[0];
  const cliPath = resolve('src/cli.ts');
  const child = spawn(runtime, [cliPath, '--watch', '--debug', '--directory', cwd, '--no-exit-code'], {
    cwd: resolve('.'),
    env: { ...process.env, NO_COLOR: '1', FORCE_COLOR: undefined },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let stdout = '';
  let stderr = '';
  let closed = false;
  let status: number | null = null;
  child.stdout.on('data', chunk => {
    stdout += chunk.toString();
  });
  child.stderr.on('data', chunk => {
    stderr += chunk.toString();
  });
  const exited = new Promise<void>(resolve => {
    child.once('close', code => {
      status = code;
      closed = true;
      resolve();
    });
  });
  t.after(async () => {
    if (!closed) child.kill('SIGKILL');
    await exited;
    await rm(cwd, { recursive: true, force: true });
  });
  const waitFor = async (predicate: () => boolean) => {
    const deadline = Date.now() + 10000;
    while (!predicate() && Date.now() < deadline && !closed) await setTimeout(10);
    assert.ok(predicate(), `Expected CLI watch update\nstdout:\n${stdout}\nstderr:\n${stderr}`);
  };

  await waitFor(() => /\d+ files \(/.test(stdout));
  assert.match(stdout, /originalUnused/);
  const before = stdout.length;
  writeFileSync(join(cwd, 'value.ts'), 'export const value = 1;\nexport const changedUnused = 2;\n');
  await waitFor(() => /\d+ files \(/.test(stdout.slice(before)));
  assert.match(stdout.slice(before), /changedUnused/);

  writeFileSync(join(cwd, 'settings.ts'), "export const entry = ['value.ts'];\n");
  await waitFor(() => closed);
  assert.equal(status, 2);
  assert.equal(stderr.match(/configuration module changed/g)?.length, 1);
  assert.match(stderr, /restart the session in a new process/);
  assert.doesNotMatch(stderr, /unhandled|\n\s+at /i);
});
