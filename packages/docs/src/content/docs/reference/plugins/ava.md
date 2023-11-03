---
title: Ava
---

## Enabled

This plugin is enabled when there is match in `dependencies` or
`devDependencies`:

- `ava`

## Default configuration

```json
{
  "ava": {
    "config": ["ava.config.{js,cjs,mjs}", "package.json"],
    "entry": [
      "test.{js,cjs,mjs,ts}",
      "{src,source}/test.{js,cjs,mjs,ts}",
      "**/__tests__/**/*.{js,cjs,mjs,ts}",
      "**/*.spec.{js,cjs,mjs,ts}",
      "**/*.test.{js,cjs,mjs,ts}",
      "**/test-*.{js,cjs,mjs,ts}",
      "**/test/**/*.{js,cjs,mjs,ts}",
      "**/tests/**/*.{js,cjs,mjs,ts}",
      "!**/__tests__/**/__{helper,fixture}?(s)__/**/*",
      "!**/test?(s)/**/{helper,fixture}?(s)/**/*"
    ]
  }
}
```
