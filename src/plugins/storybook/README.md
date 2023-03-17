# Storybook

## Enabled

This plugin is enabled when any of the following package names and/or regular expressions has a match in `dependencies`
or `devDependencies`:

- `/^@storybook\//`
- `@nrwl/storybook`

## Default configuration

```json
{
  "storybook": {
    "config": [".storybook/{main,manager}.{js,ts}"],
    "entry": [".storybook/preview.{js,jsx,ts,tsx}", "**/*.stories.{js,jsx,ts,tsx}"],
    "project": [".storybook/**/*.{js,jsx,ts,tsx}"]
  }
}
```

Also see [Knip plugins][1] for more information about plugins.

[1]: https://github.com/webpro/knip/blob/main/README.md#plugins
