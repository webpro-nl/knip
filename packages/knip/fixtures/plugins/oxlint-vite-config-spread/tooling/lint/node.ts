import type { OxlintOverride } from 'vite-plus/lint';

export const nodeLint = {
  jsPlugins: [{ name: 'server', specifier: './tooling/lint/oxlint-plugin-server.ts' }],
} satisfies Omit<OxlintOverride, 'files'>;
