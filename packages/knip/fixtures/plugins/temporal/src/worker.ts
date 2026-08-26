import { join } from 'node:path';
import { Worker } from '@temporalio/worker';
import * as activities from './activities/index.ts';

const resolveWorkflowsPath = () => join(process.cwd(), 'src', 'workflows');

export async function run() {
  const worker = await Worker.create({
    workflowsPath: resolveWorkflowsPath(),
    activities,
  });
  await worker.run();
}
