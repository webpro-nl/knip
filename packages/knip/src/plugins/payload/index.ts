import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.js';
import { toDeferResolve } from '../../util/input.js';
import { hasDependency } from '../../util/plugin.js';

// https://payloadcms.com/docs/getting-started/what-is-payload

const title = 'Payload CMS';

const enablers = ['payload'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const entry = [
  'app/**/importMap.{js,ts}',
  'src/app/**/importMap.{js,ts}',
  'src/payload-types.ts',
];

const project = ['!src/migrations/**/*.ts'];

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  entry,
  project,
};

export default plugin;
