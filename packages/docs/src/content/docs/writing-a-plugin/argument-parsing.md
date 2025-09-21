---
title: Argument Parsing
sidebar:
  order: 3
---

Some plugins have an `arg` object in their implementation. It's a way for
plugins to customize how command-line arguments are parsed for their tool's
executables. Argument parsing in plugins help Knip identify dependencies and
entry files from scripts.

Knip uses [minimist](https://www.npmjs.com/package/minimist) for argument
parsing and some options are identical ([alias](#alias), [boolean](#boolean),
[string](#string)).

Also see [type definitions][7] and [examples in existing plugins][8].

### alias

Define aliases.

Example:

```ts
{
  require: ['r'];
}
```

Also see [nodeImportArgs](#nodeimportargs).

### args

Modify or filter arguments before parsing. For edge cases preprocessing is
useful, e.g. if minimist has trouble parsing or to modify/discard arguments.

Example:

```ts
{
  args: (args: string[]) => args.filter(arg => arg !== 'omit');
}
```

### binaries

Executables for the dependency.

Example:

```ts
{
  binaries: ['tsc'];
}
```

Default: plugin name, e.g. for the ESLint plugin the value is `["eslint"]`

### boolean

Mark arguments as boolean. By default, arguments are expected to have string
values.

### config

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

### fromArgs

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

### nodeImportArgs

Set to `true` as a shorthand for this [alias](#alias):

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

### positional

Set to `true` to use the first positional argument as an entry point.

Example:

```ts
{
  positional: true;
}
```

The `tsx` plugin has this and `"tsx script.ts"` as a script will result in the
`script.ts` file being an entry point.

### resolve

List of arguments to resolve to a dependency or entry file path.

Example:

```ts
{
  resolve: ['plugin'];
}
```

Now for a script like `"program --plugin package"` this will result in
`"package"` being resolved as a dependency.

### string

Mark arguments as string. This is the default, but number-looking arguments are
returned as numbers by minimist.

[7]: https://github.com/webpro-nl/knip/blob/main/packages/knip/src/types/args.ts
[8]:
  https://github.com/search?q=repo%3Awebpro-nl%2Fknip++path%3Apackages%2Fknip%2Fsrc%2Fplugins+%22const+args+%3D%22&type=code
