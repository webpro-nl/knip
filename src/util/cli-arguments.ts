import { parseArgs } from 'node:util';

export const helpText = `✂️  Find unused files, dependencies and exports in your JavaScript and TypeScript projects

Usage: knip [options]

Options:
  -c, --config [file]      Configuration file path (default: [.]knip.json[c], knip.js, knip.ts or package.json#knip)
  -t, --tsConfig [file]    TypeScript configuration path (default: tsconfig.json)
  --production             Analyze only production source files (e.g. no tests, devDependencies, exported types)
  --strict                 Consider only direct dependencies of workspace (not devDependencies, not other workspaces)
  --workspace              Analyze a single workspace (default: analyze all configured workspaces)
  --ignore                 Ignore files matching this glob pattern, can be repeated
  --no-gitignore           Don't use .gitignore
  --include                Report only provided issue type(s), can be comma-separated or repeated (1)
  --exclude                Exclude provided issue type(s) from report, can be comma-separated or repeated (1)
  --dependencies           Shortcut for --include dependencies,unlisted
  --exports                Shortcut for --include exports,nsExports,classMembers,types,nsTypes,enumMembers,duplicates
  --no-progress            Don't show dynamic progress updates
  --reporter               Select reporter: symbols, compact, codeowners, json (default: symbols)
  --reporter-options       Pass extra options to the reporter (as JSON string, see example)
  --no-exit-code           Always exit with code zero (0)
  --max-issues             Maximum number of issues before non-zero exit code (default: 0)
  --debug                  Show debug output
  --debug-file-filter      Filter for files in debug output (regex as string)
  --performance            Measure count and running time of expensive functions and display stats table
  --h, --help              Print this help text
  --V, version             Print version

(1) Issue types: files, dependencies, unlisted, exports, nsExports, classMembers, types, nsTypes, enumMembers, duplicates

Examples:

$ knip
$ knip --production
$ knip --workspace packages/client --include files,dependencies
$ knip -c ./config/knip.json --reporter compact
$ knip --reporter codeowners --reporter-options '{"path":".github/CODEOWNERS"}'
$ knip --debug --debug-file-filter '(specific|particular)-module'

More documentation and bug reports: https://github.com/webpro/knip`;

export default parseArgs({
  options: {
    config: { type: 'string', short: 'c' },
    debug: { type: 'boolean' },
    'debug-file-filter': { type: 'string' },
    dependencies: { type: 'boolean' },
    exclude: { type: 'string', multiple: true },
    exports: { type: 'boolean' },
    help: { type: 'boolean', short: 'h' },
    ignore: { type: 'string', multiple: true },
    include: { type: 'string', multiple: true },
    'max-issues': { type: 'string' },
    'no-exit-code': { type: 'boolean' },
    'no-gitignore': { type: 'boolean' },
    'no-progress': { type: 'boolean' },
    performance: { type: 'boolean' },
    production: { type: 'boolean' },
    reporter: { type: 'string' },
    'reporter-options': { type: 'string' },
    strict: { type: 'boolean' },
    tsConfig: { type: 'string', short: 't' },
    version: { type: 'boolean', short: 'V' },
    workspace: { type: 'string' },
  },
});
