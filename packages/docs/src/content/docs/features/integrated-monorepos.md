---
title: Integrated Monorepos
sidebar:
  order: 3
---

Some repositories have a single `package.json`, but consist of multiple projects
with configuration files across the repository. A good example is the [Nx
integrated monorepo style][1].

:::tip

An integrated monorepo is a single workspace.

:::

## Entry Files

The default entrypoints files might not be enough. Here's an idea that might fit
this type of monorepo:

```json title="knip.json"
{
  "entry": ["{apps,libs}/**/src/index.{ts,tsx}"],
  "project": ["{apps,libs}/**/src/**/*.{ts,tsx}"]
}
```

## Plugins

Let's assume some of these projects are applications ("apps") which have their
own ESLint configuration files and Cypress configuration and test files. This
may result in those files getting reported as unused, and consequently also the
dependencies they import and refer to.

In that case, we could configure the ESLint and Cypress plugins like this:

```json title="knip.json"
{
  "eslint": {
    "config": ["{apps,libs}/**/.eslintrc.json"]
  },
  "cypress": {
    "entry": ["apps/**/cypress.config.ts", "apps/**/cypress/e2e/*.spec.ts"]
  }
}
```

Adapt the file patterns to your project, and the relevant `config` and `entry`
files and dependencies should no longer be reported as unused.

[1]: https://nx.dev/getting-started/tutorials/integrated-repo-tutorial
