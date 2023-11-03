---
title: GitHub Actions
---

## Enabled

This plugin is enabled when a `.yml` or `.yaml` file is found in the
`.github/workflows` folder.

## Default configuration

```json
{
  "github-actions": {
    "config": [".github/workflows/*.{yml,yaml}", ".github/**/action.{yml,yaml}"]
  }
}
```
