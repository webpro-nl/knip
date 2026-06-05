import type { IsPluginEnabled, Plugin, RegisterVisitors } from '../../types/config.ts';
import { hasDependency } from '../../util/plugin.ts';
import { createCustomElementVisitor } from '../_custom-elements/custom-element-visitor.ts';

// https://catalyst.rocks

const title = 'Catalyst';

const enablers = ['@github/catalyst'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const isCatalystSpecifier = (specifier: string): boolean => specifier === '@github/catalyst';

const registerVisitors: RegisterVisitors = ({ ctx, registerVisitor }) => {
  registerVisitor(createCustomElementVisitor(ctx, isCatalystSpecifier, { decoratorName: 'controller' }));
};

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  registerVisitors,
};

export default plugin;
