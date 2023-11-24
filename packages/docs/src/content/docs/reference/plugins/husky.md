---
title: husky
---

## Enabled

This plugin is enabled when there is match in `dependencies` or
`devDependencies`:

- `husky`

## Default configuration

```json title="knip.json"
{
  "husky": {
    "config": [
      ".husky/prepare-commit-msg",
      ".husky/commit-msg",
      ".husky/pre-{applypatch,commit,merge-commit,push,rebase,receive}",
      ".husky/post-{checkout,commit,merge,rewrite}"
    ]
  }
}
```
