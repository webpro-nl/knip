# Sentry

## Enabled

This plugin is enabled when any of the following packages is in `dependencies` or `devDependencies`:

- @sentry/replay

## Default configuration

```json
{
  "sentry": {
    "entry": ["sentry.{client,server}.config.{js,ts}"]
  }
}
```

Also see [Knip plugins][1] for more information about plugins.

[1]: https://github.com/webpro/knip/blob/next/README.md#plugins
