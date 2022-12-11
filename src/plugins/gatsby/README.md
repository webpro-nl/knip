# Gatsby

## Enabled

This plugin is enabled when any of the following packages is in `dependencies` or `devDependencies`:

- gatsby
- gatsby-cli

## Default configuration

```json
{
  "gatsby": {
    "config": ["gatsby-{config,node}.{js,jsx,ts,tsx}"],
    "entry": [
      "gatsby-{browser,ssr}.{js,jsx,ts,tsx}",
      "src/api/**/*.{js,ts}",
      "src/pages/**/*.{js,jsx,ts,tsx}",
      "src/templates/**/*.{js,jsx,ts,tsx}",
      "src/html.{js,jsx,ts,tsx}"
    ]
  }
}
```
