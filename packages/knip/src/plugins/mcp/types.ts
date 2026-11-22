type MCPServer = {
  command?: string;
  args?: string[];
  cwd?: string;
};

export type MCPConfig = {
  mcpServers?: Record<string, MCPServer>;
  servers?: Record<string, MCPServer>;
  mcp_servers?: Record<string, MCPServer>;
};
