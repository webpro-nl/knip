---
title: TypeDoc
---

## Enabled

This plugin is enabled when there is match in `dependencies` or
`devDependencies`:

- `typedoc`

## Default configuration

```json title="knip.json"
{
  "typedoc": {
    "config": [
      "typedoc.{js,cjs,json,jsonc}",
      "typedoc.config.{js,cjs}",
      ".config/typedoc.{js,cjs,json,jsonc}",
      ".config/typedoc.config.{js,cjs}",
      "package.json",
      "tsconfig.json"
    ]
  }
}
```
