import type { IsPluginEnabled, Plugin } from '../../types/config.js';
import { hasDependency } from '../../util/plugin.js';
import { entry, resolveConfig } from '../playwright/index.js';

// https://playwright.dev/docs/test-components

const title = 'Playwright for components';

const enablers = [/^@playwright\/experimental-ct-/];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['playwright-ct.config.{js,ts}', 'playwright/index.{js,ts,jsx,tsx}'];

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  config,
  entry,
  resolveConfig,
};

export default plugin;
