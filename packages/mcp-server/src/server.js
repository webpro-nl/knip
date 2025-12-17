process.env.NO_COLOR = '1';

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { CURATED_RESOURCES } from './curated-resources.js';
import {
  DOC_TOOL_DESCRIPTION,
  DOC_TOOL_TOPIC_DESCRIPTION,
  ERROR_HINT,
  RUN_KNIP_TOOL_DESCRIPTION,
  WORKFLOW,
} from './texts.js';
import { getDocs, readContent } from './tools.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf-8'));

const DOCS = 'knip://docs';

class MCP {
  constructor() {
    this.server = new McpServer({ name: 'Knip', version: pkg.version });
    this.#registerPrompts();
    this.#registerResources();
    this.#registerTools();
  }

  #registerPrompts() {
    const resources = Object.entries(CURATED_RESOURCES).map(([id, doc]) => ({
      uri: `${DOCS}/${id}`,
      name: doc.name,
      description: doc.description,
    }));

    this.server.registerPrompt(
      'knip-configure',
      {
        description: 'Set up and optimize Knip configuration. Guides through initial setup and iterative refinement.',
        arguments: [{ name: 'cwd', description: 'Working directory (default: current directory)', required: false }],
      },
      async ({ cwd }) => ({
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Help me configure Knip for ${cwd || 'this project'}.\n\n${WORKFLOW}`,
            },
          },
        ],
        resources,
      })
    );
  }

  #registerResources() {
    for (const [id, doc] of Object.entries(CURATED_RESOURCES)) {
      const uri = `${DOCS}/${id}`;
      this.server.registerResource(
        doc.name,
        uri,
        { description: doc.description, mimeType: 'text/markdown' },
        async () => ({ contents: [{ uri, mimeType: 'text/markdown', text: readContent(doc.path) }] })
      );
    }

    this.server.registerResource(
      'docs',
      new ResourceTemplate(`${DOCS}/{+path}`, { list: undefined }),
      { description: 'Get Knip documentation page by path', mimeType: 'text/markdown' },
      async (uri, { path }) => {
        const result = getDocs(path);
        if ('content' in result) return { content: [{ type: 'text', text: result.content }] };
        const errorText = `Documentation not found: ${path}`;
        return { contents: [{ uri, mimeType: 'text/plain', text: errorText }] };
      }
    );
  }

  #registerTools() {
    this.server.registerTool(
      'knip-run',
      {
        description: RUN_KNIP_TOOL_DESCRIPTION,
        inputSchema: {
          cwd: z.string().optional().describe('Working directory (default: workspace root)'),
        },
      },
      async opts => {
        try {
          const cwd = opts.cwd || process.cwd();
          const results = await getResults(cwd);
          return { content: [{ type: 'text', text: JSON.stringify(results) }] };
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          return {
            content: [{ type: 'text', text: JSON.stringify({ error: message, hint: ERROR_HINT }) }],
            isError: true,
          };
        }
      }
    );

    this.server.registerTool(
      'knip-docs',
      { description: DOC_TOOL_DESCRIPTION, inputSchema: { topic: z.string().describe(DOC_TOOL_TOPIC_DESCRIPTION) } },
      async ({ topic }) => {
        const docs = getDocs(topic);
        if ('content' in docs) return { content: [{ type: 'text', text: docs.content }] };
        return { content: [{ type: 'text', text: docs.error }], isError: true };
      }
    );
  }

  connect(transport) {
    return this.server.connect(transport);
  }

  close() {
    return this.server.close();
  }
}

const mcpServer = new MCP();

export { mcpServer };
