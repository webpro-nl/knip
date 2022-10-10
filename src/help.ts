export const printHelp = () => {
  console.log(`knip [options]

Options:
  -c/--config [file]   Configuration file path (default: ./knip.json or package.json#knip)
  --cwd                Working directory (default: current working directory)
  --include            Report only listed issue group(s) (see below)
  --exclude            Exclude issue group(s) from report (see below)
  --dev                Include \`devDependencies\` in report(s) (default: false)
  --no-progress        Don't show dynamic progress updates
  --max-issues         Maximum number of issues before non-zero exit code (default: 0)
  --reporter           Select reporter: symbols, compact (default: symbols)
  --jsdoc              Enable JSDoc parsing, with options: public (default: disabled)

Issue groups: files, dependencies, unlisted, exports, nsExports, types, nsTypes, duplicates

Examples:

$ knip
$ knip --cwd packages/client --include files
$ knip -c ./knip.js --reporter compact --jsdoc public

More info: https://github.com/webpro/knip`);
};
