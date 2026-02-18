import type { IsPluginEnabled, Plugin } from '../../types/config.js';
import { hasDependency } from '../../util/plugin.js';

// https://payloadcms.com/docs/getting-started/what-is-payload

const title = 'Payload CMS';

const enablers = ['payload'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const entry = [
  'app/**/importMap.js',
  'src/app/**/importMap.js',
  'payload-types.ts',
  'src/payload-types.ts',
  'payload.config.ts',
  'src/payload.config.ts',
];

const project = ['!migrations/**', '!src/migrations/**'];

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  entry,
  project,
};

export default plugin;
