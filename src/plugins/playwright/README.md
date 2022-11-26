# Playwright

## Enabled

This plugin is enabled when any of the following packages is in `dependencies` or `devDependencies`:

- @playwright/test

## Default configuration

```json
{
  "playwright": {
    "entryFiles": ["playwright.config.{js,ts}", ".*{test,spec}.{js,ts,mjs}"]
  }
}
```
