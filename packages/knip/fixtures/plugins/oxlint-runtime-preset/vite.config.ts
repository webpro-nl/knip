import preset from 'oxlint-config-shared';

export default {
  lint: {
    extends: [preset],
    jsPlugins: ['eslint-plugin-missing'],
  },
  test: {
    coverage: { provider: 'v8' },
  },
};
