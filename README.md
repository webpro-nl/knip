# ✂️ Knip

Knip scans your JavaScript and TypeScript projects for **unused files, dependencies and exports**: things that can be
removed! Less code leads to improved performance, less maintenance, easier refactorings.

```ts
export const myVar = true;
```

ESLint handles files in isolation, so the `export` keyword "blocks" further analysis. Unused files and dependencies will
also not be detected. You could think of Knip as going (far!) beyond the "unused variable" rule of ESLint. Knip lints
the project as a whole, or parts of it.

It's only human to forget to delete files or dependencies that you no longer use. How to keep track of how many times
something is actually used in a codebase? How to find out this number just dropped to zero for anything? Where to even
start finding things that can be removed during maintenance and refactorings? Especially in larger projects all of this
can be tedious. This is where Knip comes in.

Boring stuff should be automated! Just let Knip have a crack at it:

- [x] Finds **unused files, dependencies and exports**.
- [x] Finds dependencies not listed in `package.json`.
- [x] Verifies that exported symbols are actually used in other files, even when part of an imported namespace.
- [x] Supports JavaScript inside TypeScript projects (`"allowJs": true`).
- [x] Finds duplicate exports of the same symbol.
- [x] Supports JavaScript ES Module-based projects without a `tsconfig.json`.
- [x] Features multiple [reporters](#reporters) and supports [custom reporters](#custom-reporters).

Knip really shines in larger projects. A little bit of configuration will pay off, I promise. A comparison with similar
tools answers the question
[why another unused file/dependency/export finder?](#why-yet-another-unused-filedependencyexport-finder)

Knip is a fresh take on keeping your projects clean & tidy!

[![An orange cow with scissors, Van Gogh style](./assets/cow-with-orange-scissors-van-gogh-style.webp)](https://labs.openai.com/s/xZQACaLepaKya0PRUPtIN5dC)
<sup>_“An orange cow with scissors, Van Gogh style” - generated with OpenAI_</sup>

## Installation

```
npm install -D knip
```

Knip requires least Node.js v16.17 or v18 is required. Knip is _cutting edge!_

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

```
npx knip
```

This will analyze the project and output unused files, exports, types and duplicate exports.

Use `--include files` when configuring knip the first time for faster initial results.

## How It Works

Knip works by creating two sets of files:

1. Production code is the set of files resolved from the `entryFiles`.
2. They are matched against the set of `projectFiles`.
3. The subset of project files that is not production code will be reported as unused files (in red).
4. Then the production code (in blue) will be scanned for unused exports.

![How it works](./assets/how-it-works.drawio.svg)

## Options

```
❯ npx knip
knip [options]

Options:
  -c/--config [file]     Configuration file path (default: ./knip.json or package.json#knip)
  -t/--tsConfig [file]   TypeScript configuration path (default: ./tsconfig.json)
  --dir                  Working directory (default: current working directory)
  --include              Report only listed issue group(s) (see below)
  --exclude              Exclude issue group(s) from report (see below)
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

Issue groups: files, dependencies, unlisted, exports, nsExports, types, nsTypes, duplicates

Examples:

$ knip
$ knip --dir packages/client --include files
$ knip -c ./knip.js --reporter compact --jsdoc public
$ knip --ignore 'lib/**/*.ts' --ignore build
$ knip --reporter codeowners --reporter-options '{"path":".github/CODEOWNERS"}'

More info: https://github.com/webpro/knip
```

🚀 Knip is considerably faster when only the `files` and/or `duplicates` groups are included.

## Reading the report

After analyzing all the files resolved from the `entryFiles` against the `projectFiles`, the report contains the
following groups of issues:

- `files` - Unused files: did not find references to this file
- `dependencies` - Unused dependencies: did not find references to this dependency
- `unlisted` - Unlisted dependencies: imported dependencies, but not listed in package.json (1)
- `exports` - Unused exports: did not find references to this exported variable
- `nsExports` - Unused exports in namespaces: did not find direct references to this exported variable (2)
- `types` - Unused types: did not find references to this exported type
- `nsTypes` - Unused types in namespaces: did not find direct references to this exported variable (2)
- `duplicates` - Duplicate exports: the same thing is exported more than once with different names from the same file

Each group type can be an `--include` or `--exclude` to slice & dice the report to your needs.

1. This may also include dependencies that could not be resolved properly (such as non-relative `local/dir/file.ts` not
   and `local` not being in `node_modules`).
2. The variable or type is not referenced directly, and has become a member of a namespace. That's why Knip is not sure
   whether this export can be removed, so please look into it:

## Now what?

As always, make sure to backup files or use Git before deleting files or making changes. Run tests to verify results.

- Unused files can be deleted.
- Unused dependencies can be removed from `package.json`.
- Unlisted dependencies should be added to `package.json`.
- Unused exports and types: remove the `export` keyword in front of unused exports. Then you (or tools such as the
  TypeScript language server in VS Code and/or ESLint) can see whether the variable or type is used within the same
  file. If this is not the case, it can be removed.

🔁 Repeat the process to reveal new unused files and exports. Sometimes it's so liberating to delete things!

## Production versus non-production code

Feels like you're getting too many false positives? Let's talk about `entryFiles` and `projectFiles`.

### Production code

The default configuration for Knip is very strict and targets production code. Non-production files such as tests should
not be part of the `entryFiles`. Here's why: test and other non-production files often import production files, which
will prevent the production files from being reported as unused. For best results:

- Include only production entry files to the `entryFiles`.
- Include only and all production files to the `projectFiles`.
- If necessary, exclude non-production files from the `projectFiles` (using negation patterns).

This will ensure Knip understands what production code can be removed.

### Non-production code

Non-production code includes files such as unit tests, end-to-end tests, tooling, scripts, Storybook stories, etc. Think
of it the same way as the convention to split `dependencies` and `devDependencies` in `package.json`.

To analyze the project as a whole:

- Include both production entry files and test files to the `entryFiles`.
- Include all production files to the `projectFiles`.
- Include non-production files from the `projectFiles`.
- To include `devDependencies`, set `dev: true` in the configuration or add `--dev` as a command line flag.

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

To scan the packages separately, using the matching pattern from the configuration file:

```
knip --dir packages/client
knip --dir packages/services
```

#### Connected projects

A good example of a large project setup is a monorepo, such as created with Nx. Let's take an example project
configuration for an Nx project using Next.js, Jest and Storybook. This configuration file can also be a JavaScript
file, which allows to add logic and/or comments (e.g. `knip.js`):

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

This should give good results about unused files and exports for the monorepo. After the first run, the configuration
can be tweaked further to the project structure.

## Reporters

For starters, Knip already contains a few useful reporters:

- `symbol` (default)
- `compact`
- `codeowners`

### Custom Reporters

When a `--reporter ./my-reporter` is passed, the default export of that module should have this interface:

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

### Example Output

#### Symbol (default)

The default reporter shows the sorted symbols first:

```
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
```

#### Compact

The compact reporter shows the sorted files first, and then a list of symbols:

```
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
```

#### Code Owners

The `codeowners` reporter is like `compact`, but shows the sorted code owners (according to `.github/CODEOWNERS`) first:

```
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
```

The owner of `package.json` is considered the owner of unused (dev) dependencies.

Use `--reporter-options '{"path":".github/CODEOWNERS"}'` to pass another location for the code owners file.

## Really, another unused file/dependency/export finder?

There are already some great packages available if you want to find unused dependencies OR unused exports.

Although I love the Unix philosophy, here I believe it's efficient to handle multiple concerns in a single tool. When
building a dependency graph of the project, an abstract syntax tree for each file, and traversing all of this, why not
collect the various issues in one go?

## Comparison

This table is a work in progress, but here's a first impression. Based on their docs (please report any mistakes):

| Feature                          | **knip** | [depcheck][1] | [unimported][2] | [ts-unused-exports][3] | [ts-prune][4] | [find-unused-exports][5] |
| -------------------------------- | :------: | :-----------: | :-------------: | :--------------------: | :-----------: | :----------------------: |
| Unused files                     |    ✅    |       -       |       ✅        |           -            |       -       |            -             |
| Unused dependencies              |    ✅    |      ✅       |       ✅        |           -            |       -       |            -             |
| Unlisted dependencies            |    ✅    |      ✅       |       ✅        |           -            |       -       |            -             |
| [Custom dependency resolvers][7] |    ❌    |      ✅       |       ❌        |           -            |       -       |            -             |
| Unused exports                   |    ✅    |       -       |        -        |           ✅           |      ✅       |            ✅            |
| Duplicate exports                |    ✅    |       -       |        -        |           ❌           |      ❌       |            ❌            |
| Search namespaces                |    ✅    |       -       |        -        |           ✅           |      ❌       |            ❌            |
| Custom reporters                 |    ✅    |       -       |        -        |           -            |       -       |            -             |
| Pure JavaScript/ESM              |    ✅    |      ✅       |       ✅        |           -            |       -       |            ✅            |
| Configure entry files            |    ✅    |      ❌       |       ✅        |           ❌           |      ❌       |            ❌            |
| [Support monorepos][8]           |    🟠    |       -       |        -        |           -            |       -       |            -             |
| ESLint plugin available          |    -     |       -       |        -        |           ✅           |       -       |            -             |

✅ = Supported, ❌ = Not supported, - = Out of scope

## Monorepos

Knip wants to [support monorepos](#monorepos) properly, the first steps in this direction are implemented.

## Custom dependency resolvers

Using a string like `"plugin:cypress/recommended"` in the `extends` property of a `.eslintrc.json` in a package
directory of a monorepo is nice for DX. But Knip will need some help to find it and to understand this _resolves to_ the
`eslint-plugin-cypress` _dependency_. Or see it is not listed in `package.json`. Or that the dependency is still listed,
but no longer in use. Many popular projects reference plugins in similar ways, such as Babel, Webpack and Storybook.

Big compliments to [depcheck](https://github.com/depcheck/depcheck#special) which already does this! They call this
"specials". [Knip has this ambition][6], too.

unimported is strict in this regard and works based on production files and `dependencies`, so does not have custom
dependency resolvers which are usually only needed for `devDependencies`.

## TypeScript language services

TypeScript language services could play a major role in most of the "unused" areas, as they have an overview of the
project as a whole. For instance, this powers the "Find references" feature in VS Code. I think features like "duplicate
exports" or "custom dependency resolvers" are userland territory, much like code linters.

## Knip?!

Knip is Dutch for a "cut". A Dutch expression is "to be ge**knip**t for something", which means to be perfectly suited
for the job. I'm motivated to make knip perfectly suited for the job of cutting projects to perfection! ✂️

[1]: https://github.com/depcheck/depcheck
[2]: https://github.com/smeijer/unimported
[3]: https://github.com/pzavolinsky/ts-unused-exports
[4]: https://github.com/nadeesha/ts-prune
[5]: https://github.com/jaydenseric/find-unused-exports
[6]: https://github.com/webpro/knip/issues/7
[7]: #custom-dependency-resolvers
[8]: #monorepos-1
