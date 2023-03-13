# Semantic Release

## Enabled

This plugin is enabled when any of the following package names and/or regular expressions has a match in `dependencies`
or `devDependencies`:

- `semantic-release`

## Default configuration

```json
{
  "semantic-release": {
    "config": [".releaserc", ".releaserc.{yaml,yml,json,js,cjs}", "release.config.{js,cjs}", "package.json"]
  }
}
```

Also see [Knip plugins][1] for more information about plugins.

[1]: https://github.com/webpro/knip/blob/main/README.md#plugins
