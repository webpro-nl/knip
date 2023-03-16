# Compilers

Projects may have source files that are not JavaScript or TypeScript, and thus require compilation (or transpilation, or
pre-processing, you name it). Files like `.mdx`, `.vue` and `.svelte` may also import dependencies and other files. So
ideally, these files are included in the analysis to get a better overview of what files and dependencies are used or
not. To this end, Knip v2 supports a compiler for any file extension.

## Prerequisites

The Knip config needs to be in a `.js` or `.ts` file (not `.json`), since compilers are functions.

## Interface

The compiler function interface is straightforward. Text in, text out:

```ts
(source: string) => string;
```

This may also be an `async` function.

## Examples

### MDX

Here's an example using [@mdx-js/mdx][1] v1.6.22

```ts
const compile = require('@mdx-js/mdx');

module.exports = {
  entry: ['src/index.ts', '**/*.stories.mdx'],
  project: 'src/*.{ts,mdx}',
  compilers: {
    mdx: compile,
  },
};
```

## Vue

Here's a fully configured `knip.ts` with a "compiler" for `.vue` files in Vue projects:

```ts
const compiler = /<script\b[^>]*>([\s\S]*?)<\/script>/gm;

export default {
  ignore: '*.d.ts',
  entry: ['src/main.ts', 'vite.config.ts'],
  project: '**/*.{ts,vue}',
  compilers: {
    vue: text => {
      const scripts = [];
      let match;
      while ((match = compiler.exec(text))) scripts.push(match[1]);
      return scripts.join(';');
    },
  },
};
```

This is tested on a project generated using `npm init vue@latest`. Note that this is not a real compiler, but in many
cases it's enough to extract and return only the `import` statements.

### Svelte

Here's another example, this one is for Svelte:

```ts
import sveltePreprocess from 'svelte-preprocess';
import { preprocess, compile } from 'svelte/compiler';

const sveltePreprocessor = sveltePreprocess();

export default {
  ignore: ['**/*.d.ts'],
  paths: {
    // This ain't pretty, but Svelte basically does the same
    '$app/*': ['node_modules/@sveltejs/kit/src/runtime/app/*'],
  },
  compilers: {
    svelte: async (text: string) => {
      const processed = await preprocess(text, sveltePreprocessor, { filename: 'dummy.ts' });
      const compiled = compile(processed.code);
      return compiled.js.code;
    },
    css: (text: string) => [...text.matchAll(/(?<=@)import[^;]+/g)].join('\n'),
  },
};
```

The compiler for `.svelte` files in this example is the actual Svelte compiler, this is the recommended way whenever
available. Knip has a [Svelte plugin][2] to save you little bit of configuration. It's enabled automatically, so there's
nothing to configure.

Just for reference, this also seems to work pretty well (but may err on certain syntax or edge cases):

```ts
export default {
  svelte: (text: string) => [...text.matchAll(/import[^;]+/g)].join('\n'),
  css: (text: string) => [...text.matchAll(/(?<=@)import[^;]+/g)].join('\n'),
};
```

[1]: https://www.npmjs.com/package/@mdx-js/mdx
[2]: ../src/plugins/svelte
