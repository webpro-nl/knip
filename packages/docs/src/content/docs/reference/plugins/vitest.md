---
title: Vitest
---

## Enabled

This plugin is enabled when there is match in `dependencies` or
`devDependencies`:

- `vitest`

## Default configuration

```json title="knip.json"
{
  "vitest": {
    "config": ["vitest.config.ts", "vitest.{workspace,projects}.{ts,js,json}"],
    "entry": ["**/*.{test,spec}.?(c|m)[jt]s?(x)"]
  }
}
```
