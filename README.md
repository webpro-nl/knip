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
- [ ] Supports JavaScript projects with CommonJS and ES Modules (TODO).

Exportman really shines in larger projects where you have much more files (such as `/docs`, `/tools` and `/scripts`)
than only production code. The `includes` setting in `tsconfig.json` is often too broad, resulting in too many false
negatives. Similar projects either detect only unimported files, or only unused exports. Most of them don't work by
configuring entry files, an essential feature to produce good results. This also allows to unleash Exportman on a
specific part of your project, and scan/handle these separately.

Exportman is another fresh take on keeping your projects clean & tidy.

## Installation

```
npm install -D exportman
```

## Usage

Create a configuration file, let's name it `.exportman.json` with these contents:

```json
{
  "entryFiles": ["src/index.tsx"],
  "filePatterns": ["src/**/*.{ts,tsx}", "!**/*.spec.{ts,tsx}"]
}
```

The `entryFiles` target the starting point(s) to resolve dependencies. The `filePatterns` should contain all files it
should match them against (including potentially unused files).

Then run the checks:

```
npx exportman --config .exportman
```

This will analyze the project and output unused files, exports, types and duplicate exports.

## Options

```
❯ npx exportman
exportman --config ./config.js[on]

Options:
  --config [file]               Path of configuration file (JS or JSON),
                                requires `entryFiles: []` and `filePatterns: []`
  --onlyFiles                   Report only unused files
  --onlyExports                 Report only unused exports
  --onlyTypes                   Report only unused types
  --onlyDuplicates              Report only unused duplicate exports
  --ignoreNamespaceImports      Ignore namespace imports (affects onlyFiles and onlyDuplicates)

Examples:

$ exportman --config ./exportman.json

$ exportman --config ./exportman.js --onlyFiles --onlyDuplicates

More info: https://github.com/webpro/exportman
```

## More configuration examples

### Monorepos

A good example of a large project setup is a monorepo, such as created with Nx. Let's take an example project
configuration for an Nx project using Next.js, Jest and Storybook:

```js
const entryFiles = ['apps/**/pages/**/*.{js,ts,tsx}'];

const filePatterns = [
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

module.exports = { entryFiles, filePatterns };
```

This should give good results about unused files and exports. After the first run, the configuration can be tweaked
further to the project structure.

### Test Coverage

This can also be turned around: which source files are not covered by tests? Here's an example configuration based on
the previous one:

```js
const entryFiles = ['{apps,libs}/**/*.spec.{ts,tsx}'];

const filePatterns = [
  '{apps,libs}/**/*.{ts,tsx}',
  '!apps/**/pages/**/*.{ts,tsx}',
  // Next.js
  '!**/next.config.js',
  '!**/apps/**/public/**',
  '!**/apps/**/next-env.d.ts'
  // Jest
  '!**/jest.config.ts',
  // Storybook
  '!**/.storybook/**',
  '!**/*.stories.tsx',
];

module.exports = { entryFiles, filePatterns };
```

```
npx exportman --config exportman.config --onlyFiles
```

This will output the production files that are not imported from test files or their dependencies, etc.

## Example Output

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
