import { readdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export async function run() {
  const results = { passed: 0, failed: 0 };

  for (const file of readdirSync(__dirname)) {
    if (!file.endsWith('.test.mjs')) continue;
    for (const [name, fn] of Object.entries(await import(resolve(__dirname, file)))) {
      if (typeof fn !== 'function') continue;
      try {
        await fn();
        console.log(`✓ ${name}`);
        results.passed++;
      } catch (err) {
        console.error(`✗ ${name}:`, err.message);
        results.failed++;
      }
    }
  }

  console.log(`\n${results.passed} passed, ${results.failed} failed`);
  if (results.failed) throw new Error(`${results.failed} tests failed`);
}
