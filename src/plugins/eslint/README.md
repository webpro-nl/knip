# ESLint

## Enabled

This plugin is enabled when any of the following packages is in `dependencies` or `devDependencies`:

- eslint

## Default configuration

```json
{
  "eslint": {
    "config": [".eslintrc", ".eslintrc.{js,json,cjs}", ".eslintrc.{yml,yaml}", "package.json"],
    "entry": ["eslint.config.js"]
  }
}
```

Also see [Knip plugins][1] for more information about plugins.

[1]: https://github.com/webpro/knip/blob/next/README.md#plugins
