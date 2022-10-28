export const printHelp = () => {
  console.log(`knip [options]

Options:
  -c/--config [file]     Configuration file path (default: ./knip.json or package.json#knip)
  -t/--tsConfig [file]   TypeScript configuration path (default: ./tsconfig.json)
  --dir                  Working directory (default: current working directory)
  --include              Report only listed issue type(s), can be repeated
  --exclude              Exclude issue type(s) from report, can be repeated
  --ignore               Ignore files matching this glob pattern, can be repeated
  --no-gitignore         Don't use .gitignore
  --dev                  Include \`devDependencies\` in report(s)
  --include-entry-files  Report unused exports and types for entry files
  --no-progress          Don't show dynamic progress updates
  --max-issues           Maximum number of issues before non-zero exit code (default: 0)
  --reporter             Select reporter: symbols, compact, codeowners, json (default: symbols)
  --reporter-options     Pass extra options to the reporter (as JSON string, see example)
  --debug                Show debug output
  --debug-level          Set verbosity of debug output (default: 1, max: 2)
  --performance          Measure running time of expensive functions and display stats table

Issue types: files, dependencies, unlisted, exports, nsExports, classMembers, types, nsTypes, enumMembers, duplicates

Examples:

$ knip
$ knip --dir packages/client --include files
$ knip -c ./knip.js --reporter compact
$ knip --ignore 'lib/**/*.ts' --ignore build
$ knip --reporter codeowners --reporter-options '{"path":".github/CODEOWNERS"}'

More info: https://github.com/webpro/knip`);
};
