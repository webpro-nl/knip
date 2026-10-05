import { settings } from './settings.ts';

export default {
  lint: {
    settings,
    overrides: [{ settings: { 'import/parsers': { 'eslint-plugin-react-hooks': ['.ts'] } } }],
  },
};
