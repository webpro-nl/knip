import type { IsPluginEnabledCallback } from '../../types/plugins.js';

// https://nextjs.org/docs/basic-features/pages

export const NAME = 'Next.js';

/** @public */
export const ENABLERS = ['next'];

export const isEnabled: IsPluginEnabledCallback = ({ dependencies }) =>
  ENABLERS.some(enabler => dependencies.has(enabler));

export const ENTRY_FILE_PATTERNS = ['next.config.{js,ts}'];

export const PRODUCTION_ENTRY_FILE_PATTERNS = ['pages/**/*.{js,jsx,ts,tsx}', 'src/pages/**/*.{js,jsx,ts,tsx}'];
