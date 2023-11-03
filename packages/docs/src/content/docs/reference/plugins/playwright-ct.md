---
title: Playwright for components
---

## Enabled

This plugin is enabled when there is match in `dependencies` or
`devDependencies`:

- `^@playwright\/experimental-ct-`

## Default configuration

```json
{
  "playwright-ct": {
    "config": [
      "playwright-ct.config.{js,ts}",
      "playwright/index.{js,ts,jsx,tsx}"
    ],
    "entry": ["**/*.@(spec|test).?(c|m)[jt]s?(x)"]
  }
}
```
