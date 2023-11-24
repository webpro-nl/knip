---
title: Babel
---

## Enabled

This plugin is enabled when there is match in `dependencies` or
`devDependencies`:

- `^@babel\/`

## Default configuration

```json title="knip.json"
{
  "babel": {
    "config": [
      "babel.config.{json,js,cjs,mjs,cts}",
      ".babelrc.{json,js,cjs,mjs,cts}",
      ".babelrc",
      "package.json"
    ]
  }
}
```
