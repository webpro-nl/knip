export const printHelp = () => {
  console.log(`exportman [options]

Options:
  -c/--config [file]   Configuration file path (default: ./exportman.json or package.json#exportman)
  --cwd                Working directory (default: current working directory)
  --maxIssues          Maximum number of unreferenced files until non-zero exit code (default: 1)
  --only               Report only listed issue group(s): files, exports, types, members, duplicates
  --exclude            Exclude issue group(s) from report: files, exports, types, members, duplicates
  --noProgress         Don't show dynamic progress updates
  --reporter           Select reporter: symbols, compact (default: symbols)
  --jsdoc              Enable JSDoc parsing, with options: public (default: disabled)

Examples:

$ exportman
$ exportman --cwd packages/client --only files
$ exportman -c ./exportman.js --reporter compact --jsdoc public

More info: https://github.com/webpro/exportman`);
};
