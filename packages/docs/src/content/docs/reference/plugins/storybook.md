---
title: Storybook
---

## Enabled

This plugin is enabled when there is match in `dependencies` or
`devDependencies`:

- `^@storybook\/`

- `@nrwl/storybook`

## Default configuration

```json
{
  "storybook": {
    "config": [".storybook/{main,test-runner}.{js,ts}"],
    "entry": [
      ".storybook/{manager,preview}.{js,jsx,ts,tsx}",
      "**/*.@(mdx|stories.@(mdx|js|jsx|mjs|ts|tsx))"
    ],
    "project": [".storybook/**/*.{js,jsx,ts,tsx}"]
  }
}
```
