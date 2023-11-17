---
title: commitlint
---

## Enabled

This plugin is enabled when there is match in `dependencies` or
`devDependencies`:

- `@commitlint/cli`

## Default configuration

```json title="knip.json"
{
  "commitlint": {
    "config": [
      ".commitlintrc",
      ".commitlintrc.{json,yaml,yml,js,cjs,ts,cts}",
      "commitlint.config.{js,cjs,ts,cts}",
      "package.json"
    ]
  }
}
```
