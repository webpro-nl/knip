import { hasDependency } from '../../util/plugin.js';
import type { IsPluginEnabledCallback } from '../../types/plugins.js';

// https://docs.astro.build/en/reference/configuration-reference/

export const NAME = 'astro';

/** @public */
export const ENABLERS = ['astro'];

export const isEnabled: IsPluginEnabledCallback = ({ dependencies }) => hasDependency(dependencies, ENABLERS);

export const ENTRY_FILE_PATTERNS = ['astro.config.{js,cjs,mjs,ts}', 'src/content/config.ts'];

export const PRODUCTION_ENTRY_FILE_PATTERNS = ['src/pages/**/*.{astro,md,mdx,html,js,ts}'];

export const PROJECT_FILE_PATTERNS = ['src/**/*'];
