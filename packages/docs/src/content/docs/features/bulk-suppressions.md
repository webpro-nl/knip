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

- Use `--suppressions-location <path>` for a custom file path.
- Use existing [scope flags][3] like `--include`, `--exports` and `--workspace`
  to filter suppressions.

## Managing suppressions

Only `--suppress-all` and `--prune-suppressions` write to the suppressions file.
A regular `knip` run never touches it: the file is committed, and reading your
code should not change it.

When you fix an issue (or delete the code), its entry no longer applies. Knip
says so, and `knip --prune-suppressions` removes them:

```
Suppressions file is out of date: 3 suppressions no longer apply. Run `knip --prune-suppressions` to update it.
```

A prune only removes what the run analyzed. Under a [scope flag][3] such as
`--workspace` or `--exports`, or a `--config` that covers part of the project,
entries outside that scope are left untouched, so a run never discards
suppressions it knows nothing about. This also means several passes with
different configuration files can share one suppressions file. Entries for files
that no longer exist are always pruned.

### Tackling suppressed issues

To reveal a subset of suppressed issues, combine `--no-suppressions` with one or
more [scope flags][3] like `--include`, `--exports` or `--workspace`:

```sh
knip --no-suppressions --exports
```

This shows all suppressed export issues so you can fix them incrementally. After
fixing, run `knip --prune-suppressions` to drop the entries you no longer need.

## CI

To ensure that new issues are caught (not suppressed) and the suppressions file
is up-to-date (no unused entries):

```sh
knip --check-suppressions
```

New issues are reported as usual, and so are suppressions that no longer apply.
Either one exits non-zero, and nothing is written. Run `knip
--prune-suppressions` locally and commit the result along with the fixed issues.

## Editors and agents

The editor extension, language server and [MCP server][4] all apply the same
suppressions file, and hand back the suppressed issues separately from the live
ones. Only the CLI writes to the suppressions file.

The [JSON reporter][5] carries the same split, in a `suppressed` array beside
`issues`, which is the easiest way to track how much is left per file, per issue
type or per workspace.

## Custom fields

Knip preserves fields it does not recognize, so you can annotate entries with a
ticket, an owner or a date and they survive `--suppress-all` and
`--prune-suppressions`. Knip attaches no meaning to them.

A [preprocessor][6] can. This one reports an entry again once its `until` date
has passed, by moving it out of `suppressedIssues` and back into the report,
which also makes the run fail:

```js title="expire-suppressions.js"
import { readFileSync } from 'node:fs';

const today = new Date().toISOString().slice(0, 10);

export default options => {
  const { suppressions } = JSON.parse(
    readFileSync('.knip-suppressions.json', 'utf8')
  );
  for (const [file, byType] of Object.entries(suppressions)) {
    for (const [type, entries] of Object.entries(byType)) {
      for (const [symbol, meta] of Object.entries(entries)) {
        if (!meta.until || meta.until > today) continue;
        const issue = options.suppressedIssues?.[type]?.[file]?.[symbol];
        if (!issue) continue;
        options.issues[type][file] ??= {};
        options.issues[type][file][symbol] = issue;
        delete options.suppressedIssues[type][file][symbol];
        options.counters[type]++;
        options.suppressedCount--;
      }
    }
  }
  return options;
};
```

```sh
knip --preprocessor ./expire-suppressions.js
```

The same shape works for anything else you want to encode: escalate entries
older than a quarter, fail only on entries owned by your team, and so on.

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
external file. See [JSDoc Tags][7] for details.

That said, additional fields in the JSON file are preserved.

## Suppressions vs. ignore patterns

Use `ignore*` items for false positives (i.e. when Knip is wrong), use
suppressions for actual issues you want to fix later.

Remember that [ignore][8] patterns are nearly always a bad idea. They might hurt
performance and hide issues that you do want to know about. [Exclude the file
from analysis][9], use a more specific `ignore*` pattern to get rid of a false
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
        "src/old-module.ts": {}
      }
    },
    "src/utils/helpers.ts": {
      "exports": {
        "formatDate": {},
        "parseQuery": { "ticket": "ABC-123" }
      }
    }
  }
}
```

[1]: ./production-mode.md
[2]: ./production-mode.md#strict-mode
[3]: ../reference/cli.md#scope
[4]: ../reference/integrations.md
[5]: ./reporters.md#json
[6]: ./reporters.md#preprocessors
[7]: ../reference/jsdoc-tsdoc-tags.md
[8]: ../reference/configuration.md#ignore
[9]: ../guides/configuring-project-files.md
