export const printHelp = () => {
  console.log(`knip [options]

Options:
  -c/--config [file]     Configuration file path (default: ./knip.json or package.json#knip)
  -t/--tsConfig [file]   TypeScript configuration path (default: ./tsconfig.json)
  --dir                  Working directory (default: current working directory)
  --include              Report only listed issue type(s) (see below)
  --exclude              Exclude issue type(s) from report (see below)
  --ignore               Ignore files matching this glob pattern (can be set multiple times)
  --no-gitignore         Don't use .gitignore
  --dev                  Include \`devDependencies\` in report(s)
  --include-entry-files  Report unused exports and types for entry files
  --no-progress          Don't show dynamic progress updates
  --max-issues           Maximum number of issues before non-zero exit code (default: 0)
  --reporter             Select reporter: symbols, compact, codeowners, json (default: symbols)
  --reporter-options     Pass extra options to the reporter (as JSON string, see example)
  --jsdoc                Enable JSDoc parsing, with options: public
  --debug                Show debug output
  --debug-level          Set verbosity of debug output (default: 1, max: 2)
  --performance          Measure running time of expensive functions and display stats table

Issue types: files, dependencies, unlisted, exports, nsExports, types, nsTypes, duplicates

Examples:

$ knip
$ knip --dir packages/client --include files
$ knip -c ./knip.js --reporter compact --jsdoc public
$ knip --ignore 'lib/**/*.ts' --ignore build
$ knip --reporter codeowners --reporter-options '{"path":".github/CODEOWNERS"}'

More info: https://github.com/webpro/knip`);
};
