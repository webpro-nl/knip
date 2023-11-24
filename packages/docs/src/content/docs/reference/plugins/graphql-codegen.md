---
title: GraphQL Codegen
---

## Enabled

This plugin is enabled when there is match in `dependencies` or
`devDependencies`:

- `^@graphql-codegen\/`

## Default configuration

```json title="knip.json"
{
  "graphql-codegen": {
    "config": [
      "codegen.{json,yml,yaml,js,ts,mjs,cts}",
      ".codegenrc.{json,yml,yaml,js,ts}",
      "codegen.config.js",
      "package.json"
    ]
  }
}
```
