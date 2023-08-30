# Reporters and Preprocessors

## Contents

- [Reporters][1]
  - [Local][2]
  - [External][3]
  - [JSON][4]
- [Preprocessors][5]

## Reporters

When the provided built-in reporters are not quite sufficient, a custom local reporter can be implemented or an external
reporter can be used. Multiple reporters can be used at once by repeating the `--reporter` argument.

Pass something like `--reporter ./my-reporter` from the command line. The results are passed to the function from its
default export and can be used to write issues to `stdout`, a JSON or CSV file, or sent to a service. It supports
TypeScript or an external dependency such as `--reporter ./my-reporter.ts` or `--reporter [pgk-name]`.

### Local

Pass `--reporter ./my-reporter`, with the default export of that module having this interface:

```ts
type Reporter = async (options: ReporterOptions) => void;

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

The data can then be used to write issues to `stdout`, a JSON or CSV file, or sent to a service.

### External

Pass `--reporter [pkg-name]` to use an external reporter. The default exported function of the `main` script (default:
`index.js`) will be invoked with the `ReporterOptions`, just like a local reporter.

### JSON

The built-in `json` reporter output is meant to be consumed by other tools. It reports in JSON format as an array with
one object per file like this:

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

The keys match the [reported issue types][6]

## Preprocessors

A preprocessor is a function that receives the results and should return data in the same shape/structure (unless you
pass it to only your own reporter). Just like reporters, use e.g. `--preprocessor ./my-preprocessor` from the command
line (can be repeated).

The default export of that module having this interface:

```ts
type Preprocessor = async (options: ReporterOptions) => ReporterOptions;
```

Like reporters, you can use JavaScript, TypeScript, and external npm packages as preprocessors.

[1]: #reporters
[2]: #local
[3]: #external
[4]: #json
[5]: #preprocessors
[6]: ../README.md#reading-the-report
