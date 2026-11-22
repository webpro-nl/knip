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
  SERVER_INSTRUCTIONS,
  WORKFLOW,
} from './texts.js';
import { getDocs, getErrorMessage, getResults } from './tools.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf-8'));

const DOCS = 'knip://docs';

const RUN_OUTPUT_SCHEMA = {
  reviewHint: z.string().optional(),
  versionHint: z.string().optional(),
  knipVersion: z.string(),
  projectKnipVersion: z.string().optional(),
  maybeUnconfigured: z.boolean(),
  truncated: z.boolean(),
  configurationHints: z.array(
    z.looseObject({ type: z.string(), identifier: z.string(), message: z.string().optional() })
  ),
  docs: z.array(z.string()),
  counters: z.record(z.string(), z.number()),
  totalIssues: z.number(),
  configFile: z.looseObject({
    exists: z.boolean(),
    filePath: z.string().optional(),
    locations: z.array(z.string()).optional(),
  }),
  enabledPlugins: z.record(z.string(), z.array(z.string())),
  files: z.array(z.string()),
  issues: z.record(
    z.string(),
    z.array(
      z.looseObject({
        file: z.string(),
        symbol: z.string(),
        line: z.number().optional(),
        parent: z.string().optional(),
      })
    )
  ),
};

class MCP {
  constructor() {
    this.server = new McpServer({ name: 'Knip', version: pkg.version }, { instructions: SERVER_INSTRUCTIONS });
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
        async () => {
          const result = getDocs(id);
          const text = 'content' in result ? result.content : result.error;
          return { contents: [{ uri, mimeType: 'text/markdown', text }] };
        }
      );
    }

    this.server.registerResource(
      'docs',
      new ResourceTemplate(`${DOCS}/{+path}`, { list: undefined }),
      { description: 'Get Knip documentation page by path', mimeType: 'text/markdown' },
      async (uri, { path }) => {
        const result = getDocs(String(path));
        if ('content' in result)
          return { contents: [{ uri: uri.href, mimeType: 'text/markdown', text: result.content }] };
        return { contents: [{ uri: uri.href, mimeType: 'text/plain', text: result.error }] };
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
          workspace: z.array(z.string()).optional().describe('Scope run to array of workspaces'),
        },
        outputSchema: RUN_OUTPUT_SCHEMA,
      },
      async opts => {
        try {
          const cwd = opts.cwd || process.cwd();
          const results = await getResults(cwd, opts.workspace);
          // Serialized JSON in text content for clients that don't support structured content
          return { content: [{ type: 'text', text: JSON.stringify(results) }], structuredContent: results };
        } catch (error) {
          const message = getErrorMessage(error);
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
