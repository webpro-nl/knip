import assert from 'node:assert/strict';
import { createGraphExplorer } from '../../src/graph-explorer/explorer.ts';
import { run } from '../../src/run.ts';
import { buildFileDescriptor } from '../../src/session/file-descriptor.ts';
import { createSession } from '../../src/session/session.ts';
import { join } from '../../src/util/path.ts';
import { createOptions } from '../helpers/create-options.ts';

export const describeFile = async (cwd: string, relativePath: string) => {
  const options = await createOptions({ cwd, isSession: true });
  const session = await createSession(options);
  const filePath = join(options.cwd, relativePath);
  const descriptor = session.describeFile(filePath);
  assert.ok(descriptor, `missing descriptor for ${relativePath}`);
  return { file: descriptor, cwd: options.cwd };
};

export const createDescriber = async (cwd: string) => {
  const options = await createOptions({ cwd, isSession: true });
  const { session } = await run(options);
  assert.ok(session, `missing session for ${cwd}`);
  const graph = session.getGraph();
  const entryPaths = session.getEntryPaths();
  const describeFile = (relativePath: string) => {
    const descriptor = buildFileDescriptor(join(options.cwd, relativePath), options.cwd, graph, entryPaths);
    assert.ok(descriptor, `missing descriptor for ${relativePath}`);
    return descriptor;
  };
  return { cwd: options.cwd, graph, explorer: createGraphExplorer(graph, entryPaths), describeFile };
};
