# ✂️ Knip

Knip finds **unused files, dependencies and exports** in your JavaScript and TypeScript projects. Less code leads to
improved performance, less maintenance and easier refactorings.

```ts
export const myVar = true;
```

ESLint handles files in isolation, so the `export` keyword "blocks" further analysis. Unused files and dependencies will
also not be detected. You could think of Knip as going (far!) beyond the `no-unused-vars` rule of ESLint. Knip lints the
project as a whole (or parts of it).

It's only human to forget removing things that you no longer use. But how do you find out? Where to even start finding
things that can be removed?

The dots don't connect themselves. This is where Knip comes in:

- [x] Finds **unused files, dependencies and exports**.
- [x] Finds used dependencies not listed in `package.json`.
- [x] Finds duplicate exports.
- [x] Finds unused members of classes and enums
- [x] Built-in support for monorepos (workspaces)
- [x] Growing list of [built-in plugins][1]
- [x] Checks npm scripts for used and unlisted dependencies
- [x] Supports JavaScript (without `tsconfig.json`, or TypeScript `allowJs: true`).
- [x] Features multiple [reporters][2] and supports [custom reporters][3]
- [x] Run Knip as part of your CI environment to detect issues and prevent regressions.

Knip really shines in larger projects. A little bit of configuration will pay off, I promise. A comparison with similar
tools answers the question [why another unused file/dependency/export finder?][4]

Knip is a fresh take on keeping your projects clean & tidy!

[![An orange cow with scissors, Van Gogh style][6]][5] <sup>_“An orange cow with scissors, Van Gogh style” - generated
with OpenAI_</sup>

## Roadmap

Please report any false positives by [opening an issue in this repo][7]. Bonus points for adding a public repository or
opening a pull request with a directory and example files in `test/fixtures`. Correctness and bug fixes have priority
over new features:

### Upcoming Features

- [ ] Smart default configurations and more fine-grained configuration options.
- [ ] Fix issues: remove `export` keyword, uninstall unused dependencies, delete files (like `--fix` of ESLint).
- [ ] Add more reporters and report customization options (#3).

## Installation

    npm install -D knip

Knip supports LTS versions of Node.js, and currently requires at least Node.js v16.17 or v18.6. Knip is _cutting edge!_

## Usage

Create a configuration file, let's give it the default name `knip.json` with these contents:

```json
{
  "entryFiles": ["src/index.ts"],
  "projectFiles": ["src/**/*.ts"]
}
```

The `entryFiles` target the starting point(s) to resolve code dependencies. The `projectFiles` should contain all files
it should match them against, including potentially unused files.

Then run the checks:

    npx knip

This will analyze the project and output unused files, exports, types and duplicate exports.

## How It Works

Knip works by creating two sets of files:

1.  The set of files resolved from the `entryFiles`. In other words, the files that the entry files depend upon.
2.  The set of `projectFiles`.
3.  The project files that are part of entry files and its dependencies will be reported as unused files (in red).
4.  Then everything else (in blue) will be analyzed for unused exports and dependencies.

![How it works][8]

## Options

    ❯ npx knip
    knip [options]

    Options:
      -c/--config [file]     Configuration file path (default: ./knip.json, knip.jsonc or package.json#knip)
      -t/--tsConfig [file]   TypeScript configuration path (default: ./tsconfig.json)
      --production           Analyze only production source files (e.g. no tests, devDependencies, exported types)
      --strict               Consider only direct dependencies of workspaces. Not devDependencies, not ancestor workspaces.
      --workspace            Analyze a single workspace (default: analyze all configured workspaces)
      --include              Report only listed issue type(s), can be repeated
      --exclude              Exclude issue type(s) from report, can be repeated
      --no-progress          Don't show dynamic progress updates
      --no-exit-code         Always exit with code zero (0)
      --max-issues           Maximum number of issues before non-zero exit code (default: 0)
      --reporter             Select reporter: symbols, compact, codeowners, json (default: symbols)
      --reporter-options     Pass extra options to the reporter (as JSON string, see example)
      --debug                Show debug output
      --debug-level          Set verbosity of debug output (default: 1, max: 3)
      --performance          Measure running time of expensive functions and display stats table

    Issue types: files, dependencies, unlisted, exports, nsExports, classMembers, types, nsTypes, enumMembers, duplicates

    Examples:

    $ knip
    $ knip --production
    $ knip --workspace packages/client --include files
    $ knip -c ./knip.js --reporter compact
    $ knip --reporter codeowners --reporter-options '{"path":".github/CODEOWNERS"}'

    More info: https://github.com/webpro/knip

## Reading the report

After analyzing all the files resolved from the `entryFiles` against the `projectFiles`, the report contains the
following types of issues:

- `files` - Unused files: did not find references to this file
- Dependencies (`package.json`)
  - `dependencies` - Unused dependencies: did not find references to this dependency
  - `unlisted` - Unlisted dependencies: used dependencies, but not listed in package.json (1)
- Values (JavaScript)
  - `exports` - Unused exports: did not find references to this exported variable
  - `nsExports` - Unused exports in namespaces: did not find direct references to this exported variable (2)
  - `classMembers` - Unused class members: did not find references to this member of the exported class
- Types (TypeSscript)
  - `types` - Unused types: did not find references to this exported type
  - `nsTypes` - Unused types in namespaces: did not find direct references to this exported variable (2)
  - `enumMembers` - Unused enum members: did not find references to this member of the exported enum
- `duplicates` - Duplicate exports: the same thing is exported more than once

Notes:

1.  This includes dependencies that could not be resolved. For instance, what does `unresolved/dir/module` mean?
    - To target something in the (missing) `node_modules/unresolved` package?
    - Target a local module that should have a relative path?
    - It does not match any `paths` entry in `tsconfig.json#compilerOptions`.
2.  The variable or type is not referenced directly, and has become a member of a namespace. That's why Knip is not sure
    whether this export can be removed, so please look into it.

You can `--include` or `--exclude` any of the types to slice & dice the report to your needs. Alternatively, they can be
added to the configuration (e.g. `"exclude": ["dependencies"]`).

## Now what?

As always, make sure to backup files or use Git before deleting files or making changes. Run tests to verify results.

- Unused files can be removed.
- Unused dependencies can be removed from `package.json`.
- Unlisted dependencies should be added to `package.json`.
- Unused exports and types: remove the `export` keyword in front of unused exports. Then you (or tools such as
  TypeScript language services in VS Code and/or ESLint) can see whether the variable or type is used within the same
  file. If this is not the case, it can be removed.
- Duplicate exports can be removed to export only once, make sure to import that everywhere.

🔁 Repeat the process to reveal new unused files and exports. Sometimes it's so liberating to remove things!

## Performance

🚀 Knip finds issues of type `files`, `dependencies`, `unlisted` and `duplicates` very fast. Finding unused exports
requires deeper analysis (`exports`, `nsExports`, `classMembers`, `types`, `nsTypes`, `enumMembers`).

Use `--include` to report only specific issue types (the following example commands do the same):

    knip --include files --include dependencies
    knip --include files,dependencies

Use `--exclude` to ignore reports you're not interested in:

    knip --include files --exclude classMembers,enumMembers

Use `--performance` to see where most of the time is spent.

## Workspaces & Monorepos

Workspaces and monorepos are handled out-of-the-box by Knip. Every workspace that is part of the Knip configuration will
be part of the analysis. Here's a simple example:

```jsonc
{
  "ignoreFiles": "**/fixtures/**",
  "ignoreBinaries": ["deno", "git"],
  "ignoreWorkspaces": ["packages/ignore-me"],
  "workspaces": {
    "packages/*": {
      "entryFiles": "{index,cli}.ts!",
      "projectFiles": "**/*.ts"
    },
    "packages/exception": {
      "entryFiles": "something/different.js"
    },
    "not-a-workspace/in-package.json/but-has-package.json": {
      "entryFiles": ["src/index.ts"],
      "projectFiles": "src/**/*.ts"
    }
  }
}
```

All `workspaces` or `workspaces.packages` in `package.json` with a match in `workspaces` of `Knip.json` are part of the
analysis.

Extra "workspaces" not cnfigured as a workspace in the root `package.json` can be configured as well, Knip is happy to
analyze unused dependencies and exports from any directory with a `package.json`.

## Plugins

Knip contains a growing list of plugins:

- [Babel][9]
- [Capacitor][10]
- [Changesets][11]
- [Cypress][12]
- [ESLint][13]
- [Gatsby][14]
- [Jest][15]
- [Mocha][16]
- [Next.js][17]
- [Nx][18]
- [Playwright][19]
- [PostCSS][20]
- [Remark][21]
- [Remix][22]
- [Rollup][23]
- [Storybook][24]
- [Stryker][25]

Plugins are automatically activated, no need to enable anything. Each plugin is automatically enabled based on simple
heuristics. Most of them check whether one or one of a few (dev) dependencies are listed in `package.json`. Once
enabled, they add a set of configuration and/or entry files for Knip to analyze. These defaults can be overriden.

Most plugins use one or both of the following file types:

- `config` - custom dependency resolvers are applied to these files
- `entryFiles` - files to include with the analysis of the rest of the source code

Many configuration files use `require` or `import` statements to use dependencies, so they can be analyzed like the rest
of the source files. These configuration files are also `entryFiles`.

Many plugins also include `config` files. They are parsed by custom dependency resolvers.

- The `eslint` plugin tells Knip that an `"prettier"` entry in the array of plugins means that the
  `eslint-plugin-prettier` dependency should be installed.
- The `storybook` plugin understands that `core.builder: 'webpack5'` in `main.js` means that the
  `@storybook/builder-webpack5` and `@storybook/manager-webpack5` dependencies are required.
- Static configuration files such as JSON and YAML always require a custom dependency resolver.

The only thing that a custom dependency resolver function does is return all referenced dependencies for the
configuration files it is given.

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

The default mode for Knip is holistic and targets all project code. For instance test files usually import production
files. This prevents the production files or its exports from being reported as unused, while both of them can be
removed. This is why Knip has a production mode.

To analyze only production code, add an exclamation mark behind the patterns that are meant for production and use the
`--production` flag to analyze (only) them. Here's an example:

```json
{
  "entryFiles": ["build/script.js", "src/index.ts!"],
  "projectFiles": ["src/**/*.ts!"]
}
```

Configuration files, test files and build scripts should not be included. Knip looks for unused files, dependencies and
export values in production code only.

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

- [`json`][26]
- [`symbol`][27] (default)
- [`compact`][28]
- [`codeowners`][29]

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

The data can then be used to write issues to `stdout`, a JSON or CSV file, or sent to a service, anything really!

### JSON

The `json` reporter output is meant to be consumed by other tools. It reports in JSON format as an array with one object
per file like this:

```json
[
  {
    "file": "package.json",
    "owners": ["@org/admin"],
    "files": false,
    "dependencies": ["jquery", "moment"],
    "devDependencies": [],
    "unlisted": [],
    "exports": [],
    "types": [],
    "duplicates": []
  },
  {
    "file": "src/Registration.tsx",
    "owners": ["@org/owner"],
    "files": true,
    "dependencies": [],
    "devDependencies": [],
    "unlisted": ["react"],
    "exports": ["lowercaseFirstLetter", "RegistrationBox"],
    "types": ["RegistrationServices", "RegistrationAction"],
    "duplicates": ["Registration", "default"]
  }
]
```

The keys match the [known issue types][30].

#### Usage Ideas

Use tools like [miller][31] or [jtbl][32] to consume the JSON and render a table in the terminal.

##### Table

    $ npx knip --reporter json | mlr --ijson --opprint --no-auto-flatten cat
    file                  owners      files  unlisted  exports                                types                                     duplicates
    src/Registration.tsx  @org/owner  true   react     lowercaseFirstLetter, RegistrationBox  RegistrationServices, RegistrationAction  Registration, default
    src/ProductsList.tsx  @org/team   false  -         -                                      ProductDetail                             -

##### Markdown Table

    $ npx knip --reporter json | mlr --ijson --omd --no-auto-flatten cat
    | file | owners | files | duplicates |
    | --- | --- | --- | --- |
    | src/Registration.tsx | @org/owner | true | Registration, default |
    | src/ProductsList.tsx | @org/team | false |  |

Include specific issue types and/or replace the `cat` command with `put` for clean output:

    npx knip --include files,duplicates --reporter json | mlr --ijson --opprint --no-auto-flatten put 'for (e in $*) { if(is_array($[e])) { $[e] = joinv($[e], ", ") } }'
    npx knip --reporter json | mlr --ijson --omd --no-auto-flatten put 'for (e in $*) { if(is_array($[e])) { $[e] = joinv($[e], ", ") } }'

### More Output Examples

#### Symbol (default)

The default reporter shows the sorted symbols first:

    $ knip
    --- UNUSED FILES (2)
    src/chat/helpers.ts
    src/components/SideBar.tsx
    --- UNUSED DEPENDENCIES (1)
    moment
    --- UNLISTED DEPENDENCIES (1)
    react
    --- UNUSED EXPORTS (5)
    lowercaseFirstLetter  src/common/src/string/index.ts
    RegistrationBox       src/components/Registration.tsx
    clamp                 src/css.ts
    restoreSession        src/services/authentication.ts
    PREFIX                src/services/authentication.ts
    --- UNUSED TYPES (4)
    enum RegistrationServices  src/components/Registration/registrationMachine.ts
    type RegistrationAction    src/components/Registration/registrationMachine.ts
    type ComponentProps        src/components/Registration.tsx
    interface ProductDetail    src/types/Product.ts
    --- DUPLICATE EXPORTS (2)
    Registration, default  src/components/Registration.tsx
    ProductsList, default  src/components/Products.tsx

#### Compact

The compact reporter shows the sorted files first, and then a list of symbols:

    $ knip --reporter compact
    --- UNUSED FILES (2)
    src/chat/helpers.ts
    src/components/SideBar.tsx
    --- UNUSED DEPENDENCIES (1)
    moment
    --- UNLISTED DEPENDENCIES (1)
    react
    --- UNUSED EXPORTS (4)
    src/common/src/string/index.ts: lowercaseFirstLetter
    src/components/Registration.tsx: RegistrationBox
    src/css.ts: clamp
    src/services/authentication.ts: restoreSession, PREFIX
    --- UNUSED TYPES (3)
    src/components/Registration/registrationMachine.ts: RegistrationServices, RegistrationAction
    src/components/Registration.tsx: ComponentProps
    src/types/Product.ts: ProductDetail
    --- DUPLICATE EXPORTS (2)
    src/components/Registration.tsx: Registration, default
    src/components/Products.tsx: ProductsList, default

#### Code Owners

The `codeowners` reporter is like `compact`, but shows the sorted code owners (according to `.github/CODEOWNERS`) first:

    $ knip --reporter codeowners
    --- UNUSED FILES (2)
    @org/team src/chat/helpers.ts
    @org/owner src/components/SideBar.tsx
    --- UNUSED DEPENDENCIES (1)
    @org/admin moment
    --- UNLISTED DEPENDENCIES (1)
    @org/owner src/components/Registration.tsx react
    --- UNUSED EXPORTS (4)
    @org/team src/common/src/string/index.ts: lowercaseFirstLetter
    @org/owner src/components/Registration.tsx: RegistrationBox
    @org/owner src/css.ts: clamp
    @org/owner src/services/authentication.ts: restoreSession, PREFIX
    --- UNUSED TYPES (3)
    @org/owner src/components/Registration/registrationMachine.ts: RegistrationServices, RegistrationAction
    @org/owner src/components/Registration.tsx: ComponentProps
    @org/owner src/types/Product.ts: ProductDetail
    --- DUPLICATE EXPORTS (2)
    @org/owner src/components/Registration.tsx: Registration, default
    @org/owner src/components/Products.tsx: ProductsList, default

The owner of `package.json` is considered the owner of unused (dev) dependencies.

Use `--reporter-options '{"path":".github/CODEOWNERS"}'` to pass another location for the code owners file.

## Really, another unused file/dependency/export finder?

There are already some great packages available if you want to find unused dependencies OR unused exports.

Although I love the Unix philosophy, here I believe it's efficient to handle multiple concerns in a single tool. When
building a dependency graph of the project, an abstract syntax tree for each file, and traversing all of this, why not
collect the various issues in one go?

## Comparison

This table is a work in progress, but here's a first impression. Based on their docs (please report any mistakes):

| Feature                           | **knip** | [depcheck][33] | [unimported][34] | [ts-unused-exports][35] | [ts-prune][36] | [find-unused-exports][37] |
| :-------------------------------- | :------: | :------------: | :--------------: | :---------------------: | :------------: | :-----------------------: |
| Unused files                      |    ✅    |       -        |        ✅        |            -            |       -        |             -             |
| Unused dependencies               |    ✅    |       ✅       |        ✅        |            -            |       -        |             -             |
| Unlisted dependencies             |    ✅    |       ✅       |        ✅        |            -            |       -        |             -             |
| [Custom dependency resolvers][38] |    ✅    |       ✅       |        ❌        |            -            |       -        |             -             |
| Unused exports                    |    ✅    |       -        |        -         |           ✅            |       ✅       |            ✅             |
| Unused class members              |    ✅    |       -        |        -         |            -            |       -        |             -             |
| Unused enum members               |    ✅    |       -        |        -         |            -            |       -        |             -             |
| Duplicate exports                 |    ✅    |       -        |        -         |           ❌            |       ❌       |            ❌             |
| Search namespaces                 |    ✅    |       -        |        -         |           ✅            |       ❌       |            ❌             |
| Custom reporters                  |    ✅    |       -        |        -         |            -            |       -        |             -             |
| JavaScript support                |    ✅    |       ✅       |        ✅        |            -            |       -        |            ✅             |
| Configure entry files             |    ✅    |       ❌       |        ✅        |           ❌            |       ❌       |            ❌             |
| [Support monorepos][39]           |    ✅    |       -        |        -         |            -            |       -        |             -             |
| ESLint plugin available           |    -     |       -        |        -         |           ✅            |       -        |             -             |

✅ = Supported, ❌ = Not supported, - = Out of scope

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
[7]: https://github.com/webpro/knip/issues
[8]: ./assets/how-it-works.drawio.svg
[9]: ./src/plugins/babel
[10]: ./src/plugins/capacitor
[11]: ./src/plugins/changesets
[12]: ./src/plugins/cypress
[13]: ./src/plugins/eslint
[14]: ./src/plugins/gatsby
[15]: ./src/plugins/jest
[16]: ./src/plugins/mocha
[17]: ./src/plugins/next
[18]: ./src/plugins/nx
[19]: ./src/plugins/playwright
[20]: ./src/plugins/postcss
[21]: ./src/plugins/remark
[22]: ./src/plugins/remix
[23]: ./src/plugins/rollup
[24]: ./src/plugins/storybook
[25]: ./src/plugins/stryker
[26]: #json
[27]: #symbol-default
[28]: #compact
[29]: #code-owners
[30]: #reading-the-report
[31]: https://github.com/johnkerl/miller
[32]: https://github.com/kellyjonbrazil/jtbl
[33]: https://github.com/depcheck/depcheck
[34]: https://github.com/smeijer/unimported
[35]: https://github.com/pzavolinsky/ts-unused-exports
[36]: https://github.com/nadeesha/ts-prune
[37]: https://github.com/jaydenseric/find-unused-exports
[38]: #custom-dependency-resolvers
[39]: #monorepos-1
