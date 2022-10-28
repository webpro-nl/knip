const config = {
  report: {
    files: true,
    dependencies: true,
    devDependencies: false,
    unlisted: true,
    exports: true,
    types: true,
    classMembers: false,
    nsExports: true,
    nsTypes: true,
    enumMembers: false,
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
