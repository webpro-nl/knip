# Next.js

## Enabled

This plugin is enabled when any of the following package names and/or regular expressions has a match in `dependencies`
or `devDependencies`:

- `next`

## Default configuration

```json
{
  "next": {
    "entry": [
      "next.config.{js,ts,cjs,mjs}",
      "{app,pages}/**/*.{js,jsx,ts,tsx}",
      "src/{app,pages}/**/*.{js,jsx,ts,tsx}",
      "middleware.{js,ts}",
      "src/middleware.{js,ts}",
      "instrumentation.{js,ts}",
      "src/instrumentation.{js,ts}"
    ]
  }
}
```

Also see [Knip plugins][1] for more information about plugins.

[1]: https://github.com/webpro/knip/blob/main/README.md#plugins
