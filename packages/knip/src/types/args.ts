import type { ParsedArgs } from 'minimist';

export type ConfigArg = boolean | (string | [string, (id: string) => string])[];

export type Args = {
  /**
   * Default executables for the dependency (e.g. typescript has `["tsc"]`)
   *
   * @default plugin name (e.g. eslint has `eslint` executable)
   */
  binaries?: string[];

  /**
   * Add first positional argument as entry point(s)
   *
   * @default undefined
   */
  positional?: boolean;

  /**
   * Mark arguments as string
   *
   * @default undefined
   */
  string?: string[];

  /**
   * Mark arguments as boolean
   *
   * @default undefined
   */
  boolean?: string[];

  /**
   * Define aliases (e.g. `{ require: ["r"] }`)
   * Using `nodeImportArgs: true` will set those automatically
   *
   * @default undefined
   */
  alias?: Record<string, string[]>;

  /**
   * Arguments to resolve to a dependency or entry file path.
   *
   * @example `resolve: ["plugin"]` for `program --plugin package`
   * @default undefined
   */
  resolve?: string[];

  /**
   * Resolve values for the following arguments: `-r --require --import --loader --experimental-loader --test-reporter`
   * Shorthand for `resolve` with `alias`
   *
   * @example nodeImportArgs: true
   * @default undefined
   */
  nodeImportArgs?: boolean;

  /**
   * Define arguments that contain config file path.
   * Usually you'll want to set aliases too. Use `true` for shorthand to set `alias` + `string` + `config`
   *
   * @example `config: ["p"]` for e.g. `tsc -p tsconfig.lib.json`
   *
   * @example `config: true` for e.g. `tsup --config tsup.client.json`
   *
   * @default undefined
   */
  config?: ConfigArg;

  /**
   * Modify or filter arguments before parsing.
   *
   * @default undefined
   */
  args?: (args: string[]) => string[];

  /**
   * Parse return value as script.
   * Can be a function that returns an array of string,
   * or an array of strings and those values will be parsed as scripts (recursion)
   *
   * @example fromArgs: ["exec"] and `nodemon --exec "node index.js"` to also parse `node index.js`
   *
   * @example fromArgs: (parsed: ParsedArgs, args: string[]) => argsFrom(args, parsed._[0]);
   *           and `dotenv KEY=value -- program index.js` to also parse script starting from first positional: `program index.js`
   *
   * @default undefined
   */
  fromArgs?: string[] | ((parsed: ParsedArgs, args: string[]) => string[]);
};
