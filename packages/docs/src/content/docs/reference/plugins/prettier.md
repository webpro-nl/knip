---
title: Prettier
---

## Enabled

This plugin is enabled when there is match in `dependencies` or
`devDependencies`:

- `prettier`

## Default configuration

```json
{
  "prettier": {
    "config": [
      ".prettierrc",
      ".prettierrc.{json,js,cjs,mjs,yml,yaml}",
      "prettier.config.{js,cjs,mjs}",
      "package.json"
    ]
  }
}
```
