import type { IsPluginEnabled, Plugin } from '../../types/config.js';
import { hasDependency } from '../../util/plugin.js';
import { resolveConfig } from '../playwright/index.js';

// https://playwright.dev/docs/test-components

const title = 'Playwright for components';

const enablers = [/^@playwright\/experimental-ct-/];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['playwright-ct.config.{js,ts}'];

const entry = ['**/*.@(spec|test).?(c|m)[jt]s?(x)', 'playwright/index.{js,ts,jsx,tsx}'];

export default {
  title,
  enablers,
  isEnabled,
  config,
  entry,
  resolveConfig,
} satisfies Plugin;
