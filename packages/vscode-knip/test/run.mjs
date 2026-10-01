import { cpSync, mkdirSync, mkdtempSync, renameSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runTests } from '@vscode/test-electron';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function main() {
  const workspacePath = mkdtempSync(join(tmpdir(), 'vscode-knip-'));
  cpSync(resolve(__dirname, 'fixtures/version-bump'), workspacePath, { recursive: true });
  mkdirSync(join(workspacePath, 'node_modules'));
  renameSync(join(workspacePath, 'knip'), join(workspacePath, 'node_modules/knip'));

  try {
    await runTests({
      extensionDevelopmentPath: resolve(__dirname, '..', 'dist'),
      extensionTestsPath: resolve(__dirname, 'index.mjs'),
      launchArgs: [workspacePath, '--disable-extensions'],
    });
  } finally {
    rmSync(workspacePath, { recursive: true, force: true });
  }
}

main().catch(err => {
  console.error('Failed to run tests:', err);
  process.exit(1);
});
