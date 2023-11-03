---
title: lint-staged
---

## Enabled

This plugin is enabled when there is match in `dependencies` or
`devDependencies`:

- `lint-staged`

## Default configuration

```json
{
  "lint-staged": {
    "config": [
      ".lintstagedrc",
      ".lintstagedrc.json",
      ".lintstagedrc.{yml,yaml}",
      ".lintstagedrc.{js,mjs,cjs}",
      "lint-staged.config.{js,mjs,cjs}",
      "package.json"
    ]
  }
}
```
