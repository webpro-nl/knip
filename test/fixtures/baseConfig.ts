const config = {
  cwd: '.',
  include: {
    files: true,
    exports: true,
    types: true,
    members: true,
    duplicates: true,
  },
  isShowProgress: false,
  jsDocOptions: {
    isReadPublicTag: false,
  },
};

export default config;
