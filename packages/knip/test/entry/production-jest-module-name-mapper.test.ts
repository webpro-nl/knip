import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import test from 'node:test';
import { main } from '../../src/index.ts';
import { join } from '../../src/util/path.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';

test('Keep production file in graph when a Jest moduleNameMapper also targets it', async () => {
  const cwd = realpathSync(mkdtempSync(join(tmpdir(), 'knip-prod-jest-mapper-')));
  try {
    mkdirSync(join(cwd, 'src/lib'), { recursive: true });
    writeFileSync(
      join(cwd, 'package.json'),
      JSON.stringify({
        name: 'knip-repro',
        version: '1.0.0',
        private: true,
        devDependencies: { jest: '^30.0.0' },
        jest: { moduleNameMapper: { '^@lib$': '<rootDir>/src/lib' } },
      })
    );
    writeFileSync(
      join(cwd, 'tsconfig.json'),
      JSON.stringify({
        compilerOptions: {
          strict: true,
          module: 'esnext',
          moduleResolution: 'bundler',
          paths: { '@lib': ['./src/lib'] },
        },
        include: ['src/**/*'],
      })
    );
    writeFileSync(join(cwd, 'knip.json'), JSON.stringify({ entry: ['src/main.ts!'], project: ['src/**/*.ts!'] }));
    writeFileSync(join(cwd, 'src/main.ts'), 'import { greet } from "@lib";\nconsole.log(greet());\n');
    writeFileSync(
      join(cwd, 'src/lib/index.ts'),
      'import { NAME } from "./name";\nexport function greet(): string {\n  return NAME;\n}\n'
    );
    writeFileSync(join(cwd, 'src/lib/name.ts'), 'export const NAME = "world";\n');

    const options = await createOptions({ cwd, isProduction: true });
    const { issues, counters } = await main(options);

    assert.deepEqual(issues.exports, {});
    assert.deepEqual(issues.files, {});
    assert.deepEqual(counters, { ...baseCounters, processed: 3, total: 3 });
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});
