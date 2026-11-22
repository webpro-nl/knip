import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

export default createTool({
  id: 'classify',
  description: 'Classify a ticket',
  inputSchema: z.object({ ticket: z.string() }),
  execute: async () => ({ label: 'billing' }),
});
