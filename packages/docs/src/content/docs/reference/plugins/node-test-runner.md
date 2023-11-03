---
title: Node.js Test Runner
---

## Enabled

This plugin is enabled when any script in `package.json` includes `node --test`

## Default configuration

```json
{
  "node-test-runner": {
    "entry": [
      "**/*{.,-,_}test.?(c|m)js",
      "**/test-*.?(c|m)js",
      "**/test.?(c|m)js",
      "**/test/**/*.?(c|m)js"
    ]
  }
}
```
