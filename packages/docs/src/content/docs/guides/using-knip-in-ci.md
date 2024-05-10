---
title: Using Knip in CI
---

Knip is your companion during local development. But it is even more valuable in
a continuous integration (CI) environment to prevent regressions over time. Knip
will notify you of unused files, dependencies and exports if you forgot to
remove them.

Knip will exit the process with code `1` if there are one or more issues.

## GitHub Actions

Here's an example workflow configuration for GitHub Actions:

```yaml
name: Lint project

on: push

jobs:
  lint:
    runs-on: ubuntu-latest
    name: Ubuntu/Node v20
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - name: Install dependencies
        run: npm install --ignore-scripts
      - name: Run knip
        run: npm run knip
```

## Notes

In CI environments, the [--no-progress](../reference/cli.md#--no-progress) flag
is set automatically.

## Related features

- [--cache](../reference/cli.md#--cache)
- [--max-issues](../reference/cli.md#--max-issues)
- [--no-exit-code](../reference/cli.md#--no-exit-code)
- [--reporter](../reference/cli.md#--reporter-reporter)

## Related reading

- [Why use Knip?](../explanations/why-use-knip.md)
