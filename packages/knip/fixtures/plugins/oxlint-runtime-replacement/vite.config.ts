import preset, { overrides } from './preset.ts';

const base = { jsPlugins: ['eslint-plugin-regexp'] };

export default {
  lint: {
    ...base,
    ...preset,
    jsPlugins: [],
    overrides: [...overrides],
  },
};
