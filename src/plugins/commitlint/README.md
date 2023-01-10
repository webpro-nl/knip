# commitlint

## Enabled

This plugin is enabled when any of the following package names and/or regular expressions has a match in `dependencies`
or `devDependencies`:

- `@commitlint/cli`

## Default configuration

```json
{
  "commitlint": {
    "config": ["commitlint.config.{js,ts}"]
  }
}
```

Also see [Knip plugins][1] for more information about plugins.

[1]: https://github.com/webpro/knip/blob/next/README.md#plugins
