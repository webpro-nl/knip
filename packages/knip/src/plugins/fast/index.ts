import type { IsPluginEnabled, Plugin, RegisterVisitors } from '../../types/config.ts';
import { hasDependency } from '../../util/plugin.ts';
import { createCustomElementDecoratorVisitor } from '../_custom-elements/decorator-visitor.ts';

// https://fast.design

const title = 'FAST';

const enablers = ['@microsoft/fast-element'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

/** FAST's `customElement` decorator is exported from `@microsoft/fast-element`. */
const isFastDecoratorsSpecifier = (specifier: string): boolean => specifier === '@microsoft/fast-element';

const registerVisitors: RegisterVisitors = ({ ctx, registerVisitor }) => {
  registerVisitor(createCustomElementDecoratorVisitor(ctx, isFastDecoratorsSpecifier));
};

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  registerVisitors,
};

export default plugin;
