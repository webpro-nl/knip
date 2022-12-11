# Storybook

## Enabled

This plugin is enabled when any of the following packages is in `dependencies` or `devDependencies`:

- storybook

## Default configuration

```json
{
  "storybook": {
    "config": [".storybook/{main,manager}.{js,ts}"],
    "entry": [".storybook/preview.{js,jsx,ts,tsx}", "**/*.stories.{js,jsx,ts,tsx}"],
    "project": [".storybook/**/*.{js,ts,tsx}"]
  }
}
```
