import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.js';
import { toDependency } from '../../util/input.js';
import { hasDependency } from '../../util/plugin.js';
import type { WebdriverIOConfig } from './types.js';

// https://webdriver.io/docs/configuration

const title = 'WebdriverIO';

const enablers = ['@wdio/cli'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['wdio.conf.{js,ts}'];

const resolveConfig: ResolveConfig<WebdriverIOConfig> = async config => {
  const cfg = config?.config;
  if (!cfg) return [];

  const frameworks = cfg?.framework ? [`@wdio/${cfg.framework}-framework`] : [];

  const runners =
    cfg?.runner && cfg.runner !== 'local'
      ? [`@wdio/${Array.isArray(cfg.runner) ? cfg.runner[0] : cfg.runner}-runner`]
      : [];

  const reporters = cfg?.reporters
    ? cfg.reporters
        .flatMap(reporter => {
          if (typeof reporter === 'string') return [reporter];
          if (Array.isArray(reporter) && typeof reporter[0] === 'string') return [reporter[0]];
          return [];
        })
        .map(reporter => `@wdio/${reporter}-reporter`)
    : [];

  return [...frameworks, ...runners, ...reporters].map(id => toDependency(id));
};

export default {
  title,
  enablers,
  isEnabled,
  config,
  resolveConfig,
} satisfies Plugin;
