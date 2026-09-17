import type { IsPluginEnabled, Plugin } from '../../types/config.ts';
import { hasDependency } from '../../util/plugin.ts';

// https://eve.dev/docs/reference/agent-files

const title = 'eve';

const enablers = ['eve'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const extensions = '{js,jsx,ts,tsx,mjs,cjs,mts,cts}';

const agentRoots = '{,agent/,agents/*/,agents/*/agent/}';

const rootAgentFileNames = '{agent,instructions,instrumentation,memory,sandbox}';

const rootAgentDirectories = '{channels,connections,extensions,hooks,skills,tools,schedules}';

const subagentFileNames = '{agent,instructions,memory,sandbox}';

const subagentDirectories = '{connections,extensions,hooks,skills,tools}';

const entry = ['{evals,agents/*/evals}/evals.config.ts', '{evals,agents/*/evals}/**/*.eval.ts'];

const production = [
  `${agentRoots}${rootAgentFileNames}.${extensions}`,
  `${agentRoots}{instructions,instrumentation,memory}/*.${extensions}`,
  `${agentRoots}sandbox/sandbox.${extensions}`,
  `${agentRoots}sandbox/workspace/**/*.${extensions}`,
  `${agentRoots}${rootAgentDirectories}/**/*.${extensions}`,
  `${agentRoots}subagents/*.${extensions}`,
  `${agentRoots}subagents/**/subagents/*.${extensions}`,
  `${agentRoots}subagents/**/${subagentFileNames}.${extensions}`,
  `${agentRoots}subagents/**/{instructions,memory}/*.${extensions}`,
  `${agentRoots}subagents/**/sandbox/sandbox.${extensions}`,
  `${agentRoots}subagents/**/sandbox/workspace/**/*.${extensions}`,
  `${agentRoots}subagents/**/${subagentDirectories}/**/*.${extensions}`,
];

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  entry,
  production,
};

export default plugin;
