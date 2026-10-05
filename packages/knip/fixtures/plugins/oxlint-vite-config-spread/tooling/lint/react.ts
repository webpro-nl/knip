import type { OxlintOverride } from 'vite-plus/lint';

export const reactLint = {
  jsPlugins: ['eslint-plugin-react-hooks'],
} satisfies Omit<OxlintOverride, 'files'>;
