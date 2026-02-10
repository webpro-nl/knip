---
title: Bulk Suppressions
---

Knip supports a suppression system to ignore reported issues. This is useful
when introducing Knip to a large, existing codebase, or when you want to
temporarily ignore specific issues.

Suppressions are not yet supported in [production][1]/[strict][2] mode.

## Generating suppressions

To suppress all currently reported issues, run:

```sh
knip --suppress-all
```

This creates a `.knip-suppressions.json` file in the project root. This file
acts as a baseline: it snapshots usage issues so you can focus on new issues, or
burn down the existing ones at your own pace.

Flags:

- Use `--suppress-until <date>` to add an expiry date (`YYYY-MM-DD`) to new
  suppressions.
- Use `--suppressions-location <path>` for a custom file path.
- Use existing [scope flags][3] like `--include`, `--exports` and `--workspace`
  to filter suppressions.

## Managing suppressions

Stale suppressions are pruned automatically on every `knip` run. When you fix an
issue (or delete the code), the corresponding entry will be automatically
removed from the file.

### Tackling suppressed issues

To reveal a subset of suppressed issues, combine `--no-suppressions` with one or
more [scope flags][3] like `--include`, `--exports` or `--workspace`:

```sh
knip --no-suppressions --exports
```

This shows all suppressed export issues so you can fix them incrementally. After
fixing, just run `knip` to update the suppressions file automatically.

### Expiry

Use the `--suppress-until` argument, or manually add an `until` field to any
suppression in the JSON file:

```json
"src/feature-flagged.ts": {
  "exports": {
    "deprecatedHelper": {"until":"2026-02-16"}
  }
}
```

After this date, the suppression is ignored, and Knip will report the issue
again. This might help with planning, temporary workarounds and migration
processes.

## CI

To ensure that new issues are caught (not suppressed) and the suppressions file
is up-to-date (no unused entries):

```sh
knip --check-suppressions
```

This exits non-zero if the suppression file has changed (i.e. if suppressions
were auto-pruned or added). This enforces suppression file updates committed
along with fixed issues.

## Suppressions vs. JSDoc tags

The suppressions file is intended for bulk-ignoring existing issues when
introducing Knip to a codebase. For individual cases where you want to document
_why_ something is kept, prefer JSDoc tags like `@lintignore`, `@internal` or
`@public` directly in the code:

```ts
/** @lintignore Exported but unused for reasons */
export function formatDate() {}
```

Tags live next to the code, carry context naturally, and don't rely on an
external file. See [JSDoc Tags][4] for details.

That said, additional fields in the JSON file are preserved.

## Suppressions vs. ignore patterns

Use `ignore*` items for false positives (i.e. when Knip is wrong), use
suppressions for actual issues you want to fix later.

Remember that [ignore][5] patterns are nearly always a bad idea. They might hurt
performance and hide issues that you do want to know about. [Exclude the file
from analysis][6], use a more specific `ignore*` pattern to get rid of a false
positive, or suppress a specific issue temporarily.

## Suppressions file

The `.knip-suppressions.json` file is human-readable and git-friendly. Sorted
keys and one line per item:

```json title=".knip-suppressions.json"
{
  "version": 1,
  "suppressions": {
    "packages/ui/package.json": {
      "dependencies": {
        "lodash": {}
      }
    },
    "src/old-module.ts": {
      "files": {
        "src/old-module.ts": {"until":"2026-02-16"}
      }
    },
    "src/utils/helpers.ts": {
      "exports": {
        "formatDate": {},
        "parseQuery": {"until":"2026-02-16"}
      }
    }
  }
}
```

[1]: ./production-mode.md
[2]: ./production-mode.md#strict-mode
[3]: ../reference/cli#scope
[4]: ../reference/jsdoc-tsdoc-tags.md
[5]: ../reference/configuration.md#ignore
[6]: ../guides/configuring-project-files.md
