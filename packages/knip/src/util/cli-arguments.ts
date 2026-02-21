import { parseArgs } from 'node:util';

export const helpText = `✂️  Find unused dependencies, exports and files in your JavaScript and TypeScript projects

Usage: knip [options]

Options:
  -h, --help               Print this help text
  -V, --version            Print version
  -n, --no-progress        Don't show dynamic progress updates (automatically enabled in CI environments)
  -c, --config [file]      Configuration file path
                           (default: [.]knip.json[c], knip.(js|ts), knip.config.(js|ts) or package.json#knip)
  --use-tsconfig-files     Use tsconfig.json to define project files (override \`project\` patterns)
  -t, --tsConfig [file]    TypeScript configuration path (default: tsconfig.json)

Mode
  --cache                  Enable caching
  --cache-location [dir]   Change cache location (default: node_modules/.cache/knip)
  --include-entry-exports  Include entry files when reporting unused exports
  --include-libs           Include type definitions from external dependencies (default: false)
  --isolate-workspaces     Isolate workspaces into separate programs
  --no-gitignore           Don't respect .gitignore
  --production             Analyze only production source files (e.g. no test files, devDependencies)
  --strict                 Consider only direct dependencies of workspace (not devDependencies, not other workspaces)
  --watch                  Watch mode

Scope
  -W, --workspace [filter] Filter workspaces by name, directory, or glob (can be repeated)
  --directory [dir]        Run process from a different directory (default: cwd)
  --include                Report only provided issue type(s), can be comma-separated or repeated (1)
  --exclude                Exclude provided issue type(s) from report, can be comma-separated or repeated (1)
  --dependencies           Shortcut for --include dependencies,unlisted,binaries,unresolved,catalog
  --exports                Shortcut for --include exports,nsExports,classMembers,types,nsTypes,enumMembers,duplicates
  --files                  Shortcut for --include files
  --tags                   Include or exclude tagged exports

Fix
  --fix                    Fix issues (modifies files in your repo)
  --fix-type               Fix only issues of type, can be comma-separated or repeated (2)
  --allow-remove-files     Allow Knip to remove files (with --fix)
  --format                 Format modified files after --fix using the local formatter

Suppressions
  --suppress-all           Generate suppressions file for all current issues
  --suppress-type [type]   Suppress only a specific issue type
  --suppress-until [date]  Set an expiry date (YYYY-MM-DD) on generated suppressions
  --prune-suppressions     Remove stale entries from suppressions file
  --check-suppressions     Fail if suppressions file needs updating
  --suppressions-location  Cache suppressions file location (default: .knip-suppressions.json)
  --no-suppressions        Ignore suppressions

Output
  --preprocessor           Preprocess the results before providing it to the reporter(s), can be repeated
  --preprocessor-options   Pass extra options to the preprocessor (as JSON string, see --reporter-options example)
  --reporter               Select reporter (default: symbols), can be repeated (3)
  --reporter-options       Pass extra options to the reporter (as JSON string, see example)
  --no-config-hints        Suppress configuration hints
  --treat-config-hints-as-errors    Exit with non-zero code (1) if there are any configuration hints
  --max-issues             Maximum number of total issues before non-zero exit code (default: 0)
  --max-show-issues        Maximum number of issues to display per type
  --no-exit-code           Always exit with code zero (0)

Troubleshooting
  -d, --debug              Show debug output
  --memory                 Measure memory usage and display data table
  --memory-realtime        Log memory usage in realtime
  --performance            Measure count and running time of key functions and display stats table
  --performance-fn [name]  Measure only function [name]
  --trace                  Show trace output
  --trace-dependency [name] Show files that import the named dependency
  --trace-export [name]    Show trace output for named export(s)
  --trace-file [file]      Show trace output for exports in file

(1) Issue types: files, dependencies, unlisted, unresolved, exports, nsExports, classMembers, types, nsTypes, enumMembers, duplicates, catalog
(2) Fixable issue types: dependencies, exports, types, files, catalog
(3) Built-in reporters: symbols (default), compact, codeowners, json, codeclimate, markdown, disclosure, github-actions

Examples:

$ knip
$ knip --production
$ knip --workspace packages/client --include files,dependencies
$ knip --workspace @myorg/* --workspace '!@myorg/legacy'
$ knip --workspace './apps/*' --workspace '@shared/utils'
$ knip -c ./config/knip.json --reporter compact
$ knip --reporter codeowners --reporter-options '{"path":".github/CODEOWNERS"}'
$ knip --tags=-lintignore

Website: https://knip.dev`;

export type ParsedCLIArgs = ReturnType<typeof parseCLIArgs>;

export default function parseCLIArgs() {
  return parseArgs({
    options: {
      cache: { type: 'boolean' },
      'cache-location': { type: 'string' },
      'check-suppressions': { type: 'boolean' },
      config: { type: 'string', short: 'c' },
      debug: { type: 'boolean', short: 'd' },
      dependencies: { type: 'boolean' },
      directory: { type: 'string' },
      exclude: { type: 'string', multiple: true },
      exports: { type: 'boolean' },
      tags: { type: 'string', multiple: true },
      'experimental-tags': { type: 'string', multiple: true },
      files: { type: 'boolean' },
      fix: { type: 'boolean' },
      'fix-type': { type: 'string', multiple: true },
      format: { type: 'boolean' },
      'allow-remove-files': { type: 'boolean' },
      help: { type: 'boolean', short: 'h' },
      include: { type: 'string', multiple: true },
      'include-libs': { type: 'boolean' },
      'include-entry-exports': { type: 'boolean' },
      'isolate-workspaces': { type: 'boolean' },
      'max-issues': { type: 'string' },
      'max-show-issues': { type: 'string' },
      memory: { type: 'boolean' },
      'memory-realtime': { type: 'boolean' },
      'no-config-hints': { type: 'boolean' },
      'no-exit-code': { type: 'boolean' },
      'no-gitignore': { type: 'boolean' },
      'no-progress': { type: 'boolean', short: 'n' },
      'no-suppressions': { type: 'boolean' },
      performance: { type: 'boolean' },
      'performance-fn': { type: 'string' },
      production: { type: 'boolean' },
      preprocessor: { type: 'string', multiple: true },
      'preprocessor-options': { type: 'string' },
      reporter: { type: 'string', multiple: true },
      'prune-suppressions': { type: 'boolean' },
      'reporter-options': { type: 'string' },
      strict: { type: 'boolean' },
      'suppress-all': { type: 'boolean' },
      'suppress-type': { type: 'string' },
      'suppress-until': { type: 'string' },
      'suppressions-location': { type: 'string' },
      trace: { type: 'boolean' },
      'trace-dependency': { type: 'string' },
      'trace-export': { type: 'string' },
      'trace-file': { type: 'string' },
      'treat-config-hints-as-errors': { type: 'boolean' },
      tsConfig: { type: 'string', short: 't' },
      'use-tsconfig-files': { type: 'boolean' },
      version: { type: 'boolean', short: 'V' },
      watch: { type: 'boolean' },
      workspace: { type: 'string', short: 'W', multiple: true },
    },
  }).values;
}
