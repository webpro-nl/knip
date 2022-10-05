export const printHelp = () => {
  console.log(`exportman --config ./config.js[on] [options]

Options:
  --config [file]               Path of configuration file (JS or JSON),
                                requires \`entryFiles: []\` and \`filePatterns: []\`
  --cwd                         Working directory (default: current working directory)
  --onlyFiles                   Report only unused files
  --onlyExports                 Report only unused exports
  --onlyTypes                   Report only unused types
  --onlyDuplicates              Report only unused duplicate exports
  --ignoreNamespaceImports      Ignore namespace imports (affects onlyExports and onlyTypes)
  --noProgress                  Don't show dynamic progress updates

Examples:

$ exportman --config ./exportman.json
$ exportman --config ./exportman.js --onlyFiles --onlyDuplicates
$ exportman --config ./exportman.json --cwd packages/client

More info: https://github.com/webpro/exportman`);
};
