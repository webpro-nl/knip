---
title: Using Knip in CI
---

Knip is your companion during local development. But it is even more valuable in
a continuous integration (CI) environment to prevent regressions over time. Knip
will notify you of unused dependencies, exports and files if you forgot to
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
    name: Ubuntu/Node v24
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 24
      - name: Install dependencies
        run: npm install --ignore-scripts
      - name: Run knip
        run: npm run knip
```

## Notes

- Use [--cache][1] to speed up consecutive runs (default location:
  `./node_modules/.cache/knip`).
- See [Reporters][2] including the GitHub Actions reporter.
- Consider running Knip twice: a default run and a [production mode][3] run.
- See [CLI arguments → Output][4] for some relevant options such as
  `--treat-config-hints-as-errors` and `--no-exit-code`.
- In CI environments, the [--no-progress][5] flag is set automatically.

[1]: ../reference/cli.md#--cache
[2]: ../features/reporters.md
[3]: ../features/production-mode.md
[4]: ../reference/cli.md#output
[5]: ../reference/cli.md#--no-progress
