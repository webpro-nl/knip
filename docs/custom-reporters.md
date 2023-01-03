# Custom Reporters

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

## JSON

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

The keys match the [reported issue types][1]

## Usage Ideas

Use tools like [miller][2] or [jtbl][3] to consume the JSON and render a table in the terminal.

### Table

    $ npx knip --reporter json | mlr --ijson --opprint --no-auto-flatten cat
    file                  owners      files  unlisted  exports                                types                                     duplicates
    src/Registration.tsx  @org/owner  true   react     lowercaseFirstLetter, RegistrationBox  RegistrationServices, RegistrationAction  Registration, default
    src/ProductsList.tsx  @org/team   false  -         -                                      ProductDetail                             -

### Markdown Table

    $ npx knip --reporter json | mlr --ijson --omd --no-auto-flatten cat
    | file | owners | files | duplicates |
    | --- | --- | --- | --- |
    | src/Registration.tsx | @org/owner | true | Registration, default |
    | src/ProductsList.tsx | @org/team | false |  |

Include specific issue types and/or replace the `cat` command with `put` for clean output:

    npx knip --include files,duplicates --reporter json | mlr --ijson --opprint --no-auto-flatten put 'for (e in $*) { if(is_array($[e])) { $[e] = joinv($[e], ", ") } }'
    npx knip --reporter json | mlr --ijson --omd --no-auto-flatten put 'for (e in $*) { if(is_array($[e])) { $[e] = joinv($[e], ", ") } }'

[1]: ../README.md#reading-the-report
[2]: https://miller.readthedocs.io
[3]: https://github.com/kellyjonbrazil/jtbl
