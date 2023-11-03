---
title: Semantic Release
---

## Enabled

This plugin is enabled when there is match in `dependencies` or
`devDependencies`:

- `semantic-release`

## Default configuration

```json
{
  "semantic-release": {
    "config": [
      ".releaserc",
      ".releaserc.{yaml,yml,json,js,cjs}",
      "release.config.{js,cjs}",
      "package.json"
    ]
  }
}
```
