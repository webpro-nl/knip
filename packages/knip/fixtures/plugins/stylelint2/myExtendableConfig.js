/** @type {import('stylelint').Config} */
const myExtendableConfig = {
  extends: './config/shared.json',
  plugins: ['stylelint-order'],
};

module.exports = myExtendableConfig;
