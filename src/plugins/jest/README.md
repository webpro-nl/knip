# Jest

## Enabled

This plugin is enabled when any of the following packages is in `dependencies` or `devDependencies`:

- jest

## Default configuration

```json
{
  "jest": {
    "config": ["jest.config.{js,ts,mjs,cjs,json}"],
    "entry": ["**/__tests__/**/*.[jt]s?(x)", "**/?(*.)+(spec|test).[jt]s?(x)"]
  }
}
```

Also see [Knip plugins][1] for more information about plugins.

[1]: https://github.com/webpro/knip/blob/next/README.md#plugins
