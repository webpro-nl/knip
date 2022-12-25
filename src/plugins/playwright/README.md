# Playwright

## Enabled

This plugin is enabled when any of the following packages is in `dependencies` or `devDependencies`:

- @playwright/test

## Default configuration

```json
{
  "playwright": {
    "entry": ["playwright.config.{js,ts}", ".*{test,spec}.{js,ts,mjs}"]
  }
}
```

Also see [Knip plugins](https://github.com/webpro/knip/blob/next/README.md#plugins) for more information about plugins.
