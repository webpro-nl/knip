# ✂️ Knip

Knip finds **unused files, dependencies and exports** in your JavaScript and TypeScript projects. Less code and
dependencies leads to improved performance, less maintenance and easier refactorings.

```ts
export const myVar = true;
```

ESLint handles files in isolation, so it does not know whether `myVar` is actually used somewhere else. Knip lints the
project as a whole, and finds unused exports, files and dependencies

It's only human to forget removing things that you no longer use. But how do you find out? Where to even start finding
things that can be removed?

The dots don't connect themselves. This is where Knip comes in:

- [x] Finds **unused files, dependencies and exports**
- [x] Finds used dependencies not listed in `package.json`
- [x] Finds duplicate exports
- [x] Finds unused members of classes and enums
- [x] Built-in support for monorepos/workspaces
- [x] Growing list of [built-in plugins][1]
- [x] Checks npm scripts for used and unlisted dependencies
- [x] Supports JavaScript (without `tsconfig.json`, or TypeScript `allowJs: true`).
- [x] Features multiple [reporters][2] and supports [custom reporters][3]
- [x] Run Knip as part of your CI environment to detect issues and prevent regressions.

Knip shines in both small and large projects. A comparison with similar tools answers the question [why another unused
file/dependency/export finder?][4]

Knip is a fresh take on keeping your projects clean & tidy!

[![An orange cow with scissors, Van Gogh style][6]][5] <sup>_“An orange cow with scissors, Van Gogh style” - generated
with OpenAI_</sup>

## Migrating to v1.0.0

When coming from version v0.13.3 or before, here are the breaking changes:

- The `entryFiles` and `projectFiles` options have been renamed to `entry` and `project`.
- The `--dev` argument and `dev: true` option are gone, this is now the default mode (see [production mode][7]).
- Workspaces have been moved from the root of the config to the `workspaces` key (see [workspaces][8]).
- The `--dir` argument has been renamed to `--workspace`.

## Issues

Please report any false positives by [opening an issue in this repo][9]. Bonus points for linking to a public repository
using Knip, or even opening a pull request with a directory and example files in `test/fixtures`. Correctness and bug
fixes have priority over performance and new features.

## Installation

    npm install -D knip

Knip supports LTS versions of Node.js, and currently requires at least Node.js v16.17 or v18.6. Knip is _cutting edge!_

## Usage

Knip has good defaults and you can run it without any configuration, but especially larger projects get more out of Knip
with a configuration file (or a `knip` property in `package.json`). Let's name this file `knip.json` with these contents
(you might want to adjust right away for your project):

```json
{
  "$schema": "https://unpkg.com/knip@next/schema.json",
  "entry": ["src/index.ts"],
  "project": ["src/**/*.ts"]
}
```

The `entry` files target the starting point(s) to resolve the rest of the imported code. The `project` files should
contain all files to match against the files resolved from the entry files, including potentially unused files.

Then run the checks:

    npx knip

This will analyze the project and output unused files, dependencies and exports.

## Options

    $ npx knip --help
    knip [options]

    Options:
      -c/--config [file]       Configuration file path (default: knip.json, knip.jsonc or package.json#knip)
      -t/--tsConfig [file]     TypeScript configuration path (default: tsconfig.json)
      --production             Analyze only production source files (e.g. no tests, devDependencies, exported types)
      --strict                 Consider only direct dependencies of workspace (not devDependencies, not other workspaces)
      --workspace              Analyze a single workspace (default: analyze all configured workspaces)
      --include-entry-exports  Include unused exports in entry files (without `@public`)
      --ignore                 Ignore files matching this glob pattern, can be repeated
      --no-gitignore           Don't use .gitignore
      --include                Report only provided issue type(s), can be comma-separated or repeated (1)
      --exclude                Exclude provided issue type(s) from report, can be comma-separated or repeated (1)
      --no-progress            Don't show dynamic progress updates
      --reporter               Select reporter: symbols, compact, codeowners, json (default: symbols)
      --reporter-options       Pass extra options to the reporter (as JSON string, see example)
      --no-exit-code           Always exit with code zero (0)
      --max-issues             Maximum number of issues before non-zero exit code (default: 0)
      --debug                  Show debug output
      --debug-file-filter      Filter for files in debug output (regex as string)
      --performance            Measure running time of expensive functions and display stats table

    (1) Issue types: files, dependencies, unlisted, exports, nsExports, classMembers, types, nsTypes, enumMembers, duplicates

    Examples:

    $ knip
    $ knip --production
    $ knip --workspace packages/client --include files,dependencies
    $ knip -c ./config/knip.json --reporter compact
    $ knip --reporter codeowners --reporter-options '{"path":".github/CODEOWNERS"}'
    $ knip --debug --debug-file-filter '(specific|particular)-module'

    More info: https://github.com/webpro/knip

## Screenshots

Here's an example run using the default reporter:

<img src="./assets/screenshot-basic.png" alt="example output of dependencies" width="578">

This example shows more output related to unused and unlisted dependencies:

<img src="./assets/screenshot-dependencies.png" alt="example output of dependencies" width="578">

## Reading the report

The report contains the following types of issues:

- **Unused files**: did not find references to this file
- **Unused dependencies**: did not find references to this dependency
- **Unlisted or unresolved dependencies**: used dependencies, but not listed in package.json _(1)_
- **Unused exports**: did not find references to this exported variable
- **Unused exports in namespaces**: did not find direct references to this exported variable _(2)_
- **Unused exported types**: did not find references to this exported type
- **Unused exported types in namespaces**: did not find direct references to this exported variable _(2)_
- **Unused exported enum members**: did not find references to this member of the exported enum
- **Unused exported class members**: did not find references to this member of the exported class
- **Duplicate exports**: the same thing is exported more than once

You can `--include` or `--exclude` any of the types to slice & dice the report to your needs. Alternatively, they can be
added to the configuration (e.g. `"exclude": ["dependencies"]`). Knip finds issues of type `files`, `dependencies`,
`unlisted` and `duplicates` very fast. Finding unused exports requires deeper analysis (`exports`, `nsExports`,
`classMembers`, `types`, `nsTypes`, `enumMembers`).

Use `--include` to report only specific issue types (the following example commands do the same):

    knip --include files --include dependencies
    knip --include files,dependencies

Use `--exclude` to ignore reports you're not interested in:

    knip --include files --exclude classMembers,enumMembers

_(1)_ This includes dependencies that could not be resolved. For instance, what does `unresolved/dir/module` mean?

- It might target a missing `unresolved` package in `node_modules/unresolved`.
- It might incorrectly target a local module that should have a relative path.
- It does not match any `paths` entry in `tsconfig.json#compilerOptions`.

_(2)_ The variable or type is not referenced directly, and has become a member of a namespace. That's why Knip is not
sure whether this export can be removed, so please look into it.

## Now what?

This is the fun part! Knip, knip, knip ✂️

As always, make sure to backup files or use Git before deleting files or making changes. Run tests to verify results.

- Unused files can be removed.
- Unused dependencies can be removed from `package.json`.
- Unlisted dependencies should be added to `package.json`.
- Unused exports and types: remove the `export` keyword in front of unused exports. Then you can see whether the
  variable or type is used within the same file. If this is not the case, it can be removed.
- Duplicate exports can be removed so they're exported only once.

🔁 Repeat the process to reveal new unused files and exports. Sometimes it's so liberating to remove things!

## Workspaces & Monorepos

Workspaces and monorepos are handled out-of-the-box by Knip. Every workspace that is part of the Knip configuration will
be part of the analysis. Here's a simple example:

```jsonc
{
  "ignore": "**/fixtures/**",
  "ignoreBinaries": ["rm", "docker-compose"],
  "ignoreWorkspaces": ["packages/ignore-me"],
  "workspaces": {
    "packages/*": {
      "entry": "{index,cli}.ts!",
      "project": "**/*.ts"
    },
    "packages/exception": {
      "entry": "something/different.js"
    },
    "not-a-workspace/in-package.json/but-has-package.json": {
      "entry": ["src/index.ts"],
      "project": "src/**/*.ts"
    }
  }
}
```

All `workspaces` or `workspaces.packages` in `package.json` with a match in `workspaces` of `Knip.json` are part of the
analysis.

Extra "workspaces" not configured as a workspace in the root `package.json` can be configured as well, Knip is happy to
analyze unused dependencies and exports from any directory with a `package.json`.

Here's a small output example when running Knip in a workspace:

<img src="./assets/screenshot-workspaces.png" alt="example output in workspaces" width="578">

## Plugins

Knip contains a growing list of plugins:

- [Babel][10]
- [Capacitor][11]
- [Changesets][12]
- [commitlint][13]
- [Cypress][14]
- [ESLint][15]
- [Gatsby][16]
- [Jest][17]
- [Mocha][18]
- [Next.js][19]
- [Nx][20]
- [nyc][21]
- [Playwright][22]
- [PostCSS][23]
- [Prettier][24]
- [Remark][25]
- [Remix][26]
- [Rollup][27]
- [Sentry][28]
- [Storybook][29]
- [Stryker][30]
- [TypeScript][31]
- [Webpack][32]

Plugins are automatically activated, no need to enable anything. Each plugin is automatically enabled based on simple
heuristics. Most of them check whether one or one of a few (dev) dependencies are listed in `package.json`. Once
enabled, they add a set of configuration and/or entry files for Knip to analyze. These defaults can be overriden.

Most plugins use one or both of the following file types:

- `config` - custom dependency resolvers are applied to the [config files][33]
- `entry` - files to include with the analysis of the rest of the source code

### `config`

Plugins may include `config` files. They are parsed by custom dependency resolvers. Here are some examples to get an
idea of how they work and why they are needed:

- The `eslint` plugin tells Knip that the `"prettier"` entry in the array of `plugins` means that the
  `eslint-plugin-prettier` dependency should be installed. Or that the `"airbnb"` entry in `extends` requires the
  `eslint-config-airbnb` dependency.
- The `storybook` plugin understands that `core.builder: 'webpack5'` in `main.js` means that the
  `@storybook/builder-webpack5` and `@storybook/manager-webpack5` dependencies are required.
- Static configuration files such as JSON and YAML always require a custom dependency resolver.

Custom dependency resolvers return all referenced dependencies for the configuration files it is given. Knip handles the
rest to find which of those dependencies are unused or missing.

### `entry`

Other configuration files use `require` or `import` statements to use dependencies, so they can be analyzed like the
rest of the source files. These configuration files are also considered `entry` files.

## Configuration

### Libraries versus Applications

Libraries and applications are identical when it comes to files and dependencies: whatever is unused should be removed.
Yet libraries usually have exports meant to be used by other libraries or applications. Such public variables and types
in libraries can be marked with the JSDoc `@public` tag:

```js
/**
 * Merge two objects.
 *
 * @public
 */

export const merge = function () {};
```

Knip does not report public exports and types as unused.

### Production Mode

The default mode for Knip is holistic and targets all project code, including configuration files and tests. Test files
usually import production files. This prevents the production files or its exports from being reported as unused, while
sometimes both of them can be removed. This is why Knip has a "production mode".

To tell Knip what is production code, add an exclamation mark behind each `pattern!` that is meant for production and
use the `--production` flag. Here's an example:

```json
{
  "entry": ["src/index.ts!", "build/script.js"],
  "project": ["src/**/*.ts!", "build/*.js"]
}
```

#### Strict

Additionally, the `--strict` flag can be used to:

- Consider only `dependencies` (not `devDependencies`) when finding unused or unlisted dependencies.
- Assume each workspace is self-contained: they have their own `dependencies` (and not rely on packages of ancestor
  workspaces).

#### Plugins

Plugins also have this distinction. For instance, Next.js entry files for pages (`pages/**/*.tsx`) and Remix routes
(`app/routes/**/*.tsx`) are production code, while Jest and Playwright entry files (e.g. `*.spec.ts`) are not. All of
this is handled automatically by Knip and its plugins. You only need to point Knip to additional files or custom file
locations. The more plugins Knip will have, the more projects can be analyzed out of the box!

## Reporters

Knip provides the following built-in reporters:

- [`codeowners`][34]
- [`compact`][35]
- [`json`][36]
- [`symbol`][37] (default)

The `compact` reporter shows the sorted files first, and then a list of symbols:

<img src="./assets/screenshot-basic-compact.png" alt="example output of dependencies" width="578">

### Custom Reporters

When the provided built-in reporters are not quite sufficient, a custom reporter can be implemented.

Pass `--reporter ./my-reporter`, with the default export of that module having this interface:

```ts
type Reporter = (options: ReporterOptions) => void;

type ReporterOptions = {
  report: Report;
  issues: Issues;
  cwd: string;
  workingDir: string;
  isProduction: boolean;
  options: string;
};
```

The data can then be used to write issues to `stdout`, a JSON or CSV file, or sent to a service.

Find more details and ideas in [custom reporters][38].

## Really, another unused file/dependency/export finder?

There are already some great packages available if you want to find unused dependencies OR unused exports.

I love the Unix philosophy ("do one thing well"). But in this case I believe it's efficient to handle multiple concerns
in a single tool. When building a dependency graph of the project, an abstract syntax tree for each file, and traversing
all of this, why not collect the various issues in one go?

## Comparison

This table is an ongoing comparison. Based on their docs (please report any mistakes):

| Feature                            | **knip** | [depcheck][39] | [unimported][40] | [ts-unused-exports][41] | [ts-prune][42] | [find-unused-exports][43] |
| :--------------------------------- | :------: | :------------: | :--------------: | :---------------------: | :------------: | :-----------------------: |
| Unused files                       |    ✅    |       -        |        ✅        |            -            |       -        |             -             |
| Unused dependencies                |    ✅    |       ✅       |        ✅        |            -            |       -        |             -             |
| Unlisted dependencies              |    ✅    |       ✅       |        ✅        |            -            |       -        |             -             |
| [Custom dependency resolvers][44]  |    ✅    |       ✅       |        ❌        |            -            |       -        |             -             |
| Unused exports                     |    ✅    |       -        |        -         |           ✅            |       ✅       |            ✅             |
| Unused class members               |    ✅    |       -        |        -         |            -            |       -        |             -             |
| Unused enum members                |    ✅    |       -        |        -         |            -            |       -        |             -             |
| Duplicate exports                  |    ✅    |       -        |        -         |           ❌            |       ❌       |            ❌             |
| Search namespaces                  |    ✅    |       -        |        -         |           ✅            |       ❌       |            ❌             |
| Custom reporters                   |    ✅    |       -        |        -         |            -            |       -        |             -             |
| JavaScript support                 |    ✅    |       ✅       |        ✅        |            -            |       -        |            ✅             |
| Configure entry files              |    ✅    |       ❌       |        ✅        |           ❌            |       ❌       |            ❌             |
| [Support workspaces/monorepos][45] |    ✅    |       ❌       |        ❌        |            -            |       -        |             -             |
| ESLint plugin available            |    -     |       -        |        -         |           ✅            |       -        |             -             |

✅ = Supported, ❌ = Not supported, - = Out of scope

### Migrating from other tools

WIP

### depcheck

The following commands are similar:

    depcheck
    knip --include dependencies,unlisted

### unimported

The following commands are similar:

    unimported
    knip --production --include files,dependencies,unlisted

See [production mode][7].

## TypeScript language services

TypeScript language services could play a major role in most of the "unused" areas, as they have an overview of the
project as a whole. This powers things in VS Code like "Find references" or the "Module "./some" declares 'Thing'
locally, but it is not exported" message. I think features like "duplicate exports" or "custom dependency resolvers" are
userland territory, much like code linters.

## Knip?!

Knip is Dutch for a "cut". A Dutch expression is "to be ge**knip**t for something", which means to be perfectly suited
for the job. I'm motivated to make knip perfectly suited for the job of cutting projects to perfection! ✂️

[1]: #plugins
[2]: #reporters
[3]: #custom-reporters
[4]: #really-another-unused-filedependencyexport-finder
[5]: https://labs.openai.com/s/xZQACaLepaKya0PRUPtIN5dC
[6]: ./assets/cow-with-orange-scissors-van-gogh-style.webp
[7]: #production-mode
[8]: #workspaces--monorepos
[9]: https://github.com/webpro/knip/issues
[10]: ./src/plugins/babel
[11]: ./src/plugins/capacitor
[12]: ./src/plugins/changesets
[13]: ./src/plugins/commitlint
[14]: ./src/plugins/cypress
[15]: ./src/plugins/eslint
[16]: ./src/plugins/gatsby
[17]: ./src/plugins/jest
[18]: ./src/plugins/mocha
[19]: ./src/plugins/next
[20]: ./src/plugins/nx
[21]: ./src/plugins/nyc
[22]: ./src/plugins/playwright
[23]: ./src/plugins/postcss
[24]: ./src/plugins/prettier
[25]: ./src/plugins/remark
[26]: ./src/plugins/remix
[27]: ./src/plugins/rollup
[28]: ./src/plugins/sentry
[29]: ./src/plugins/storybook
[30]: ./src/plugins/stryker
[31]: ./src/plugins/typescript
[32]: ./src/plugins/webpack
[33]: #config
[34]: #code-owners
[35]: #compact
[36]: #json
[37]: #symbol-default
[38]: ./docs/custom-reporters.md
[39]: https://github.com/depcheck/depcheck
[40]: https://github.com/smeijer/unimported
[41]: https://github.com/pzavolinsky/ts-unused-exports
[42]: https://github.com/nadeesha/ts-prune
[43]: https://github.com/jaydenseric/find-unused-exports
[44]: #custom-dependency-resolvers
[45]: #workspaces--monorepos
