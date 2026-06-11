import assert from 'node:assert/strict';
import test from 'node:test';
import SCSS from '../../src/compilers/scss.ts';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/compilers/scss');

test('SCSS compiler keeps package imports bare', () => {
  const input = `
@use "sass:map";
@use "@scope/pkg/styles";
@use "~@scope/pkg/mixins";
@use "~pkg/styles";
@use "@/styles/variables";
`;

  assert.equal(
    SCSS.compiler(input),
    [
      "import _$0 from '@scope/pkg/styles';",
      "import _$1 from '@scope/pkg/mixins';",
      "import _$2 from 'pkg/styles';",
      "import _$3 from '@/styles/variables.scss';",
      "import _$4 from '@/styles/_variables.scss';",
      "import _$5 from '@/styles/variables.sass';",
      "import _$6 from '@/styles/_variables.sass';",
    ].join('\n')
  );
});

test('Built-in compiler for SCSS', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert('unused.scss' in issues.files);
  assert(!('@fontsource/lato' in issues.dependencies));

  assert.deepEqual(counters, {
    ...baseCounters,
    devDependencies: 1,
    files: 1,
    processed: 16,
    total: 16,
  });
});
