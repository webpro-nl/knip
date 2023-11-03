---
title: Integrated Monorepos
sidebar:
  order: 3
---

Some repositories have a single `package.json`, but consist of multiple projects
with configuration files across the repository. A good example is the [Nx
integrated monorepo style][1].

Let's assume some of these projects are applications ("apps") which have their
own ESLint configuration files and Cypress configuration and test files. This
may result in a those files reported as unused, and consequently also the
dependencies the ESLint and Cypress plugins would find (such as ESLint or
Cypress plugins).

In that case, we could configure the ESLint and Cypress plugins like this:

```json
{
  "eslint": {
    "config": ["**/.eslintrc.json"]
  },
  "cypress": {
    "entry": ["apps/**/cypress.config.ts", "apps/**/cypress/e2e/*.spec.ts"]
  }
}
```

Adapt the file patterns to your project and the relevant configuration and entry
files and dependencies should no longer be reported as unused.

[1]: https://nx.dev/getting-started/tutorials/integrated-repo-tutorial
