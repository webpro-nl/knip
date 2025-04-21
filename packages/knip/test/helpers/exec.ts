import { spawnSync } from 'node:child_process';
// biome-ignore lint/nursery/noRestrictedImports: ignore
import { resolve } from 'node:path';

const cliPath = resolve('bin/knip.js');

export const exec = (command: string, options: { cwd: string }) => {
  const args = command.replace(/^knip/, '').trim().split(' ').filter(Boolean);
  const output = spawnSync(cliPath, ['--directory', options.cwd, ...args], {
    cwd: options.cwd,
    env: {
      PATH: process.env.PATH,
    },
  });

  return {
    stdout: output.stdout.toString().trim(),
    stderr: output.stderr.toString().trim(),
    status: output.status,
  };
};
