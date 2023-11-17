---
title: Remix
---

## Enabled

This plugin is enabled when there is match in `dependencies` or
`devDependencies`:

- `^@remix-run\/`

## Default configuration

```json title="knip.json"
{
  "remix": {
    "entry": [
      "remix.config.js",
      "remix.init/index.js",
      "app/root.tsx",
      "app/entry.{client,server}.{js,jsx,ts,tsx}",
      "app/routes/**/*.{js,ts,tsx}",
      "server.{js,ts}"
    ]
  }
}
```
