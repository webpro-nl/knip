---
title: Cypress
---

## Enabled

This plugin is enabled when there is match in `dependencies` or
`devDependencies`:

- `cypress`

## Default configuration

```json title="knip.json"
{
  "cypress": {
    "config": ["cypress.config.{js,ts,mjs,cjs}"],
    "entry": [
      "cypress/e2e/**/*.cy.{js,jsx,ts,tsx}",
      "cypress/support/e2e.{js,jsx,ts,tsx}",
      "cypress/plugins/index.js"
    ]
  }
}
```
