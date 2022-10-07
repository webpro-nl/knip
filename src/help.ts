export const printHelp = () => {
  console.log(`exportman --config ./config.js[on] [options]

Options:
  --config [file]               Path of configuration file (JS or JSON),
                                requires \`entryFiles: []\` and \`filePatterns: []\`
  --cwd                         Working directory (default: current working directory)
  --maxIssues                   Maximum number of unused files until non-zero exit code (default: 1)
  --only                        Report only listed issue group(s): files, exports, types, members, duplicates
  --exclude                     Exclude issue group(s) from report: files, exports, types, members, duplicates
  --noProgress                  Don't show dynamic progress updates
  --reporter                    Select reporter: symbols, compact (default: symbols)
  --jsdoc                       Enable JSDoc parsing, with options: public (default: disabled)

Examples:

$ exportman --config ./exportman.json
$ exportman --config ./exportman.json --cwd packages/client --reporter compact --jsdoc public
$ exportman --config ./exportman.js --only files,duplicates

More info: https://github.com/webpro/exportman`);
};
