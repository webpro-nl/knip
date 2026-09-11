import assert from 'node:assert/strict';
import test from 'node:test';
import { importsWithinScripts } from '../../src/compilers/compilers.ts';

const wrap = (script: string) => `<script lang="ts">\n${script}\n</script>`;

test('Import keyword inside strings is not treated as an import', () => {
  const source = wrap(`
  const note = 'this is important'
  import Inner from './Inner.svelte'
  `);

  assert.equal(importsWithinScripts(source, 'Widget.svelte'), "import Inner from './Inner.svelte'");
});

test('Standalone word "import" inside a string is not treated as an import', () => {
  const source = wrap(`
  const hint = "you can import your data here"
  import Widget from './Widget.svelte'
  `);

  assert.equal(importsWithinScripts(source, 'Widget.svelte'), "import Widget from './Widget.svelte'");
});

test('Import keyword inside an identifier is not treated as an import', () => {
  const source = wrap(`
  const importantValue = 1
  import Widget from './Widget.svelte'
  `);

  assert.equal(importsWithinScripts(source, 'Widget.svelte'), "import Widget from './Widget.svelte'");
});

test('Import keyword inside comments is not treated as an import', () => {
  const source = wrap(`
  /**
   * NEVER import from outside this directory
   */
  import Widget from './Widget.svelte'
  `);

  assert.equal(importsWithinScripts(source, 'Widget.svelte'), "import Widget from './Widget.svelte'");
});

test('Static import forms are still extracted', () => {
  const source = wrap(`
  import './side-effect.css'
  import { a, b } from './named'
  import * as ns from "./namespace"
  import type { T } from './types'
  export { a }
  `);

  assert.equal(
    importsWithinScripts(source, 'Widget.svelte'),
    [
      "import './side-effect.css'",
      "import { a, b } from './named'",
      'import * as ns from "./namespace"',
      "import type { T } from './types'",
    ].join(';\n')
  );
});

test('Dynamic imports are still extracted', () => {
  const source = wrap(`
  const load = () => import('./lazy.svelte')
  `);

  assert.equal(importsWithinScripts(source, 'Widget.svelte'), "import('./lazy.svelte')");
});
