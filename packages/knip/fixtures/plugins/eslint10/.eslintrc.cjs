const oxcResolver = require('eslint-import-resolver-oxc');

module.exports = {
  root: true,
  extends: ['eslint:recommended'],
  plugins: ['import-x'],
  settings: {
    'import-x/resolver': {
      name: 'oxc',
      resolver: oxcResolver,
      enable: true,
      options: {},
    },
  },
  overrides: [
    {
      files: ['*.vue'],
      settings: {
        'import-x/resolver-legacy': ['node', { name: 'oxc', resolver: oxcResolver }],
      },
    },
  ],
};
