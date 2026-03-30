module.exports = {
  plugins: [
    'preset-default',
    'convertStyleToAttrs',
    'removeOffCanvasPaths',
    'removeScriptElement',
    'removeStyleElement',
    'removeDimensions',
    'reusePaths',
    'sortAttrs',
  ],
  multipass: true,
  precision: 2,
};
