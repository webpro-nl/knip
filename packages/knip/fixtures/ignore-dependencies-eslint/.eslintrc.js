const path = require('node:path');

module.exports = {
  extends: ['@local/eslint-config'],
  plugins: ['import', 'prettier'],
  root: true,
  settings: {
    'import/resolver': {
      typescript: {
        project: path.resolve(__dirname, 'tsconfig.json'),
      },
    },
  },
};
