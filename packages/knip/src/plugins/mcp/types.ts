type MCPServer = {
  command?: string;
  args?: string[];
};

export type MCPConfig = {
  mcpServers?: Record<string, MCPServer>;
  servers?: Record<string, MCPServer>;
};
