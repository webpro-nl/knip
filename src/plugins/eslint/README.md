# ESLint

## Enabled

This plugin is enabled when any of the following packages is in `dependencies` or `devDependencies`:

- eslint

## Default configuration

```json
{
  "eslint": {
    "config": [".eslintrc", ".eslintrc.{js,json}", "package.json"],
    "entryFiles": ["eslint.config.js"]
  }
}
```

Note that the `config` files represent the current way to configure ESLint, while `eslint.config.js` in `entryFiles`
represents the new way. The latter is more explicit and expects things like parsers and plugins to be referenced
directly, which requires such dependencies to be imported first. This means Knip can handle such configuration files as
regular source code entry files.
