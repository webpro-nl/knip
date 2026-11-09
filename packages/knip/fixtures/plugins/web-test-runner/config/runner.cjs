const { fromRollup } = require('@web/dev-server-rollup');

module.exports = {
  files: ['spec/cjs-listed.js'],
  plugins: [fromRollup(() => ({ name: 'custom' }))()],
};
