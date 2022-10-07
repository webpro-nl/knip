# Exportman 🦸

Exportman scans your TypeScript projects for **unused files and exports**. For comparison, ESLint finds unused variables
inside files in isolation, but this will not be flagged:

```ts
export const myVar = true;
```

Unused files will also not be detected by ESLint. So how do you know which files and exports are no longer used? This
requires an analysis of all the right files in the project.

This is where Exportman comes in:

- [x] Resolves all (unused) files in your project and reports **unused files and exports**.
- [x] Verifies that exported symbols are actually used in other files, even when part of an imported namespace.
- [x] Finds duplicate exports of the same symbol.
- [x] Supports JavaScript inside TypeScript projects (`"allowJs": true`)
- [ ] Supports JavaScript-only projects with CommonJS and ESM (no `tsconfig.json`) - TODO

Exportman really shines in larger projects where you have non-production files (such as `/docs`, `/tools` and
`/scripts`). The `includes` setting in `tsconfig.json` is often too broad, resulting in too many false negatives.
Similar projects either detect only unimported files, or only unused exports. Most of them don't work by configuring
entry files, an essential feature to produce good results. This also allows to unleash Exportman on a specific part of
your project, and work these separately.

🦸 Exportman is another fresh take on keeping your projects clean & tidy!

## Installation

```
npm install -D exportman
```

## Usage

Create a configuration file, let's name it `.exportman.json` with these contents:

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
npx exportman --config .exportman
```

This will analyze the project and output unused files, exports, types and duplicate exports.

Use `--only files` when configuring Exportman for faster initial results.

## How It Works

Exportman works by creating two sets of files:

1. Production code is the set of files resolved from the `entryFiles`.
2. They are matched against the set of `projectFiles`.
3. The subset of project files that are not production code will be reported as unused files (in red).
4. Then the production code (in blue) will be scanned for unused exports.

![How it works](./assets/how-it-works.drawio.svg)

Clean and actionable reports are achieved when non-production code such as tests are excluded from the `projectFiles`
(using negation patterns such as `!**/*.test.ts`).

## Options

```
❯ npx exportman
exportman [options]

Options:
  -c/--config [file]   Configuration file path (default: ./exportman.json or package.json#exportman)
  --cwd                Working directory (default: current working directory)
  --max-issues         Maximum number of unreferenced files until non-zero exit code (default: 1)
  --only               Report only listed issue group(s): files, exports, types, nsExports, nsTypes, duplicates
  --exclude            Exclude issue group(s) from report: files, exports, types, nsExports, nsTypes, duplicates
  --no-progress        Don't show dynamic progress updates
  --reporter           Select reporter: symbols, compact (default: symbols)
  --jsdoc              Enable JSDoc parsing, with options: public (default: disabled)

Examples:

$ exportman
$ exportman --cwd packages/client --only files
$ exportman -c ./exportman.js --reporter compact --jsdoc public

More info: https://github.com/webpro/exportman
```

## Reading the report

After analyzing all the files resolved from the `entryFiles` against the `projectFiles`, the report contains the
following groups of issues:

- Unused **files**: no references to this file have been found
- Unused **exports**: unable to find references to this exported variable
- Unused exports in namespaces (1): unable to find references to this exported variable, and it has become a member of a
  re-exported namespace (**nsExports**)
- Unused types: no references to this exported type have been found
- Unused types in namespaces (1): this exported variable is not directly referenced, and it has become a member a
  re-exported namespace (**nsTypes**)
- Duplicate exports - the same thing is exported more than once with different names (**duplicates**)

Each group type (in **bold**) can be used in the `--only` and `--exclude` arguments to slice & dice the report to your
needs.

🚀 The process is considerably faster when reporting only the `files` and/or `duplicates` groups.

## Now what?

After verifying that files reported as unused are indeed not referenced anywhere, they can be deleted.

Remove the `export` keyword in front of unused exports. Then you (or tools such as ESLint) can see whether the variable
or type is used within its own file. If this is not the case, it can be removed completely.

🔁 Repeat the process to reveal new unused files and exports. Sometimes it's so liberating to delete things.

## More configuration examples

### Test files

For best results, it is recommended to exclude files such as tests from the project files. When including tests and
other non-production files, they may prevent production files from being reported as unused. Not including them will
make it clear what production files can be removed (including dependent files!).

The same goes for any type of non-production files, such as Storybook stories or end-to-end tests.

To report dangling files and exports that are not used by any of the production or test files, include both to the set
of `entryFiles`:

```json
{
  "entryFiles": ["src/index.ts", "src/**/*.spec.ts"],
  "projectFiles": ["src/**/*.ts", "!**/*.e2e.ts"]
}
```

In theory this idea could be extended to report some kind of test coverage.

### Monorepos

#### Separate packages

In repos with multiple packages, the `--cwd` option comes in handy. With similar package structures, the packages can be
configured using globs:

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
exportman --cwd packages/client --config exportman.json
exportman --cwd packages/services --config exportman.json
```

#### Connected projects

A good example of a large project setup is a monorepo, such as created with Nx. Let's take an example project
configuration for an Nx project using Next.js, Jest and Storybook. This can also be a JavaScript file, which allows to
add logic and/or comments:

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
$ exportman --config ./exportman.json
--- UNUSED FILES (2)
src/chat/helpers.ts
src/components/SideBar.tsx
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
$ exportman --config ./exportman.json --reporter compact
--- UNUSED FILES (2)
src/chat/helpers.ts
src/components/SideBar.tsx
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

## Why Yet Another unused file/export finder?

There are some fine modules available in the same category:

- [unimported](https://github.com/smeijer/unimported)
- [ts-unused-exports](https://github.com/pzavolinsky/ts-unused-exports)
- [no-unused-export](https://github.com/plantain-00/no-unused-export)
- [ts-prune](https://github.com/nadeesha/ts-prune)
- [find-unused-exports](https://github.com/jaydenseric/find-unused-exports)

However, the results where not always accurate, and none of them tick my boxes to find both unused files and exports. Or
let me configure entry files and scope the project files for clean results. Especially for larger projects this kind of
configuration is necessary. That's why I took another stab at it.
