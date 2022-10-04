export const printHelp = () => {
  console.log(`exportman --config ./config.js[on]

Options:
  --config [file]               Path of configuration file (JS or JSON),
                                requires \`entryFiles: []\` and \`filePatterns: []\`
  --onlyFiles                   Report only unused files
  --onlyExports                 Report only unused exports
  --onlyTypes                   Report only unused types
  --onlyDuplicates              Report only unused duplicate exports
  --ignoreNamespaceImports      Ignore namespace imports (affects onlyFiles and onlyDuplicates)
  --hideProgress                Hide dynamic progress updates

Examples:

$ exportman --config ./exportman.json

$ exportman --config ./exportman.js --onlyFiles --onlyDuplicates

More info: https://github.com/webpro/exportman`);
};
