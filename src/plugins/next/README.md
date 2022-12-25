# Next.js

## Enabled

This plugin is enabled when any of the following packages is in `dependencies` or `devDependencies`:

- next

## Default configuration

```json
{
  "next": {
    "config": ["next.config.{js,ts}"],
    "entry": ["pages/**/*.{js,jsx,ts,tsx}", "src/pages/**/*.{js,jsx,ts,tsx}"]
  }
}
```

Also see [Knip plugins](https://github.com/webpro/knip/blob/next/README.md#plugins) for more information about plugins.
