import type { IsPluginEnabled, Plugin } from '../../types/config.ts';
import { hasDependency } from '../../util/plugin.ts';

// https://lit.dev

const title = 'Lit';

const enablers = ['lit', 'lit-element', '@lit/reactive-element'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  nativeVisitors: ['lit'],
};

export default plugin;
