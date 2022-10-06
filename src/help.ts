export const printHelp = () => {
  console.log(`exportman --config ./config.js[on] [options]

Options:
  --config [file]               Path of configuration file (JS or JSON),
                                requires \`entryFiles: []\` and \`filePatterns: []\`
  --cwd                         Working directory (default: current working directory)
  --onlyFiles                   Report only unused files
  --onlyExports                 Report only unused exports
  --onlyTypes                   Report only unused types
  --onlyNsMembers               Report only unreferenced members of namespace imports
  --onlyDuplicates              Report only unused duplicate exports
  --noProgress                  Don't show dynamic progress updates
  --reporter                    Select reporter: symbols, compact (default: symbols)
  --jsdoc                       Enable JSDoc parsing, with options: public (default: disabled)

Examples:

$ exportman --config ./exportman.json
$ exportman --config ./exportman.json --cwd packages/client --reporter compact --jsdoc public
$ exportman --config ./exportman.js --onlyFiles --onlyDuplicates

More info: https://github.com/webpro/exportman`);
};
