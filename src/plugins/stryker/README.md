# Stryker

## Enabled

This plugin is enabled when any of the following packages is in `dependencies` or `devDependencies`:

- @stryker-mutator/core

## Default configuration

```json
{
  "stryker": {
    "config": ["?(.)stryker.{conf,config}.{js,mjs,json}"]
  }
}
```
