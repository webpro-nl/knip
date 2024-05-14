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

Note that "compilers" is quoted, as they are not real compilers, but regular
expressions to collect `import` statements from files with those extensions.
This allows Knip to build the dependency graph.

On the other hand, real compilers may expose their own challenges in the context
of Knip. For instance, the Svelte compiler keeps `exports` intact, while they
might represent component properties. This results in those exports being
reported as unused by Knip.

In short, the built-in functions seem to do a decent job, but you can override
them however you like.

## Custom compilers

Additional custom compilers can be added, and built-in compilers can be
overridden. Since compilers are functions, the Knip configuration file must be a
dynamic `.js` or `.ts` file.

### Interface

The compiler function interface is straightforward. Text in, text out:

```ts
(source: string, filename: string) => string;
```

This may also be an `async` function.

:::tip[Note]

Compilers will automatically have their extension added as a default extension
to Knip. This means you don't need to add something like `**/*.{ts,css}` to the
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
