# Mocha

## Enabled

This plugin is enabled when any of the following packages is in `dependencies` or `devDependencies`:

- mocha

## Default configuration

```json
{
  "mocha": {
    "config": [".mocharc.{js,cjs,json,jsonc,yml,yaml}", "package.json"],
    "entry": ["test/**/*.{js,cjs,mjs}"]
  }
}
```
