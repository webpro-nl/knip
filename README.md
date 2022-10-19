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
- [x] Finds dependencies not listed in `package.json`.
- [x] Verifies that exported symbols are actually used in other files, even when part of an imported namespace.
- [x] Supports JavaScript inside TypeScript projects (`"allowJs": true`).
- [x] Finds duplicate exports of the same symbol.
- [x] Supports JavaScript ES Module-based projects without a `tsconfig.json`.
- [x] Features multiple [reporters][1] and supports [custom reporters][2].

Knip really shines in larger projects. A little bit of configuration will pay off, I promise. A comparison with similar
tools answers the question [why another unused file/dependency/export finder?][3]

Knip is a fresh take on keeping your projects clean & tidy!

[![An orange cow with scissors, Van Gogh style][5]][4] <sup>_“An orange cow with scissors, Van Gogh style” - generated
with OpenAI_</sup>

## Installation

    npm install -D knip

Knip supports LTS versions of Node.js, and currently requires at least Node.js v16.17 or v18.3. Knip is _cutting edge!_

## Usage

Create a configuration file, let's give it the default name `knip.json` with these contents:

```json
{
  "entryFiles": ["src/index.ts"],
  "projectFiles": ["src/**/*.ts", "!**/*.spec.ts"]
}
```

The `entryFiles` target the starting point(s) to resolve production code dependencies. The `projectFiles` should contain
all files it should match them against, including potentially unused files.

Then run the checks:

    npx knip

This will analyze the project and output unused files, exports, types and duplicate exports.

## How It Works

Knip works by creating two sets of files:

1.  Production code is the set of files resolved from the `entryFiles`.
2.  They are matched against the set of `projectFiles`.
3.  The subset of project files that is not production code will be reported as unused files (in red).
4.  Then the production code (in blue) will be analyzed for unused exports.

![How it works][6]

## Options

    ❯ npx knip
    knip [options]

    Options:
      -c/--config [file]     Configuration file path (default: ./knip.json or package.json#knip)
      -t/--tsConfig [file]   TypeScript configuration path (default: ./tsconfig.json)
      --dir                  Working directory (default: current working directory)
      --include              Report only listed issue type(s) (see below)
      --exclude              Exclude issue type(s) from report (see below)
      --ignore               Ignore files matching this glob pattern (can be set multiple times)
      --no-gitignore         Don't use .gitignore
      --dev                  Include `devDependencies` in report(s)
      --no-progress          Don't show dynamic progress updates
      --max-issues           Maximum number of issues before non-zero exit code (default: 0)
      --reporter             Select reporter: symbols, compact, codeowners (default: symbols)
      --reporter-options     Pass extra options to the reporter (as JSON string, see example)
      --jsdoc                Enable JSDoc parsing, with options: public
      --debug                Show debug output
      --debug-level          Set verbosity of debug output (default: 1, max: 2)

    Issue types: files, dependencies, unlisted, exports, nsExports, types, nsTypes, duplicates

    Examples:

    $ knip
    $ knip --dir packages/client --include files
    $ knip -c ./knip.js --reporter compact --jsdoc public
    $ knip --ignore 'lib/**/*.ts' --ignore build
    $ knip --reporter codeowners --reporter-options '{"path":".github/CODEOWNERS"}'

    More info: https://github.com/webpro/knip

## Performance

🚀 Knip is considerably faster when only the `files` and/or `duplicates` types are included. Finding unused exports
requires deeper analysis (`exports`, `nsExports`, `types`, `nsTypes`). The following example commands do the same:

    knip --include files --include duplicates
    knip --include files,duplicates

## Reading the report

After analyzing all the files resolved from the `entryFiles` against the `projectFiles`, the report contains the
following types of issues:

- `files` - Unused files: did not find references to this file
- `dependencies` - Unused dependencies: did not find references to this dependency
- `unlisted` - Unlisted dependencies: imported dependencies, but not listed in package.json (1)
- `exports` - Unused exports: did not find references to this exported variable
- `nsExports` - Unused exports in namespaces: did not find direct references to this exported variable (2)
- `types` - Unused types: did not find references to this exported type
- `nsTypes` - Unused types in namespaces: did not find direct references to this exported variable (2)
- `duplicates` - Duplicate exports: the same thing is exported more than once with different names from the same file

1.  This may also include dependencies that could not be resolved properly (such as non-relative `local/dir/file.ts` not
    and `local` not being in `node_modules`).
2.  The variable or type is not referenced directly, and has become a member of a namespace. That's why Knip is not sure
    whether this export can be removed, so please look into it:

You can `--include` or `--exclude` any of the types to slice & dice the report to your needs. Alternatively, they can be
added to the configuration (e.g. `"exclude": ["dependencies"]`).

## Now what?

As always, make sure to backup files or use Git before deleting files or making changes. Run tests to verify results.

- Unused files can be removed.
- Unused dependencies can be removed from `package.json`.
- Unlisted dependencies should be added to `package.json`.
- Unused exports and types: remove the `export` keyword in front of unused exports. Then you (or tools such as the
  TypeScript language server in VS Code and/or ESLint) can see whether the variable or type is used within the same
  file. If this is not the case, it can be removed.

🔁 Repeat the process to reveal new unused files and exports. Sometimes it's so liberating to remove things!

## Production versus non-production code

Feels like you're getting too many false positives? Let's talk about `entryFiles` and `projectFiles`.

### Production code

The default configuration for Knip is very strict and targets production code. Non-production files such as tests should
not be part of the `entryFiles` and `projectFiles`. Here's why: test and other non-production files often import
production files, which will prevent the production files from being reported as unused. For best results:

- Include only production entry files to the `entryFiles`.
- Include only and all production files to the `projectFiles`.
- If necessary, add globs to exclude non-production files from the `projectFiles` (using negation pattern).

This will ensure Knip understands what production code can be removed.

### Non-production code

Non-production code includes files such as unit tests, end-to-end tests, tooling, scripts, Storybook stories, etc. Think
of it the same way as the convention to split `dependencies` and `devDependencies` in `package.json`.

To analyze the project as a whole:

- Include both production entry files and test files to the `entryFiles`.
- Include all production files to the `projectFiles`.
- If necessary, add globs for non-production files to the `projectFiles`.
- Set `dev: true` in the configuration or add `--dev` as a command line flag (to add `devDependencies`).

Here's an example:

```json
{
  "dev": true,
  "entryFiles": ["src/index.ts", "src/**/*.spec.ts", "src/**/*.e2e.ts"],
  "projectFiles": ["src/**/*.ts"]
}
```

Now use `-c knip.dev.json` to find unused files, dependencies and exports for the project as a whole.

An alternative way to store `dev` configuration is in this example `package.json`:

```json
{
  "name": "my-package",
  "scripts": {
    "knip": "knip"
  },
  "knip": {
    "entryFiles": ["src/index.ts"],
    "projectFiles": ["src/**/*.ts", "!**/*.spec.ts"],
    "dev": {
      "entryFiles": ["src/index.ts", "src/**/*.spec.ts", "src/**/*.e2e.ts"],
      "projectFiles": ["src/**/*.ts"]
    }
  }
}
```

Using the `--dev` flag will now switch to the non-production analysis.

Depending on the complexity of the project, be aware that it might require some fine-tuning on your end.

## Zero-config

Knip can work without any configuration. Then an existing `tsconfig.json` file is required. Since `entryFiles` and
`projectFiles` are now the same, Knip is unable to report unused files.

## More configuration examples

### Monorepos

#### Separate packages

In repos with multiple (publishable) packages, the `--dir` option comes in handy. With similar package structures, the
packages can be configured using globs:

```json
{
  "packages/*": {
    "entryFiles": ["src/index.ts"],
    "projectFiles": ["src/**/*.{ts,tsx}", "!**/*.spec.{ts,tsx}"]
  }
}
```

Packages can also be explicitly configured per package directory.

To analyze the packages separately, using the matching pattern from the configuration file:

    knip --dir packages/client
    knip --dir packages/services

#### Connected projects

A good example of a large project setup is a monorepo. Let's take an example (Nx) project configuration using Next.js,
Jest and Storybook, which has multiple apps and libs. They are not published separately and don't have their own
`package.json`.

This configuration file can also be a JavaScript file, which allows to add logic and/or comments (e.g. `knip.js`):

```js
const entryFiles = ['apps/**/pages/**/*.{js,ts,tsx}'];

const projectFiles = [
  '{apps,libs}/**/*.{ts,tsx}',
  // Next.js
  '!**/next.config.js',
  '!**/apps/**/public/**',
  '!**/apps/**/next-env.d.ts'
  // Jest
  '!**/jest.config.ts',
  '!**/*.spec.{ts,tsx}',
  // Storybook
  '!**/.storybook/**',
  '!**/*.stories.tsx',
];

module.exports = { entryFiles, projectFiles };
```

This should give good results about unused files, dependencies and exports for the monorepo. After the first run, the
configuration can be tweaked further to the project structure.

## Reporters

Knip provides the following built-in reporters:

- [`json`](#json)
- [`symbol`](#symbol-default) (default)
- [`compact`](#compact)
- [`codeowners`](#code-owners)

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
  isDev: boolean;
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
    "file": "src/Registration.tsx",
    "owners": ["@org/owner"],
    "files": true,
    "unlisted": ["react"],
    "exports": ["lowercaseFirstLetter", "RegistrationBox"],
    "types": ["RegistrationServices", "RegistrationAction"],
    "duplicates": ["Registration", "default"]
  }
]
```

The keys match the [known issue types](#reading-the-report).

#### Usage Ideas

Use tools like [miller](https://github.com/johnkerl/miller) or [jtbl](https://github.com/kellyjonbrazil/jtbl) to consume
the JSON and render a table in the terminal.

##### Table

```
$ npx knip --reporter json | mlr --ijson --opprint --no-auto-flatten cat
file                  owners      files  unlisted  exports                                types                                     duplicates
src/Registration.tsx  @org/owner  true   react     lowercaseFirstLetter, RegistrationBox  RegistrationServices, RegistrationAction  Registration, default
src/ProductsList.tsx  @org/team   false  -         -                                      ProductDetail                             -
```

##### Markdown Table

```
$ npx knip --reporter json | mlr --ijson --omd --no-auto-flatten cat
| file | owners | files | duplicates |
| --- | --- | --- | --- |
| src/Registration.tsx | @org/owner | true | Registration, default |
| src/ProductsList.tsx | @org/team | false |  |
```

Include specific issue types and/or replace the `cat` command with `put` for clean output:

```
npx knip --include files,duplicates --reporter json | mlr --ijson --opprint --no-auto-flatten put 'for (e in $*) { if(is_array($[e])) { $[e] = joinv($[e], ", ") } }'
npx knip --reporter json | mlr --ijson --omd --no-auto-flatten put 'for (e in $*) { if(is_array($[e])) { $[e] = joinv($[e], ", ") } }'
```

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

| Feature                           | **knip** | [depcheck][7] | [unimported][8] | [ts-unused-exports][9] | [ts-prune][10] | [find-unused-exports][11] |
| --------------------------------- | :------: | :-----------: | :-------------: | :--------------------: | :------------: | :-----------------------: |
| Unused files                      |    ✅    |       -       |       ✅        |           -            |       -        |             -             |
| Unused dependencies               |    ✅    |      ✅       |       ✅        |           -            |       -        |             -             |
| Unlisted dependencies             |    ✅    |      ✅       |       ✅        |           -            |       -        |             -             |
| [Custom dependency resolvers][12] |    ❌    |      ✅       |       ❌        |           -            |       -        |             -             |
| Unused exports                    |    ✅    |       -       |        -        |           ✅           |       ✅       |            ✅             |
| Duplicate exports                 |    ✅    |       -       |        -        |           ❌           |       ❌       |            ❌             |
| Search namespaces                 |    ✅    |       -       |        -        |           ✅           |       ❌       |            ❌             |
| Custom reporters                  |    ✅    |       -       |        -        |           -            |       -        |             -             |
| Pure JavaScript/ESM               |    ✅    |      ✅       |       ✅        |           -            |       -        |            ✅             |
| Configure entry files             |    ✅    |      ❌       |       ✅        |           ❌           |       ❌       |            ❌             |
| [Support monorepos][13]           |    🟠    |       -       |        -        |           -            |       -        |             -             |
| ESLint plugin available           |    -     |       -       |        -        |           ✅           |       -        |             -             |

✅ = Supported, ❌ = Not supported, - = Out of scope

## Monorepos

Knip wants to [support monorepos][14] properly, the first steps in this direction are implemented.

## Custom dependency resolvers

Using a string like `"plugin:cypress/recommended"` in the `extends` property of a `.eslintrc.json` in a package
directory of a monorepo is nice for DX. But Knip will need some help to find it and to understand this _resolves to_ the
`eslint-plugin-cypress` _dependency_. Or see it is not listed in `package.json`. Or that the dependency is still listed,
but no longer in use. Many popular projects reference plugins in similar ways, such as Babel, Webpack and Storybook.

Big compliments to [depcheck][15] which already does this! They call this "specials". [Knip has this ambition][16], too.

unimported is strict in this regard and works based on production files and `dependencies`, so does not have custom
dependency resolvers which are usually only needed for `devDependencies`.

## TypeScript language services

TypeScript language services could play a major role in most of the "unused" areas, as they have an overview of the
project as a whole. This powers things in VS Code like "Find references" or the "Module "./some" declares 'Thing'
locally, but it is not exported" message. I think features like "duplicate exports" or "custom dependency resolvers" are
userland territory, much like code linters.

## Knip?!

Knip is Dutch for a "cut". A Dutch expression is "to be ge**knip**t for something", which means to be perfectly suited
for the job. I'm motivated to make knip perfectly suited for the job of cutting projects to perfection! ✂️

[1]: #reporters
[2]: #custom-reporters
[3]: #really-another-unused-filedependencyexport-finder
[4]: https://labs.openai.com/s/xZQACaLepaKya0PRUPtIN5dC
[5]: ./assets/cow-with-orange-scissors-van-gogh-style.webp
[6]: ./assets/how-it-works.drawio.svg
[7]: https://github.com/depcheck/depcheck
[8]: https://github.com/smeijer/unimported
[9]: https://github.com/pzavolinsky/ts-unused-exports
[10]: https://github.com/nadeesha/ts-prune
[11]: https://github.com/jaydenseric/find-unused-exports
[12]: #custom-dependency-resolvers
[13]: #monorepos-1
[14]: #monorepos
[15]: https://github.com/depcheck/depcheck#special
[16]: https://github.com/webpro/knip/issues/7
