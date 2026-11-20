# Script and argument parsing

Read this when changing or reviewing script discovery, command forwarding,
`Plugin.args`, or the shared argument parser. Knip needs to discover what real
projects use; matching every syntax a CLI accepts is not the goal.

## Start with real scripts

- Start with a script from a real project's manifest, config, or CI. Record its
  source and tool version, and reproduce the missed or incorrectly credited
  dependency or entry on main.
- Run that tool version and inspect its source. Native acceptance establishes
  validity, not practical need. Synthetic cases can isolate demonstrated
  failures; invented syntax combinations do not justify extra logic or a merge
  blocker by themselves.
- Preserve common usage across versions. Modeling an obscure newer grammar can
  break widely used older forms. Check whether the existing parser covers
  observed usage before adding special cases.

## Use the existing parsing layers

Put tool-specific behavior in [Plugin.args][1]. Core owns shell parsing,
argument parsing, recursive discovery, and module resolution. Don't walk
`manifest.scripts` manually or branch on a tool in shared code.

Prefer declarative options and existing hooks and helpers. Add a scanner or
second parse only for a real script they cannot handle. Pass commands from tool
configs, with their cwd, to `options.getInputsFromScripts`. See the [argument
types][2] and [shared plugin handling][3] for the contracts.

## Keep shell text and argv distinct

A `fromArgs` function returns argument values or shell text. Preserve what the
tool executes:

- For forwarded argv, return the selected values; core retains matching original
  words and quoting.
- For a shell-script operand, return the original string. Don't invent argument
  boundaries with `split(' ')` or a regex. Join arguments into shell text only
  when the tool itself does.
- Establish which command owns each `--` and where option parsing stops.
  Preserve child arguments and environment assignments that affect discovery.

## Test the discovery contract

Test the sourced script and a few controls, asserting literal inputs and items
that must remain unused. Compare wrapped commands with the same child command
run directly. Confirm the regression test fails without the fix.

Run the focused tests from `packages/knip`:

```sh
bun test test/util/get-inputs-from-scripts.test.ts test/util/scripts.test.ts
```

For shared parsing changes, check dependency discovery and `getScriptCommands`,
and compare results on representative real scripts before and after. Follow
[TESTS.md][4] for fixtures and broader checks.

[1]: ../packages/docs/src/content/docs/writing-a-plugin/argument-parsing.md
[2]: ../packages/knip/src/types/args.ts
[3]: ../packages/knip/src/binaries/plugins.ts
[4]: ./TESTS.md
