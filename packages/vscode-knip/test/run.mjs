import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runTests } from '@vscode/test-electron';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function main() {
  await runTests({
    extensionDevelopmentPath: resolve(__dirname, '..', 'dist'),
    extensionTestsPath: resolve(__dirname, 'index.mjs'),
    launchArgs: ['--disable-extensions'],
  });
}

main().catch(err => {
  console.error('Failed to run tests:', err);
  process.exit(1);
});
