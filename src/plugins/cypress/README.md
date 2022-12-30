# Cypress

## Enabled

This plugin is enabled when any of the following packages is in `dependencies` or `devDependencies`:

- cypress

## Default configuration

```json
{
  "cypress": {
    "entry": [
      "cypress.config.{js,ts,mjs,cjs}",
      "cypress/support/e2e.{js,jsx,ts,tsx}",
      "cypress/e2e/**/*.cy.{js,jsx,ts,tsx}"
    ]
  }
}
```

Also see [Knip plugins][1] for more information about plugins.

[1]: https://github.com/webpro/knip/blob/next/README.md#plugins
