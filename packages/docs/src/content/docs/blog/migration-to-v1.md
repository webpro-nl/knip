---
title: Migration to v1
---

_2023-01-04_

When coming from version v0.13.3 or before, there are some breaking changes:

- The `entryFiles` and `projectFiles` options have been renamed to `entry` and
  `project`.
- The `--dev` argument and `dev: true` option are gone, this is now the default
  mode (see [production mode][1]).
- Workspaces have been moved from the root of the config to the `workspaces` key
  (see [workspaces][2]).
- The `--dir` argument has been renamed to `--workspace`.

## Example

A configuration like this in v0.13.3 or before...

```json
{
  "entryFiles": ["src/index.ts"],
  "projectFiles": ["src/**/*.ts", "!**/*.spec.ts"],
  "dev": {
    "entryFiles": ["src/index.ts", "src/**/*.spec.ts", "src/**/*.e2e.ts"],
    "projectFiles": ["src/**/*.ts"]
  }
}
```

...should become this for v1...

```json
{
  "entry": ["src/index.ts!"],
  "project": ["src/**/*.ts!"]
}
```

Much cleaner, right? For some more details:

- The `dev` property for the `--dev` flag is now the default mode.
- Use `--production` to analyze only the `entry` and `project` files suffixed
  with `!`.
- The glob patterns for both types of test files (`*.spec.ts` and `*.e2e.ts`)
  are no longer needed:
  - Regular test files like `*.test.js` and `*.spec.ts` etc. are automatically
    handled by Knip.
  - The `*.e2e.ts` files is configured with the Cypress or other plugin. Note
    that Cypress uses `*.cy.ts` for spec files, but this could be overridden
    like so:

```json
{
  "entry": "src/index.ts!",
  "project": "src/**/*.ts!",
  "cypress": {
    "entry": "src/**/*.e2e.ts"
  }
}
```

[1]: ../features/production-mode.md
[2]: ../features/monorepos-and-workspaces.md
