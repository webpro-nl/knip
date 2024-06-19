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

In CI environments, the [--no-progress][1] flag is set automatically.

## Related features

- [--cache][2]
- [--max-issues][3]
- [--no-exit-code][4]
- [--reporter][5]

## Related reading

- [Why use Knip?][6]

[1]: ../reference/cli.md#--no-progress
[2]: ../reference/cli.md#--cache
[3]: ../reference/cli.md#--max-issues
[4]: ../reference/cli.md#--no-exit-code
[5]: ../reference/cli.md#--reporter-reporter
[6]: ../explanations/why-use-knip.md
