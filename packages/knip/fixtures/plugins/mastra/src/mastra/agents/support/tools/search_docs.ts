import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { searchIndex } from '../lib/docs-index.ts';

export default createTool({
  id: 'search_docs',
  description: 'Search the documentation',
  inputSchema: z.object({ query: z.string() }),
  execute: async ({ query }) => searchIndex(query),
});
