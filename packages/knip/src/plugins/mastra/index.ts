import { join } from '../../util/path.ts';
import type { Args } from '../../types/args.ts';
import type { IsPluginEnabled, Plugin } from '../../types/config.ts';
import { isDirectory } from '../../util/fs.ts';
import { toProductionEntry } from '../../util/input.ts';
import { hasDependency } from '../../util/plugin.ts';

// https://mastra.ai/reference/project-structure
// https://mastra.ai/docs/develop
// https://github.com/mastra-ai/mastra/blob/368336f3519ffed7c7b0abdef272249bcd6ce589/packages/deployer/src/build/fs-routing/discover.ts
// https://github.com/mastra-ai/mastra/blob/368336f3519ffed7c7b0abdef272249bcd6ce589/packages/deployer/src/bundler/index.ts#L529-L597

const title = 'Mastra';

const enablers = ['mastra'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const extensions = '{js,ts}';

const defaultDir = 'src/mastra';

// `mastra dev` and `mastra build` discover the entry file and the file-based agents, tools and workflows
// from the Mastra folder (`src/mastra`, or `--dir`). `mastra start --dir` points at the build output instead.
const discoveryCommands = new Set(['dev', 'build']);

const getProductionPatterns = (dir: string) => {
  const agentRoots = `${dir}/agents/*/*(subagents/*/)`;
  return [
    `${dir}/index.${extensions}`,
    `${dir}/{storage,observability,logger,server,studio}.{js,ts,mjs,mts}`,
    `${dir}/workflows/*.${extensions}`,
    `${dir}/{,agents/*/}tools/**/*.${extensions}`,
    `${agentRoots}{config,instructions,memory,workspace}.${extensions}`,
    `${agentRoots}{tools,scorers,skills,processors/input,processors/output}/*.${extensions}`,
    `${agentRoots}schedules/**/*.${extensions}`,
    `!${dir}/**/*.{test,spec}.${extensions}`,
    `!${dir}/**/__tests__/**`,
  ];
};

const production = getProductionPatterns(defaultDir);

const args: Args = {
  binaries: ['mastra'],
  string: ['dir', 'tools'],
  alias: { dir: ['d'], tools: ['t'] },
  resolveInputs: (parsed, { cwd }) => {
    if (!discoveryCommands.has(parsed._[0])) return [];
    const inputs = [];
    if (parsed.dir) {
      for (const pattern of getProductionPatterns(parsed.dir)) inputs.push(toProductionEntry(pattern));
    }
    if (parsed.tools) {
      // `--tools` takes a comma-separated list of tool files, globs or directories; Mastra bundles each match
      // as its own input and imports them all from the generated `tools.mjs`, so each is an entry file.
      for (const tool of String(parsed.tools).split(',')) {
        const specifier = tool.trim();
        if (!specifier) continue;
        const pattern = isDirectory(join(cwd, specifier)) ? `${specifier}/index.${extensions}` : specifier;
        inputs.push(toProductionEntry(pattern));
      }
    }
    return inputs;
  },
};

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  production,
  args,
};

export default plugin;
