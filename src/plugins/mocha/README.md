# Mocha

## Enabled

This plugin is enabled when any of the following packages is in `dependencies` or `devDependencies`:

- mocha

## Default configuration

```json
{
  "mocha": {
    "config": [".mocharc.{js,cjs}", ".mocharc.{json,jsonc}", "package.json"],
    "entryFiles": ["test/**/*.{js,cjs,mjs}"]
  }
}
```
