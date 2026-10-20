import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.ts';
import { isFile } from '../../util/fs.ts';
import type { MCPConfig } from './types.ts';

// https://modelcontextprotocol.io/docs/develop/connect-local-servers
// https://code.claude.com/docs/en/mcp#project-scope
// https://cursor.com/docs/context/mcp#configuration-locations
// https://code.visualstudio.com/docs/copilot/reference/mcp-configuration

const title = 'MCP';

const enablers = 'This plugin is enabled when `.mcp.json`, `.cursor/mcp.json` or `.vscode/mcp.json` is found.';

const isRootOnly = true;

const config = ['.mcp.json', '.cursor/mcp.json', '.vscode/mcp.json'];

const isEnabled: IsPluginEnabled = ({ cwd }) => config.some(file => isFile(cwd, file));

const resolveConfig: ResolveConfig<MCPConfig> = async (localConfig, options) => {
  const { cwd, getInputsFromScripts } = options;
  const servers = { ...localConfig.mcpServers, ...localConfig.servers };
  const scripts: string[] = [];
  for (const server of Object.values(servers)) {
    if (typeof server?.command === 'string') scripts.push([server.command, ...(server.args ?? [])].join(' '));
  }
  const inputs = getInputsFromScripts(scripts, { optionalBinaries: true });
  for (const input of inputs) input.dir = cwd;
  return inputs;
};

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  isRootOnly,
  config,
  resolveConfig,
};

export default plugin;
