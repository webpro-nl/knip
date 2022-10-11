const config = {
  cwd: '.',
  report: {
    files: true,
    dependencies: true,
    unlisted: true,
    exports: true,
    types: true,
    nsExports: true,
    nsTypes: true,
    duplicates: true,
  },
  dependencies: [],
  devDependencies: [],
  isDev: false,
  tsConfigFilePath: undefined,
  tsConfigPaths: [],
  ignorePatterns: [],
  isShowProgress: false,
  jsDocOptions: {
    isReadPublicTag: false,
  },
};

export default config;
