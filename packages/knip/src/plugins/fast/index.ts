import type { IsPluginEnabled, Plugin, RegisterVisitors } from '../../types/config.ts';
import { hasDependency } from '../../util/plugin.ts';
import { createCustomElementVisitor } from '../_custom-elements/custom-element-visitor.ts';

// https://fast.design

const title = 'FAST';

const enablers = ['@microsoft/fast-element'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const isFastSpecifier = (specifier: string): boolean => specifier === '@microsoft/fast-element';

const registerVisitors: RegisterVisitors = ({ ctx, registerVisitor }) => {
  registerVisitor(createCustomElementVisitor(ctx, isFastSpecifier, { baseClassName: 'FASTElement' }));
};

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  registerVisitors,
};

export default plugin;
