import { hasDependency } from '../../util/plugin.js';
import type { IsPluginEnabledCallback } from '../../types/plugins.js';

// https://playwright.dev/docs/test-configuration

export const NAME = 'Playwright';

/** @public */
export const ENABLERS = ['@playwright/test'];

export const isEnabled: IsPluginEnabledCallback = ({ dependencies }) => hasDependency(dependencies, ENABLERS);

// Note that `TEST_FILE_PATTERNS` in src/constants.ts are already included by default
export const ENTRY_FILE_PATTERNS = ['playwright.config.{js,ts}'];
