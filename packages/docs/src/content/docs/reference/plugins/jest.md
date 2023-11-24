---
title: Jest
---

## Enabled

This plugin is enabled when there is match in `dependencies` or
`devDependencies`:

- `jest`

## Default configuration

```json title="knip.json"
{
  "jest": {
    "config": ["jest.config.{js,ts,mjs,cjs,json}", "package.json"],
    "entry": ["**/__tests__/**/*.[jt]s?(x)", "**/?(*.)+(spec|test).[jt]s?(x)"]
  }
}
```
