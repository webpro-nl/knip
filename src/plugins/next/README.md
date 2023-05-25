# Next.js

## Enabled

This plugin is enabled when any of the following package names and/or regular expressions has a match in `dependencies`
or `devDependencies`:

- `next`

## Default configuration

```json
{
  "next": {
    "config": ["next.config.{js,ts}"],
    "entry": ["pages/**/*.{js,jsx,ts,tsx}", "src/pages/**/*.{js,jsx,ts,tsx}"]
  }
}
```

Also see [Knip plugins][1] for more information about plugins.

[1]: https://github.com/webpro/knip/blob/main/README.md#plugins
