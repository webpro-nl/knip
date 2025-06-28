---
title: JSDoc & TSDoc Tags
---

JSDoc or TSDoc tags can be used to make exceptions for unused or duplicate
exports.

Knip tries to minimize configuration and introduces no new syntax. That's why it
hooks into JSDoc and TSDoc tags.

:::caution

Adding tags or excluding a certain type of issues from the report is usually not
recommended. It hides issues, which is often a sign of code smell or ambiguity
and ends up harder to maintain. It's usually better to refactor the code (or
report an issue with Knip for false positives).

:::

JSDoc comments always start with `/**` (not `//`) and can be single or
multi-line.

## Tags

Use arbitrary [tags][1] to exclude or include tagged exports from the report.
Example:

```ts
/** @lintignore */
export const myUnusedExport = 1;

/** @lintignore */
import Unresolved from './generated/lib.js';
```

And then include (`+`) or exclude (`-`) these tagged exports from the report
like so:

```shell
knip --tags=-lintignore,-internal
```

Tags can also be [configured in `knip.json`][2].

## `@public`

By default, Knip reports unused exports in non-entry files.

Tag the export as `@public` and Knip will not report it.

Example:

```ts
/**
 * @public
 */
export const unusedFunction = () => {};
```

This tag can also be used to make exceptions in entry files when using
[--include-entry-exports][3].

[JSDoc: @public][4] and [TSDoc: @public][5]

## `@internal`

Internal exports are not meant for public consumption, but only for internal
usage such as tests. This means they would be reported in [production mode][6].

Mark the export with `@internal` and Knip will not report the export in
production mode.

Example:

```ts
/** @internal */
export const internalTestedFunction = () => {};
```

In general it's not recommended to expose and test implementation details, but
exceptions are possible. Those should not be reported as false positives, so
when using production mode you'll need to help Knip out by tagging them as
`@internal`.

[TSDoc: @internal][7]

## `@alias`

Knip reports duplicate exports. To prevent this, tag one of the exports as
`@alias`.

Example:

```ts
export const Component = () => {};

/** @alias */
export default Component;
```

An alternative solution is to use `--exclude duplicates` and exclude all
duplicates from being reported.

[JSDoc: @alias][8]

## `@beta`

Works identical to [`@public`][9]. Knip ignores other tags like `@alpha` and
`@experimental`.

[TSDoc: @beta][10]

[1]: ../reference/cli.md#--tags
[2]: ./configuration.md#tags
[3]: ./cli.md#--include-entry-exports
[4]: https://jsdoc.app/tags-public.html
[5]: https://tsdoc.org/pages/tags/public/
[6]: ../features/production-mode.md
[7]: https://tsdoc.org/pages/tags/internal/
[8]: https://jsdoc.app/tags-alias.html
[9]: #public
[10]: https://tsdoc.org/pages/tags/beta/
