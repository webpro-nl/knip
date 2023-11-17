---
title: Playwright
---

## Enabled

This plugin is enabled when there is match in `dependencies` or
`devDependencies`:

- `@playwright/test`

## Default configuration

```json title="knip.json"
{
  "playwright": {
    "config": ["playwright.config.{js,ts}"],
    "entry": ["**/*.@(spec|test).?(c|m)[jt]s?(x)"]
  }
}
```
