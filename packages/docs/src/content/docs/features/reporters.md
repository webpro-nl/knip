---
title: Reporters & Preprocessors
description: Knip's built-in reporters (including the shape of `knip --reporter json` for scripts, CI and coding agents), plus custom reporters and preprocessors.
---

## Built-in Reporters

Knip provides the following built-in reporters:

- [`codeclimate`][1]
- [`codeowners`][2]
- `compact`
- [`disclosure`][3]
- [`github-actions`][4]
- [`json`][5]
- [`markdown`][6]
- `symbols` (default)

Example usage:

```sh
knip --reporter compact
```

### CodeClimate

The built-in `codeclimate` reporter generates output in the Code Climate Report
JSON format. Example usage:

```text
$ knip --reporter codeclimate

[
  {
    "type": "issue",
    "check_name": "Unused exports",
    "description": "isUnused",
    "categories": ["Bug Risk"],
    "location": {
      "path": "path/to/file.ts",
      "positions": {
        "begin": {
          "line": 6,
          "column": 1
        }
      }
    },
    "severity": "major",
    "fingerprint": "e9789995c1fe9f7d75eed6a0c0f89e84"
  }
]
```

### CODEOWNERS

When a `.github/CODEOWNERS` file exists, each entry gains an `owners` array.
Point the reporter at a different path through [`--reporter-options`][7]:

```sh
knip --reporter json --reporter-options '{"codeowners":"docs/CODEOWNERS"}'
```

For a typed object instead of JSON to parse, write a [custom reporter][8].
Coding agents can also call Knip through the [MCP server][9], which returns
structured results and configuration hints directly.

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
my-package     package.json:17:5
unused-dep     package.json:20:5
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
my-package     package.json:17:5
unused-dep     package.json:20:5
```

</details>

### GitHub Actions

Use the GitHub Actions reporter in a workflow for annotations in pull requests.
Example usage:

```sh
knip --reporter github-actions
```

Changed files in pull requests will now contain inline annotations for lint
findings.

### JSON

The `json` reporter prints machine-readable results for scripts, CI, and tools
(including coding agents) to consume:

```sh
knip --reporter json
```

Output is one line of JSON. Formatted here for readability:

```json
{
  "issues": [
    {
      "file": "src/legacy.ts",
      "files": [{ "name": "src/legacy.ts" }]
    },
    {
      "file": "src/math.ts",
      "exports": [{ "name": "factorial", "line": 12, "col": 14, "pos": 256 }],
      "types": [{ "name": "Radians", "line": 20, "col": 13, "pos": 410 }]
    },
    {
      "file": "package.json",
      "dependencies": [{ "name": "lodash" }],
      "unlisted": [{ "name": "rimraf" }]
    }
  ]
}
```

The top level is an object with a single `issues` array. Each element groups
every issue found in one file:

| Field        | Type         | Notes                                               |
| :----------- | :----------- | :-------------------------------------------------- |
| `file`       | `string`     | Path relative to the working directory              |
| `owners`     | `{ name }[]` | Code owners, only when a `CODEOWNERS` file is found |
| _issue type_ | array        | One key per enabled issue type (see below)          |

Each entry carries a key for **every enabled [issue type][10]**, so the keys are
the same across entries. An array is empty when that file has no issues of that
type. Drop a type's key by disabling it with [filters or rules][11].

Issue-type items are objects with position info:

| Field       | Type      | Notes                                          |
| :---------- | :-------- | :--------------------------------------------- |
| `name`      | `string`  | The unused symbol, dependency, file, or import |
| `namespace` | `string?` | Set for namespace members                      |
| `line`      | `number?` | 1-based line                                   |
| `col`       | `number?` | 1-based column                                 |
| `pos`       | `number?` | Character offset                               |

See [Issue types][10] for the full set of issue-type keys.

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
type Reporter = (options: ReporterOptions) => void;

type ReporterOptions = {
  report: Report;
  issues: Issues;
  counters: Counters;
  configurationHints: ConfigurationHints;
  isDisableConfigHints: boolean;
  isTreatConfigHintsAsErrors: boolean;
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
type Preprocessor = (options: ReporterOptions) => ReporterOptions;
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

[1]: #codeclimate
[2]: #codeowners
[3]: #disclosure
[4]: #github-actions
[5]: #json
[6]: #markdown
[7]: ../reference/cli.md#--reporter-options-json
[8]: #custom-reporters
[9]: ../reference/integrations.md
[10]: ../reference/issue-types.md
[11]: ./rules-and-filters.md
