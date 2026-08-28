module.exports = {
  entry: async () => ({
    app: {
      import: './src/app.js',
    },
    legacy: './src/legacy.js',
  }),
};
