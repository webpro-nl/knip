export const printHelp = () => {
  console.log(`knip [options]

Options:
  -c/--config [file]   Configuration file path (default: ./knip.json or package.json#knip)
  --cwd                Working directory (default: current working directory)
  --max-issues         Maximum number of unreferenced files until non-zero exit code (default: 1)
  --only               Report only listed issue group(s): files, exports, types, nsExports, nsTypes, duplicates
  --exclude            Exclude issue group(s) from report: files, exports, types, nsExports, nsTypes, duplicates
  --no-progress        Don't show dynamic progress updates
  --reporter           Select reporter: symbols, compact (default: symbols)
  --jsdoc              Enable JSDoc parsing, with options: public (default: disabled)

Examples:

$ knip
$ knip --cwd packages/client --only files
$ knip -c ./knip.js --reporter compact --jsdoc public

More info: https://github.com/webpro/knip`);
};
