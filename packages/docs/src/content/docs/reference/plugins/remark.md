---
title: Remark
---

## Enabled

This plugin is enabled when there is match in `dependencies` or
`devDependencies`:

- `remark-cli`

## Default configuration

```json title="knip.json"
{
  "remark": {
    "config": [
      "package.json",
      ".remarkrc",
      ".remarkrc.json",
      ".remarkrc.{js,cjs,mjs}",
      ".remarkrc.{yml,yaml}"
    ]
  }
}
```
