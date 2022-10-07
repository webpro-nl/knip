const config = {
  cwd: '.',
  include: {
    files: true,
    exports: true,
    types: true,
    nsExports: true,
    nsTypes: true,
    duplicates: true,
  },
  isShowProgress: false,
  jsDocOptions: {
    isReadPublicTag: false,
  },
};

export default config;
