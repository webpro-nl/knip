import type { IsPluginEnabled, Plugin } from '../../types/config.ts';
import { hasDependency } from '../../util/plugin.ts';

// https://mastra.ai/reference/project-structure
// https://mastra.ai/docs/develop
// https://github.com/mastra-ai/mastra/blob/368336f3519ffed7c7b0abdef272249bcd6ce589/packages/deployer/src/build/fs-routing/discover.ts
// https://github.com/mastra-ai/mastra/blob/368336f3519ffed7c7b0abdef272249bcd6ce589/packages/deployer/src/bundler/index.ts#L529-L550

const title = 'Mastra';

const enablers = ['mastra'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const extensions = '{js,ts}';

const agentRoots = 'src/mastra/agents/*/*(subagents/*/)';

const production = [
  `src/mastra/index.${extensions}`,
  'src/mastra/{storage,observability,logger,server,studio}.{js,ts,mjs,mts}',
  `src/mastra/workflows/*.${extensions}`,
  `src/mastra/{,agents/*/}tools/**/*.${extensions}`,
  `${agentRoots}{config,instructions,memory,workspace}.${extensions}`,
  `${agentRoots}{tools,scorers,skills,processors/input,processors/output}/*.${extensions}`,
  `${agentRoots}schedules/**/*.${extensions}`,
  `!src/mastra/**/*.{test,spec}.${extensions}`,
  '!src/mastra/**/__tests__/**',
];

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  production,
};

export default plugin;
