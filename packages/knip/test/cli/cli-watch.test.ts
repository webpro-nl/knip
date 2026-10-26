import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { mkdtemp, realpath, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import test from 'node:test';
import { setTimeout } from 'node:timers/promises';
import { join } from '../../src/util/path.ts';
import { cliPath, runtime } from '../helpers/exec.ts';
import { resolve } from '../helpers/resolve.ts';

test('CLI watch reloads JSON and imported plugin configuration', async t => {
  const cwd = await realpath(await mkdtemp(join(tmpdir(), 'knip-cli-watch-')));
  await writeFile(
    join(cwd, 'package.json'),
    '{"name":"cli-watch","devDependencies":{"vite":"*"},"scripts":{"check":"missing-command"}}'
  );
  await writeFile(join(cwd, 'settings.ts'), "export const include = ['index.ts'];\n");
  await writeFile(
    join(cwd, 'vite.config.ts'),
    "import { include } from './settings.ts'; export default { test: { include } };\n"
  );
  await writeFile(join(cwd, 'knip.json'), '{"entry":["index.ts"],"project":["*.ts"]}');
  await writeFile(join(cwd, 'index.ts'), "import { value } from './value.ts'; console.log(value);\n");
  await writeFile(join(cwd, 'value.ts'), 'export const value = 1;\nexport const originalUnused = 2;\n');
  await writeFile(join(cwd, 'unused.ts'), 'export {};\n');

  const child = spawn(runtime, [cliPath, '--watch', '--debug', '--directory', cwd, '--no-exit-code'], {
    cwd: resolve('.'),
    env: { ...process.env, NO_COLOR: '1', FORCE_COLOR: undefined },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let stdout = '';
  let stderr = '';
  let closed = false;
  child.stdout.on('data', chunk => {
    stdout += chunk.toString();
  });
  child.stderr.on('data', chunk => {
    stderr += chunk.toString();
  });
  const exited = new Promise<void>(resolve => {
    child.once('close', () => {
      closed = true;
      resolve();
    });
  });
  t.after(async () => {
    if (!closed) child.kill('SIGKILL');
    await exited;
    await rm(cwd, { recursive: true, force: true });
  });

  const getLastReport = () => {
    const reports = stdout.split(/\d+ files \([^)]*\)/);
    return reports.length > 1 ? reports[reports.length - 2] : '';
  };
  const waitForReport = async (predicate: (report: string) => boolean) => {
    const deadline = Date.now() + 10000;
    while (!predicate(getLastReport()) && Date.now() < deadline && !closed) await setTimeout(10);
    assert.ok(predicate(getLastReport()), `Expected CLI watch update\nstdout:\n${stdout}\nstderr:\n${stderr}`);
  };

  await waitForReport(report => report.includes('originalUnused') && report.includes('Unused files'));
  writeFileSync(join(cwd, 'value.ts'), 'export const value = 1;\nexport const changedUnused = 2;\n');
  await waitForReport(report => report.includes('changedUnused') && report.includes('missing-command'));

  writeFileSync(join(cwd, 'knip.json'), '{"entry":["index.ts"],"project":["*.ts"],"ignore":["value.ts"]}');
  await waitForReport(report => !report.includes('changedUnused') && report.includes('Unused files'));

  writeFileSync(join(cwd, 'settings.ts'), "export const include = ['unused.ts'];\n");
  await waitForReport(report => !report.includes('Unused files'));
  assert.equal(stderr, '');
});
