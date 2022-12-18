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
