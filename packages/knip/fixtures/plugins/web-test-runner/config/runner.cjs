const { fromRollup } = require('@web/dev-server-rollup');

module.exports = {
  plugins: [fromRollup(() => ({ name: 'custom' }))()],
};
