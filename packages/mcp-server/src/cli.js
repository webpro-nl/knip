#!/usr/bin/env node
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { mcpServer } from './server.js';

function disconnect() {
  mcpServer.close();
  process.exitCode = 0;
}

await mcpServer.connect(new StdioServerTransport());

process.on('SIGINT', disconnect);
process.on('SIGTERM', disconnect);
