# Prettier

## Enabled

This plugin is enabled when any of the following packages is in `dependencies` or `devDependencies`:

- prettier

## Default configuration

```json
{
  "prettier": {
    "config": [".prettierrc", ".prettierrc.{json,js,cjs,yml,yaml}", "prettier.config.{js,cjs}", "package.json"],
    "entry": [".prettierrc.{js,cjs}", "prettier.config.{js,cjs}"]
  }
}
```

Also see [Knip plugins](https://github.com/webpro/knip/blob/next/README.md#plugins) for more information about plugins.
