import type { IsPluginEnabledCallback } from '../../types/plugins.js';

// https://rollupjs.org/guide/en/#configuration-files

export const NAME = 'Rollup';

/** @public */
export const ENABLERS = ['rollup'];

export const isEnabled: IsPluginEnabledCallback = ({ dependencies }) =>
  ENABLERS.some(enabler => dependencies.has(enabler));

export const ENTRY_FILE_PATTERNS = ['rollup.config.{js,mjs,ts}'];
