---
title: Stryker
---

## Enabled

This plugin is enabled when there is match in `dependencies` or
`devDependencies`:

- `@stryker-mutator/core`

## Default configuration

```json
{
  "stryker": {
    "config": ["?(.)stryker.{conf,config}.{js,mjs,cjs,json}"]
  }
}
```
