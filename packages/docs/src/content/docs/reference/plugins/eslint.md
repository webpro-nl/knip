---
title: ESLint
---

## Enabled

This plugin is enabled when there is match in `dependencies` or
`devDependencies`:

- `eslint`

## Default configuration

```json
{
  "eslint": {
    "config": [
      "eslint.config.js",
      ".eslintrc",
      ".eslintrc.{js,json,cjs}",
      ".eslintrc.{yml,yaml}",
      "package.json"
    ]
  }
}
```
