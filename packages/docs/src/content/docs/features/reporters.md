---
title: Reporters & Preprocessors
---

## Built-in Reporters

Knip provides the following built-in reporters:

- `codeowners`
- `compact`
- [`disclosure`][1]
- [`json`][2]
- [`markdown`][3]
- `symbol` (default)

Example usage:

```sh
knip --reporter compact
```

### JSON

The built-in `json` reporter output is meant to be consumed by other tools. It
reports in JSON format with unused `files` and `issues` as an array with one
object per file structured like this:

```json
{
  "files": ["src/unused.ts"],
  "issues": [
    {
      "file": "package.json",
      "owners": ["@org/admin"],
      "dependencies": [{ "name": "jquery", "line": 5, "col": 6, "pos": 71 }],
      "devDependencies": [{ "name": "lodash", "line": 9, "col": 6, "pos": 99 }],
      "unlisted": [{ "name": "react" }, { "name": "@org/unresolved" }],
      "exports": [],
      "types": [],
      "duplicates": []
    },
    {
      "file": "src/Registration.tsx",
      "owners": ["@org/owner"],
      "dependencies": [],
      "devDependencies": [],
      "binaries": [],
      "unresolved": [
        { "name": "./unresolved", "line": 8, "col": 23, "pos": 403 }
      ],
      "exports": [{ "name": "unusedExport", "line": 1, "col": 14, "pos": 13 }],
      "types": [
        { "name": "unusedEnum", "line": 3, "col": 13, "pos": 71 },
        { "name": "unusedType", "line": 8, "col": 14, "pos": 145 }
      ],
      "enumMembers": {
        "MyEnum": [
          { "name": "unusedMember", "line": 13, "col": 3, "pos": 167 },
          { "name": "unusedKey", "line": 15, "col": 3, "pos": 205 }
        ]
      },
      "classMembers": {
        "MyClass": [
          { "name": "unusedMember", "line": 40, "col": 3, "pos": 687 },
          { "name": "unusedSetter", "line": 61, "col": 14, "pos": 1071 }
        ]
      },
      "duplicates": ["Registration", "default"]
    }
  ]
}
```

The keys match the [reported issue types][4]. Example usage:

```sh
knip --reporter json
```

### Markdown

The built-in `markdown` reporter output is meant to be saved to a Markdown file.
This allows following the changes in issues over time. It reports issues in
Markdown tables separated by issue types as headings, for example:

```md
# Knip report

## Unused files (1)

- src/unused.ts

## Unlisted dependencies (2)

| Name            | Location          | Severity |
| :-------------- | :---------------- | :------- |
| unresolved      | src/index.ts:8:23 | error    |
| @org/unresolved | src/index.ts:9:23 | error    |

## Unresolved imports (1)

| Name         | Location           | Severity |
| :----------- | :----------------- | :------- |
| ./unresolved | src/index.ts:10:12 | error    |
```

### Disclosure

This reporter is useful for sharing large reports. Groups of issues are rendered
in a closed state initially. The reporter renders this:

````text
$ knip --reporter disclosure

<details>
<summary>Unused files (2)</summary>

```
unused.ts
dangling.js
```

</details>

<details>
<summary>Unused dependencies (2)</summary>

```
unused-dep     package.json
my-package     package.json
```

</details>
````

The above can be copy-pasted where HTML and Markdown is supported, such as a
GitHub issue or pull request, and renders like so:

<details>
  <summary>Unused files (2)</summary>

```
unused.ts
dangling.js
```

</details>

<details>
  <summary>Unused dependencies (2)</summary>

```
unused-dep     package.json
my-package     package.json
```

</details>

## Custom Reporters

When the provided built-in reporters are not sufficient, a custom local reporter
can be implemented or an external reporter can be used. Multiple reporters can
be used at once by repeating the `--reporter` argument.

The results are passed to the function from its default export and can be used
to write issues to `stdout`, a JSON or CSV file, or sent to a service. It
supports a local JavaScript or TypeScript file or an external dependency.

### Local

The default export of the reporter should be a function with this interface:

```ts
type Reporter = async (options: ReporterOptions): void;

type ReporterOptions = {
  report: Report;
  issues: Issues;
  configurationHints: ConfigurationHints;
  noConfigHints: boolean;
  cwd: string;
  isProduction: boolean;
  isShowProgress: boolean;
  options: string;
};
```

The data can then be used to write issues to `stdout`, a JSON or CSV file, or
sent to a service.

Here's a most minimal reporter example:

```ts title="./my-reporter.ts"
import type { Reporter } from 'knip';

const reporter: Reporter = function (options) {
  console.log(options.issues);
  console.log(options.counters);
};

export default reporter;
```

Example usage:

```sh
knip --reporter ./my-reporter.ts
```

### External

Pass `--reporter [pkg-name]` to use an external reporter. The default exported
function of the `main` script (default: `index.js`) will be invoked with the
`ReporterOptions`, just like a local reporter.

## Preprocessors

A preprocessor is a function that runs after the analysis is finished. It
receives the results from the analysis and should return data in the same
shape/structure (unless you pass it to only your own reporter).

The data goes through the preprocessors before the final data is passed to the
reporters. There are no built-in preprocessors. Just like reporters, use e.g.
`--preprocessor ./my-preprocessor` from the command line (can be repeated).

The default export of the preprocessor should be a function with this interface:

```ts
type Preprocessor = async (options: ReporterOptions) => ReporterOptions;
```

Like reporters, you can use local JavaScript or TypeScript files and external
npm packages as preprocessors.

Example preprocessor:

```ts title="./preprocess.ts"
import type { Preprocessor } from 'knip';

const preprocess: Preprocessor = function (options) {
  // modify options.issues and options.counters
  return options;
};

export default preprocess;
```

Example usage:

```sh
knip --preprocessor ./preprocess.ts
```

[1]: #disclosure
[2]: #json
[3]: #markdown
[4]: ../reference/issue-types.md
