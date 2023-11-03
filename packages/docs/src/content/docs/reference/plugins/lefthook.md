---
title: Lefthook
---

## Enabled

This plugin is enabled when there is match in `dependencies` or
`devDependencies`:

- `lefthook`

- `@arkweid/lefthook`

- `@evilmartians/lefthook`

## Default configuration

```json
{
  "lefthook": {
    "config": [
      "lefthook.yml",
      ".git/hooks/prepare-commit-msg",
      ".git/hooks/commit-msg",
      ".git/hooks/pre-{applypatch,commit,merge-commit,push,rebase,receive}",
      ".git/hooks/post-{checkout,commit,merge,rewrite}"
    ]
  }
}
```
