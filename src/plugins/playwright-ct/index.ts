import { hasDependency } from '../../util/plugin.js';
import type { IsPluginEnabledCallback } from '../../types/plugins.js';

// https://playwright.dev/docs/test-components

export const NAME = 'Playwright for components';

/** @public */
export const ENABLERS = [/^@playwright\/experimental-ct-/];

export const isEnabled: IsPluginEnabledCallback = ({ dependencies }) => hasDependency(dependencies, ENABLERS);

// `TEST_FILE_PATTERNS` in src/constants.ts are already included by default
export const ENTRY_FILE_PATTERNS = ['playwright-ct.config.{js,ts}', 'playwright/index.{js,ts,jsx,tsx}'];
