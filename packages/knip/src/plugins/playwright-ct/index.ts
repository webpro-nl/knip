import { hasDependency } from '#p/util/plugin.js';
import { resolveConfig, entry, resolveEntryPaths } from '../playwright/index.js';
import type { IsPluginEnabled } from '#p/types/plugins.js';

// https://playwright.dev/docs/test-components

const title = 'Playwright for components';

const enablers = [/^@playwright\/experimental-ct-/];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['playwright-ct.config.{js,ts}', 'playwright/index.{js,ts,jsx,tsx}'];

export default {
  title,
  enablers,
  isEnabled,
  config,
  entry,
  resolveEntryPaths,
  resolveConfig,
};
