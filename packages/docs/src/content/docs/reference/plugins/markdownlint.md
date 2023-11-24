---
title: markdownlint
---

## Enabled

This plugin is enabled when there is match in `dependencies` or
`devDependencies`:

- `markdownlint-cli`

## Default configuration

```json title="knip.json"
{
  "markdownlint": {
    "config": [".markdownlint.{json,jsonc}", ".markdownlint.{yml,yaml}"]
  }
}
```
