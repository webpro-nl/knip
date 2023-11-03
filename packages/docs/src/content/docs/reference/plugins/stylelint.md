---
title: Stylelint
---

## Enabled

This plugin is enabled when there is match in `dependencies` or
`devDependencies`:

- `stylelint`

## Default configuration

```json
{
  "stylelint": {
    "config": [
      ".stylelintrc",
      ".stylelintrc.{cjs,js,json,yaml,yml}",
      "stylelint.config.{cjs,mjs,js}"
    ]
  }
}
```
