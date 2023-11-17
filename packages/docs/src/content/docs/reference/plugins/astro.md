---
title: Astro
---

## Enabled

This plugin is enabled when there is match in `dependencies` or
`devDependencies`:

- `astro`

## Default configuration

```json title="knip.json"
{
  "astro": {
    "entry": [
      "astro.config.{js,cjs,mjs,ts}",
      "src/content/config.ts",
      "src/pages/**/*.{astro,mdx,js,ts}",
      "src/content/**/*.mdx"
    ]
  }
}
```
