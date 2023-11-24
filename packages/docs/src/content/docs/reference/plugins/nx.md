---
title: Nx
---

## Enabled

This plugin is enabled when there is match in `dependencies` or
`devDependencies`:

- `nx`

- `^@nrwl\/`

- `^@nx\/`

## Default configuration

```json title="knip.json"
{
  "nx": {
    "config": ["project.json", "{apps,libs}/**/project.json"]
  }
}
```
