module.exports = {
  artifactDirectory: './__generated__',
  requireCustomScalarTypes: true,
  customScalarTypes: {
    Used: { path: '../used.ts' },
    Unused: { path: '../unused.ts' },
  },
};
