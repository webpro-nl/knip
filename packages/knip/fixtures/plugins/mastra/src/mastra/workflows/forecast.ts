import { createWorkflow } from '@mastra/core/workflows';
import { z } from 'zod';

export default createWorkflow({
  id: 'forecast',
  inputSchema: z.object({ city: z.string() }),
  outputSchema: z.object({ summary: z.string() }),
}).commit();
