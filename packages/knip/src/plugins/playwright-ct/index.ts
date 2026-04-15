import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.ts';
import { type Input, toEntry } from '../../util/input.ts';
import { hasDependency } from '../../util/plugin.ts';
import { entry as playwrightEntry, resolveConfig as playwrightResolveConfig } from '../playwright/index.ts';
import type { PlaywrightTestConfig } from '../playwright/types.ts';

// https://playwright.dev/docs/test-components

const title = 'Playwright for components';

const enablers = [/^@playwright\/experimental-ct-/];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['playwright-ct.config.{js,ts}'];

const ctEntry = 'playwright/index.{js,ts,jsx,tsx}';

const entry = [...playwrightEntry, ctEntry];

const resolveConfig: ResolveConfig<PlaywrightTestConfig> = async (localConfig, options) => {
  const inputs: Input[] = await playwrightResolveConfig(localConfig, options);
  inputs.push(toEntry(ctEntry));
  return inputs;
};

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  config,
  entry,
  resolveConfig,
};

export default plugin;
