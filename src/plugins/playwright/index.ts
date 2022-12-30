import type { IsPluginEnabledCallback } from '../../types/plugins.js';

// https://playwright.dev/docs/test-configuration

export const NAME = 'Playwright';

/** @public */
export const ENABLERS = ['@playwright/test'];

export const isEnabled: IsPluginEnabledCallback = ({ dependencies }) =>
  ENABLERS.some(enabler => dependencies.has(enabler));

export const ENTRY_FILE_PATTERNS = ['playwright.config.{js,ts}', '.*{test,spec}.{js,ts,mjs}'];
