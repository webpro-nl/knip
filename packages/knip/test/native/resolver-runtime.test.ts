import { execFileSync } from 'node:child_process';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const worker = fileURLToPath(new URL('./resolver-runtime-worker.mjs', import.meta.url));

test('Production resolver plan includes host-supported prefix-only builtins absent from legacy catalogs', () => {
  execFileSync(process.execPath, [worker, 'builtins'], { stdio: 'pipe' });
});

test('Production resolver plan excludes prefix-only candidates unsupported by the host', () => {
  execFileSync(process.execPath, [worker, 'builtins-disabled'], { stdio: 'pipe' });
});

test('Discarded native resolver wrappers, debug callbacks, and worker pools are collected', () => {
  execFileSync(process.execPath, ['--expose-gc', worker, 'gc'], { stdio: 'pipe', timeout: 30000 });
});
