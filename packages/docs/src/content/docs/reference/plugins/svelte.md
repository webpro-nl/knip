---
title: Svelte
---

## Enabled

This plugin is enabled when there is match in `dependencies` or
`devDependencies`:

- `svelte`

## Default configuration

```json
{
  "svelte": {
    "entry": [
      "svelte.config.js",
      "vite.config.ts",
      "src/routes/**/+{page,server,page.server,error,layout,layout.server}{,@*}.{js,ts,svelte}"
    ],
    "project": ["src/**/*.{js,ts,svelte}"]
  }
}
```
