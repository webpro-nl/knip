import { parseArgs } from 'node:util';

export const helpText = `✂️  Find unused files, dependencies and exports in your JavaScript and TypeScript projects

Usage: knip [options]

Options:
  -c, --config [file]      Configuration file path (default: [.]knip.json[c], knip.js, knip.ts or package.json#knip)
  -t, --tsConfig [file]    TypeScript configuration path (default: tsconfig.json)
  --production             Analyze only production source files (e.g. no tests, devDependencies, exported types)
  --strict                 Consider only direct dependencies of workspace (not devDependencies, not other workspaces)
  -W, --workspace [dir]    Analyze a single workspace (default: analyze all configured workspaces)
  --directory [dir]        Run process from a different directory (default: cwd)
  --cache                  Enable caching
  --cache-location         Change cache location (default: node_modules/.cache/knip)
  --no-gitignore           Don't use .gitignore
  --include                Report only provided issue type(s), can be comma-separated or repeated (1)
  --exclude                Exclude provided issue type(s) from report, can be comma-separated or repeated (1)
  --dependencies           Shortcut for --include dependencies,unlisted,binaries,unresolved
  --exports                Shortcut for --include exports,nsExports,classMembers,types,nsTypes,enumMembers,duplicates
  --files                  Shortcut for --include files
  --fix                    Fix issues
  --fix-type               Fix only issues of type, can be comma-separated or repeated (2)
  --include-libs           Include type definitions from dependencies (default: false; implied with classMembers)
  --include-entry-exports  Include entry files when reporting unused exports
  --isolate-workspaces     Isolate workspaces into separate programs (default: false)
  -n, --no-progress        Don't show dynamic progress updates (automatically enabled in CI environments)
  --preprocessor           Preprocess the results before providing it to the reporter(s), can be repeated
  --preprocessor-options   Pass extra options to the preprocessor (as JSON string, see --reporter-options example)
  --reporter               Select reporter: symbols, compact, codeowners, json, can be repeated (default: symbols)
  --reporter-options       Pass extra options to the reporter (as JSON string, see example)
  --tags                   Include or exclude tagged exports
  --no-config-hints        Suppress configuration hints
  --no-exit-code           Always exit with code zero (0)
  --max-issues             Maximum number of issues before non-zero exit code (default: 0)
  -d, --debug              Show debug output
  --performance            Measure count and running time of expensive functions and display stats table
  -h, --help               Print this help text
  -V, --version            Print version

(1) Issue types: files, dependencies, unlisted, unresolved, exports, nsExports, classMembers, types, nsTypes, enumMembers, duplicates
(2) Fixable issue types: dependencies, exports, types

Examples:

$ knip
$ knip --production
$ knip --workspace packages/client --include files,dependencies
$ knip -c ./config/knip.json --reporter compact
$ knip --reporter codeowners --reporter-options '{"path":".github/CODEOWNERS"}'
$ knip --tags=-knipignore

Website: https://knip.dev`;

// biome-ignore lint/suspicious/noImplicitAnyLet: TODO
let parsedArgs;
try {
  parsedArgs = parseArgs({
    options: {
      cache: { type: 'boolean' },
      cacheLocation: { type: 'string' },
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
      help: { type: 'boolean', short: 'h' },
      'ignore-internal': { type: 'boolean' },
      include: { type: 'string', multiple: true },
      'include-libs': { type: 'boolean' },
      'include-entry-exports': { type: 'boolean' },
      'isolate-workspaces': { type: 'boolean' },
      'max-issues': { type: 'string' },
      'no-config-hints': { type: 'boolean' },
      'no-exit-code': { type: 'boolean' },
      'no-gitignore': { type: 'boolean' },
      'no-progress': { type: 'boolean', short: 'n' },
      performance: { type: 'boolean' },
      production: { type: 'boolean' },
      preprocessor: { type: 'string', multiple: true },
      'preprocessor-options': { type: 'string' },
      reporter: { type: 'string', multiple: true },
      'reporter-options': { type: 'string' },
      strict: { type: 'boolean' },
      trace: { type: 'boolean' },
      tsConfig: { type: 'string', short: 't' },
      version: { type: 'boolean', short: 'V' },
      workspace: { type: 'string', short: 'W' },
    },
  });
} catch (error: unknown) {
  if (error instanceof Error) {
    console.error(error.message);
    console.log(`\n${helpText}`);
    process.exit(1);
  }
  throw error;
}

export default parsedArgs.values;
