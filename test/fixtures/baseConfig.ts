const config = {
  report: {
    files: true,
    dependencies: true,
    devDependencies: true,
    unlisted: true,
    exports: true,
    types: true,
    nsExports: true,
    nsTypes: true,
    duplicates: true,
  },
  isIncludeEntryFiles: false,
  manifestPath: 'package.json',
  dependencies: [],
  peerDependencies: [],
  optionalDependencies: [],
  devDependencies: [],
  isDev: false,
  tsConfigPathGlobs: [],
  isShowProgress: false,
};

export default config;
