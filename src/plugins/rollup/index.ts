import type { IsPluginEnabledCallback } from '../../types/plugins.js';

// https://rollupjs.org/guide/en/#configuration-files

export const isEnabled: IsPluginEnabledCallback = ({ dependencies }) => dependencies.has('rollup');

export const ENTRY_FILE_PATTERNS = ['rollup.config.{js,mjs,ts}'];
