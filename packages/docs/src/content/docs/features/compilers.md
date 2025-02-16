---
title: Compilers
---

Projects may have source files that are not JavaScript or TypeScript, and thus
require compilation (or transpilation, or pre-processing, you name it). Files
like `.mdx`, `.astro`, `.vue` and `.svelte` may also import other source files
and external dependencies. So ideally, these files are included when linting the
project. That's why Knip supports compilers.

## Built-in compilers

Knip has built-in "compilers" for the following file extensions:

- `.astro`
- `.mdx`
- `.svelte`
- `.vue`

Knip does not include real compilers for those files, but regular expressions to
collect `import` statements. This is fast, requires no dependencies, and enough
for Knip to build the module graph.

On the other hand, real compilers may expose their own challenges in the context
of Knip. For instance, the Svelte compiler keeps `exports` intact, while they
might represent component properties. This results in those exports being
reported as unused by Knip.

The built-in functions seem to do a decent job, but override them however you
like.

## Custom compilers

Built-in compilers can be overridden, and additional compilers can be added.
Since compilers are functions, the Knip configuration file must be a dynamic
`.js` or `.ts` file.

### Interface

The compiler function interface is straightforward. Text in, text out:

```ts
(source: string, filename: string) => string;
```

This may also be an `async` function.

:::tip[Note]

Compilers will automatically have their extension added as a default extension
to Knip. This means you don't need to add something like `**/*.{ts,vue}` to the
`entry` or `project` file patterns manually.

:::

### Svelte

In a project with Svelte, the compiler is automatically enabled, but you may
have unresolved imports starting with `$app/`:

```shell
Unresolved imports (5)
$app/stores       src/routes/Header.svelte:1:9
$app/environment  src/routes/about/+page.ts:1:9
```

In this case, you can manually add the `$app` path alias:

```json title="knip.json"
{
  "paths": {
    "$app/*": ["node_modules/@sveltejs/kit/src/runtime/app/*"]
  }
}
```

As a last resort, see [ignoredUnresolved][1] to ignore virtual import specifiers
from the report.

### CSS

Here's an example, minimal compiler for CSS files:

```ts title="knip.ts"
export default {
  compilers: {
    css: (text: string) => [...text.matchAll(/(?<=@)import[^;]+/g)].join('\n'),
  },
};
```

You may wonder why the CSS compiler is not included by default. It's currently
not clear if it should be included. And if so, what would be the best way to
determine it should be enabled, and what syntax(es) it should support.

### Vue

In a project with Vue, the compiler is automatically enabled. Override and use
Vue's parser for better results if the built-in "compiler" is not enough:

```ts
import type { KnipConfig } from 'knip';
import {
  parse,
  type SFCScriptBlock,
  type SFCStyleBlock,
} from 'vue/compiler-sfc';

function getScriptBlockContent(block: SFCScriptBlock | null): string[] {
  if (!block) return [];
  if (block.src) return [`import '${block.src}'`];
  return [block.content];
}

function getStyleBlockContent(block: SFCStyleBlock | null): string[] {
  if (!block) return [];
  if (block.src) return [`@import '${block.src}';`];
  return [block.content];
}

function getStyleImports(content: string): string {
  return [...content.matchAll(/(?<=@)import[^;]+/g)].join('\n');
}

const config = {
  compilers: {
    vue: (text: string, filename: string) => {
      const { descriptor } = parse(text, { filename, sourceMap: false });
      return [
        ...getScriptBlockContent(descriptor.script),
        ...getScriptBlockContent(descriptor.scriptSetup),
        ...descriptor.styles.flatMap(getStyleBlockContent).map(getStyleImports),
      ].join('\n');
    },
  },
} satisfies KnipConfig;

export default config;
```

[1]: ../reference/configuration.md#ignoreunresolved
