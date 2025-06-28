import { readFile } from 'node:fs/promises';
import module from 'node:module';

module.register('./transform-test.js', { parentURL: import.meta.url });

export async function load(url, context, next) {
  if (url.endsWith('.test.ts')) {
    const content = await readFile(new URL(url), 'utf8');
    const source = content.replace(/import { test } from 'bun:test';/, `import test from 'node:test';`);
    return next(url, { ...context, source });
  }
  return next(url, context);
}
