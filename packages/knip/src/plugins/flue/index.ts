import type { IsPluginEnabled, Plugin, ResolveFromAST } from '../../types/config.ts';
import { collectFirstPropertyValue } from '../../typescript/ast-helpers.ts';
import { isDirectory } from '../../util/fs.ts';
import { type Input, toEntryPath, toEntry } from '../../util/input.ts';
import { join } from '../../util/path.ts';
import { hasDependency } from '../../util/plugin.ts';

// https://flueframework.com/docs/reference/configuration/
// https://flueframework.com/docs/guide/project-layout

const title = 'Flue';

const enablers = ['@flue/runtime'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['flue.config.{ts,mts,mjs,js,cjs,cts}'];

const extensions = '{ts,mts,js,mjs}';

const entryNames = ['app', 'db', 'cloudflare'];

const agentsPattern = `{agent,agents/*,agents/*/agent}.${extensions}`;

const production = [`{.flue/,src/,}{app,db,cloudflare}.${extensions}`, `{.flue/,src/,}${agentsPattern}`];

const getSourceRoot = (dir: string) => {
  for (const name of ['.flue', 'src']) if (isDirectory(dir, name)) return join(dir, name);
  return dir;
};

const resolveFromAST: ResolveFromAST = (program, { configFileDir }) => {
  const sourceRoot = getSourceRoot(configFileDir);
  const inputs: Input[] = [];

  for (const name of entryNames) {
    const filePath = collectFirstPropertyValue(program, name);
    if (filePath) inputs.push(toEntryPath(join(configFileDir, filePath), { production: true }));
    else inputs.push(toEntry(join(sourceRoot, `${name}.${extensions}`), { production: true }));
  }

  const agents = collectFirstPropertyValue(program, 'agents') ?? agentsPattern;
  inputs.push(toEntry(join(sourceRoot, agents), { production: true }));

  return inputs;
};

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  config,
  production,
  resolveFromAST,
};

export default plugin;
