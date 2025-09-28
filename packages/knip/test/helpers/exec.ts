import { spawnSync } from 'node:child_process';
// biome-ignore lint: style/noRestrictedImports
import { resolve } from 'node:path';

const runtime = process.argv[0];
const cliPath = runtime.endsWith('bun') ? resolve('src/cli.ts') : resolve('dist/cli.js');

export const exec = (command: string, options: { cwd: string }) => {
  const args = command.replace(/^knip/, '').trim().split(' ').filter(Boolean);
  const output = spawnSync(runtime, [cliPath, ...args], {
    cwd: options.cwd,
    env: {
      PATH: process.env.PATH,
      NO_COLOR: '1',
    },
  });

  return {
    stdout: output.stdout.toString().trim(),
    stderr: output.stderr.toString().trim(),
    status: output.status,
  };
};
