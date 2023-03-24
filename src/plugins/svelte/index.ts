import { hasDependency } from '../../util/plugin.js';
import type { IsPluginEnabledCallback } from '../../types/plugins.js';

// https://kit.svelte.dev/docs

export const NAME = 'Svelte';

/** @public */
export const ENABLERS = ['svelte'];

export const isEnabled: IsPluginEnabledCallback = ({ dependencies }) => hasDependency(dependencies, ENABLERS);

export const ENTRY_FILE_PATTERNS = ['svelte.config.js', 'vite.config.ts'];

export const PRODUCTION_ENTRY_FILE_PATTERNS = [
  'src/routes/**/+{page,page.server,error,layout,layout.server}{,@*}.{js,ts,svelte}',
];

export const PROJECT_FILE_PATTERNS = ['src/**/*.{js,ts,svelte}'];
