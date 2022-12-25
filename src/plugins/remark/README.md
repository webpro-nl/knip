# Remark

## Enabled

This plugin is enabled when any of the following packages is in `dependencies` or `devDependencies`:

- remark-cli

## Default configuration

```json
{
  "remark": {
    "config": ["package.json", ".remarkrc", ".remarkrc.json", ".remarkrc.{js,cjs,mjs}", ".remarkrc.{yml,yaml}"]
  }
}
```

Also see [Knip plugins](https://github.com/webpro/knip/blob/next/README.md#plugins) for more information about plugins.
