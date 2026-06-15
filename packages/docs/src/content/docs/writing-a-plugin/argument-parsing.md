---
title: Argument Parsing
description: Reference for a Knip plugin `arg` object to parse a tool's command-line arguments and find dependencies and entry files in scripts.
---

Some plugins have an `arg` object in their implementation. It's a way for
plugins to customize how command-line arguments are parsed for their tool's
executables. Argument parsing in plugins help Knip identify dependencies and
entry files from scripts.

Knip parses these arguments with a built-in parser. The options below customize
how a tool's scripts are parsed.

Also see [type definitions][1] and [examples in existing plugins][2].

- [alias][3]
- [args][4]
- [binaries][5]
- [boolean][6]
- [config][7]
- [fromArgs][8]
- [nodeImportArgs][9]
- [positional][10]
- [resolve][11]
- [resolveInputs][12]
- [string][13]

## alias

Define aliases.

Example:

```ts
{
  require: ['r'];
}
```

Also see [nodeImportArgs][9].

## args

Modify or filter arguments before parsing. For edge cases preprocessing is
useful, e.g. if the parser has trouble parsing or to modify/discard arguments.

Example:

```ts
{
  args: (args: string[]) => args.filter(arg => arg !== 'omit');
}
```

## binaries

Executables for the dependency.

Example:

```ts
{
  binaries: ['tsc'];
}
```

Default: plugin name, e.g. for the ESLint plugin the value is `["eslint"]`

## boolean

Mark arguments as boolean. By default, arguments are expected to have string
values.

## config

Define arguments that contain the configuration file path. Usually you'll want
to set aliases too. Use `true` for shorthand to set `alias` + `string` +
`config`.

Example:

```ts
{
  config: true;
}
```

The `tsup` plugin has this. Now `tsup --config tsup.client.json` will have
`tsup.client.json` go through `resolveConfig` (also `-c` alias).

Example:

```ts
{
  config: ['p'];
}
```

This will mark e.g. `tsc -p tsconfig.lib.json` as a configuration file and it
will be handled by `resolveConfig` of the (typescript) plugin.

## fromArgs

Parse return value as a new script. Can be a an array of strings, or function
that returns an array of strings and those values will be parsed separately.

Example:

```ts
{
  fromArgs: ['exec'];
}
```

Then this script:

```sh
nodemon --exec "node index.js"
```

Will have `"node index.js"` being parsed as a new script.

## nodeImportArgs

Set to `true` as a shorthand for this [alias][3]:

```ts
{
  import: ['r', 'experimental-loader', 'require', 'loader']
}
```

Example:

```ts
{
  nodeImportArgs: true;
}
```

## positional

Set to `true` to use the first positional argument as an entry point.

Example:

```ts
{
  positional: true;
}
```

The `tsx` plugin has this and `"tsx script.ts"` as a script will result in the
`script.ts` file being an entry point.

## resolve

List of arguments to resolve to a dependency or entry file path.

Example:

```ts
{
  resolve: ['plugin'];
}
```

Now for a script like `"program --plugin package"` this will result in
`"package"` being resolved as a dependency.

## resolveInputs

Return inputs from parsed arguments

```ts
{
  resolveInputs: (parsed: ParsedArgs) =>
    parsed['flag'] ? [toDependency('package')] : [];
}
```

## string

Mark arguments as string. This is the default, but number-looking arguments are
returned as numbers.

[1]: https://github.com/webpro-nl/knip/blob/main/packages/knip/src/types/args.ts
[2]: https://github.com/search?q=repo%3Awebpro-nl%2Fknip++path%3Apackages%2Fknip%2Fsrc%2Fplugins+%22const+args+%3D%22&type=code
[3]: #alias
[4]: #args
[5]: #binaries
[6]: #boolean
[7]: #config
[8]: #fromargs
[9]: #nodeimportargs
[10]: #positional
[11]: #resolve
[12]: #resolveinputs
[13]: #string
