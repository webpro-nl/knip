import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.ts';
import { toModule, toDependency, toEntry } from '../../util/input.ts';
import { isInternal, join } from '../../util/path.ts';
import { hasDependency } from '../../util/plugin.ts';
import { extractFunctionsConfigProperty } from './helpers.ts';
import type { NetlifyConfig } from './types.ts';

// https://docs.netlify.com
// https://docs.netlify.com/functions/get-started/
// https://github.com/netlify/build/blob/dee2dd2fb2773192e3cf4a0c75edecf0a661eaed/packages/edge-bundler/node/finder.ts
// https://github.com/netlify/build/blob/d5f4f4b6b9dc08bb3b9641b0e547c46d9c045662/packages/build/src/plugins_core/build_command.js

const title = 'Netlify';

const enablers = [/^@netlify\/plugin-/, 'netlify-cli', '@netlify/functions', '@netlify/edge-functions'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['netlify.toml'];

const NETLIFY_FUNCTIONS_DIR = 'netlify/functions';
const NETLIFY_FUNCTIONS_EXTS = 'js,mjs,cjs,ts,mts,cts';
const NETLIFY_EDGE_FUNCTIONS_DIR = 'netlify/edge-functions';
const NETLIFY_EDGE_FUNCTIONS_EXTS = 'js,jsx,mjs,mts,ts,tsx';

const toEdgeFunctionPatterns = (dir: string) => [
  join(dir, `*.{${NETLIFY_EDGE_FUNCTIONS_EXTS}}`),
  join(dir, `*/index.{${NETLIFY_EDGE_FUNCTIONS_EXTS}}`),
];

const production = [
  `${NETLIFY_FUNCTIONS_DIR}/**/*.{${NETLIFY_FUNCTIONS_EXTS}}`,
  ...toEdgeFunctionPatterns(NETLIFY_EDGE_FUNCTIONS_DIR),
];

const toPluginInput = (id: string) => {
  const specifier = id.startsWith('/') ? `.${id}` : id;
  return isInternal(specifier) ? toModule(specifier) : toDependency(id);
};

const resolveConfig: ResolveConfig<NetlifyConfig> = async (localConfig, options) => {
  const command = localConfig.build?.command;
  const inputs = command ? options.getInputsFromScripts(command, { optionalBinaries: true }) : [];
  return [
    ...extractFunctionsConfigProperty(localConfig.functions || {}, 'included_files'),
    join(localConfig.functions?.directory ?? NETLIFY_FUNCTIONS_DIR, `**/*.{${NETLIFY_FUNCTIONS_EXTS}}`),
    ...toEdgeFunctionPatterns(localConfig.build?.edge_functions ?? NETLIFY_EDGE_FUNCTIONS_DIR),
  ]
    .filter(file => !file.startsWith('!'))
    .map(id => toEntry(id, { production: true }))
    .concat([
      ...(localConfig?.plugins?.map(plugin => plugin.package) ?? []).map(toPluginInput),
      ...extractFunctionsConfigProperty(localConfig.functions || {}, 'external_node_modules').map(id =>
        toDependency(id, { production: true })
      ),
      ...inputs,
    ]);
};

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  config,
  production,
  resolveConfig,
};

export default plugin;
