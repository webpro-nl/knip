# ✂️ Knip

Knip scans your JavaScript and TypeScript projects for **unused files, dependencies and exports**: things that can be
removed! Less code means better performance and less to maintain, important for both UX and DX!

For comparison, ESLint finds unused variables inside files in isolation, but this will not be flagged:

```ts
export const myVar = true;
```

Unused files will also not be detected by ESLint. So how do you know which files, dependencies and exports are no longer
used? This requires an analysis of all the right files in the project.

This is where Knip comes in:

- [x] Resolves all (unused) files in your project and reports **unused files, dependencies and exports**.
- [x] Verifies that exported symbols are actually used in other files, even when part of an imported namespace.
- [x] Finds dependencies not listed in `package.json`.
- [x] Finds duplicate exports of the same symbol.
- [x] Supports JavaScript inside TypeScript projects (`"allowJs": true`)
- [x] Supports JavaScript-only projects using ESM (without a `tsconfig.json`)

Knip really shines in larger projects where you have non-production files (such as `/docs`, `/tools` and `/scripts`).
The `includes` setting in `tsconfig.json` is often too broad, resulting in too many false negatives. Similar projects
either detect only unimported files, or only unused exports. Most of them don't work by configuring entry files, an
essential feature to produce good results. This also allows to unleash knip on a specific part of your project, and work
these separately.

✂️ Knip is another fresh take on keeping your projects clean & tidy!

## Installation

```
npm install -D knip
```

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

Please read on if you think you have too many results: [too many false positives?](#too-many-false-positives)

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
  --reporter             Select reporter: symbols, compact (default: symbols)
  --jsdoc                Enable JSDoc parsing, with options: public

Issue groups: files, dependencies, unlisted, exports, nsExports, types, nsTypes, duplicates

Examples:

$ knip
$ knip --dir packages/client --include files
$ knip -c ./knip.js --reporter compact --jsdoc public
$ knip --ignore 'lib/**/*.ts' --ignore build

More info: https://github.com/webpro/knip
```

🚀 Knip is considerably faster when only the `files` and/or `duplicates` groups are included.

## Reading the report

After analyzing all the files resolved from the `entryFiles` against the `projectFiles`, the report contains the
following groups of issues:

- `files` - Unused files: did not find references to this file
- `dependencies` - Unused dependencies: did not find references to this dependency
- `unlisted` - Unlisted dependencies: this dependency is used, but not listed in package.json (1)
- `exports` - Unused exports: did not find references to this exported variable
- `nsExports` - Unused exports in namespaces: did not find direct references to this exported variable (2)
- `types` - Unused types: did not find references to this exported type
- `nsTypes` - Unused types in namespaces: did not find direct references to this exported variable (2)
- `duplicates` - Duplicate exports: the same thing is exported more than once with different names

Each group type can be an `--include` or `--exclude` to slice & dice the report to your needs.

1. This may also include dependencies that could not be resolved properly, such as `local/dir/file.ts`.
2. The variable or type is not referenced directly, and has become a member of a namespace. That's why Knip is not sure
   whether this export can be removed, so please look into it:

## Now what?

As always, make sure to backup files or use Git before deleting files or making changes. Run tests to verify results.

- Unused files can be deleted.
- Unused dependencies can be removed from `package.json`.
- Unlisted dependencies should be added to `package.json`.
- Unused exports and types: remove the `export` keyword in front of unused exports. Then you (or tools such as ESLint)
  can see whether the variable or type is used within its own file. If this is not the case, it can be removed.

🔁 Repeat the process to reveal new unused files and exports. Sometimes it's so liberating to delete things.

## Too many false positives?

The default configuration for Knip is very strict and targets production code. For best results, it is recommended to
exclude files such as tests from the project files. Here's why: when including tests and other non-production files,
they may import production files, which will prevent them from being reported as unused.

Excluding non-production files from the `projectFiles` allows Knip to understand what production code can be removed
(including dependent files!).

Non-production code includes files such as end-to-end tests, tooling, scripts, Storybook stories, etc.

Think of it the same way as you would split `dependencies` and `devDependencies` in `package.json`.

To include both production and test files to analyze the project as a whole, include both sets of files to `entryFiles`,
and add `dev: true` to a file named such as `knip.dev.json`:

```json
{
  "dev": true,
  "entryFiles": ["src/index.ts", "src/**/*.spec.ts", "src/**/*.e2e.ts"],
  "projectFiles": ["src/**/*.ts"]
}
```

Now use `-c knip.dev.json` to find unused files and exports for the combined set of files as configured in `entryFiles`.

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

This way, the `--dev` flag will use the `dev` options (and also add `devDependencies` to the `dependencies` report).

## More configuration examples

### Monorepos

#### Separate packages

In repos with multiple (published) packages, the `--dir` option comes in handy. With similar package structures, the
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

To scan the packages separately, using the first match from the configuration file:

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

## Example Output

### Default reporter

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

### Compact

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

## Why Yet Another unused file/dependency/export finder?

There are already some great packages available. Getting good results when finding unused files, dependencies and
exports is not trivial. Repositories don't seem to get any smaller and with the rise of monorepos even more so. Tools
like this need to analyze potentially many and/or large files, which is memory and time-consuming. Although I normally
try to stick to the Unix philosophy, here I believe it's efficient to merge these issue reports into a single tool. When
building a dependency graph of the project, an abstract syntax tree for each file, and traversing all of this, why not
collect the various issues in one go?

## Comparison

This table is a work in progress, but here's a first impression. Based on their docs (please report any mistakes):

| Feature                     |  **knip**  | [depcheck][1] | [unimported][2] | [ts-unused-exports][3] | [ts-prune][4] | [find-unused-exports][5] |
| --------------------------- | :--------: | :-----------: | :-------------: | :--------------------: | :-----------: | :----------------------: |
| Unused files                |     ✅     |       -       |       ✅        |           -            |       -       |            -             |
| Unused dependencies         |     ✅     |      ✅       |       ✅        |           -            |       -       |            -             |
| Unlisted dependencies       |     ✅     |      ✅       |       ✅        |           -            |       -       |            -             |
| Custom dependency resolvers | ❌ [#7][6] |      ✅       |     ❌ (1)      |           -            |       -       |            -             |
| Unused exports              |     ✅     |       -       |        -        |           ✅           |      ✅       |            ✅            |
| Duplicate exports           |     ✅     |       -       |        -        |           ❌           |      ❌       |            ❌            |
| Search namespaces           |     ✅     |       -       |        -        |           ✅           |      ❌       |            ❌            |
| Custom reporters            |     ✅     |       -       |        -        |           -            |       -       |            -             |
| Pure JavaScript/ESM         |     ✅     |      ✅       |       ✅        |           -            |       -       |            ✅            |
| Configure entry files       |     ✅     |      ❌       |       ✅        |           ❌           |      ❌       |            ❌            |
| Support monorepo            |   🟠 (2)   |       -       |        -        |           -            |       -       |            -             |
| ESLint plugin available     |     -      |       -       |        -        |           ✅           |       -       |            -             |

✅ = Supported, ❌ = Not supported, - = Out of scope

1. unimported is strict and works based on production files and `dependencies`, so does not have custom dependency
   resolvers which are usually only needed for `devDependencies`.
2. knip wants to [support monorepos](#monorepos) properly, the first steps in this direction are implemented.

## Knip?!

Knip is Dutch for a "cut". A Dutch expression is "to be ge**knip**t for something", which means to be perfectly suited
for the job. I'm motivated to make knip perfectly suited for the job of cutting projects to perfection! ✂️

[1]: https://github.com/depcheck/depcheck
[2]: https://github.com/smeijer/unimported
[3]: https://github.com/pzavolinsky/ts-unused-exports
[4]: https://github.com/nadeesha/ts-prune
[5]: https://github.com/jaydenseric/find-unused-exports
[6]: https://github.com/webpro/knip/issues/7
