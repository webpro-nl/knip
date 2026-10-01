module.exports = {
  entry: {
    app: {
      import: './src/app.js',
      filename: 'bundle/[name].js',
    },
    vendor: {
      import: ['./src/polyfill.js', './src/shim.js'],
    },
  },
};
