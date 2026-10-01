import type { IsPluginEnabled, Plugin, RegisterVisitors } from '../../types/config.ts';
import { hasDependency } from '../../util/plugin.ts';
import { createCustomElementVisitor } from '../_custom-elements/custom-element-visitor.ts';

// https://lit.dev

const title = 'Lit';

const enablers = ['lit', 'lit-element', '@lit/reactive-element'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

/** Specifiers from which a `customElement` import is a genuine Lit decorator. */
const isLitDecoratorsSpecifier = (specifier: string): boolean =>
  specifier === 'lit/decorators.js' ||
  specifier === 'lit/decorators' ||
  specifier.startsWith('lit/decorators/') ||
  specifier === '@lit/reactive-element/decorators.js' ||
  specifier === '@lit/reactive-element/decorators' ||
  specifier.startsWith('@lit/reactive-element/decorators/') ||
  specifier === 'lit-element' ||
  specifier === 'lit-element/decorators.js' ||
  specifier === 'lit-element/decorators' ||
  specifier.startsWith('lit-element/decorators/');

const registerVisitors: RegisterVisitors = ({ ctx, registerVisitor }) => {
  registerVisitor(createCustomElementVisitor(ctx, isLitDecoratorsSpecifier));
};

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  registerVisitors,
};

export default plugin;
