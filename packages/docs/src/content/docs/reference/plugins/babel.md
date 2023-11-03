---
title: Babel
---

## Enabled

This plugin is enabled when there is match in `dependencies` or
`devDependencies`:

- `^@babel\/`

## Default configuration

```json
{
  "babel": {
    "config": [
      "babel.config.json",
      "babel.config.js",
      ".babelrc.json",
      ".babelrc.js",
      ".babelrc",
      "package.json"
    ]
  }
}
```
