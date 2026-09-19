import type { IsPluginEnabled, Plugin } from '../../types/config.ts';
import { hasDependency } from '../../util/plugin.ts';

// https://eve.dev/docs/reference/agent-files

const title = 'eve';

const enablers = ['eve'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const extensions = '{js,jsx,ts,tsx,mjs,cjs,mts,cts}';

const agentRoots = '{,agent/,agents/*/,agents/*/agent/}';

const subagentRoots = `${agentRoots}+(subagents/*/|extensions/*/subagents/*/)`;

const extensionMounts = `{${agentRoots},${subagentRoots}}extensions/*`;

const rootAgentFileNames = '{agent,instructions,instrumentation,memory,sandbox}';

const rootAgentDirectories = '{channels,connections,hooks,skills,tools,schedules}';

const subagentFileNames = '{agent,instructions,memory,sandbox}';

const subagentDirectories = '{connections,hooks,skills,tools}';

const entry = ['{evals,agents/*/evals}/evals.config.ts', '{evals,agents/*/evals}/**/*.eval.ts'];

const production = [
  `${agentRoots}${rootAgentFileNames}.${extensions}`,
  `${agentRoots}{instructions,instrumentation,memory}/*.${extensions}`,
  `${agentRoots}sandbox/sandbox.${extensions}`,
  `${agentRoots}sandbox/workspace/**/*.${extensions}`,
  `${agentRoots}${rootAgentDirectories}/**/*.${extensions}`,
  `${agentRoots}subagents/*.${extensions}`,
  `${subagentRoots}subagents/*.${extensions}`,
  `${subagentRoots}${subagentFileNames}.${extensions}`,
  `${subagentRoots}{instructions,memory}/*.${extensions}`,
  `${subagentRoots}sandbox/sandbox.${extensions}`,
  `${subagentRoots}sandbox/workspace/**/*.${extensions}`,
  `${subagentRoots}${subagentDirectories}/**/*.${extensions}`,
  `${extensionMounts}.${extensions}`,
  `${extensionMounts}/{extension,instructions}.${extensions}`,
  `${extensionMounts}/instructions/*.${extensions}`,
  `${extensionMounts}/${rootAgentDirectories}/**/*.${extensions}`,
  `${extensionMounts}/subagents/*.${extensions}`,
];

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  entry,
  production,
};

export default plugin;
