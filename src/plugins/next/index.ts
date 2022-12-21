import type { IsPluginEnabledCallback } from '../../types/plugins.js';

// https://nextjs.org/docs/basic-features/pages

export const isEnabled: IsPluginEnabledCallback = ({ dependencies }) => {
  return dependencies.has('next');
};

export const ENTRY_FILE_PATTERNS = ['next.config.{js,ts}'];

export const PRODUCTION_ENTRY_FILE_PATTERNS = ['pages/**/*.{js,jsx,ts,tsx}', 'src/pages/**/*.{js,jsx,ts,tsx}'];
