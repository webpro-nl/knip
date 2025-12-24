import assert from 'node:assert/strict';
import test from 'node:test';
import { createGraphExplorer } from '../src/graph-explorer/explorer.js';
import { run } from '../src/run.js';
import { createSession } from '../src/session/session.js';
import { createOptions } from './helpers/create-options.js';
import { resolve } from './helpers/resolve.js';

const cwd = resolve('fixtures/session-dependencies');

test('Get dependency usage from module graph', async () => {
  const options = await createOptions({ cwd, isSession: true });
  const { session } = await run(options);

  assert(session, 'Session should be available when isSession is true');

  const graph = session.getGraph();
  const entryPaths = session.getEntryPaths();
  const explorer = createGraphExplorer(graph, entryPaths);

  const allUsage = explorer.getDependencyUsage();
  const lodashUsage = explorer.getDependencyUsage('lodash').get('lodash');
  const zodUsage = explorer.getDependencyUsage(/z(o|a)d/).get('zod');
  const unusedUsage = explorer.getDependencyUsage('unused-dep').get('unused-dep');

  assert.equal(allUsage.size, 2);
  assert(lodashUsage);
  assert(zodUsage);
  assert.equal(lodashUsage.imports.length, 2);
  assert.equal(zodUsage.imports.length, 2);
  assert.equal(unusedUsage, undefined);
  assert(lodashUsage.imports[0].line > 0);
  assert(lodashUsage.imports[0].col > 0);
});

test('Get dependency usage via describePackageJson', async () => {
  const options = await createOptions({ cwd, isSession: true });
  const session = await createSession(options);

  const { dependenciesUsage } = session.describePackageJson();
  const lodashUsage = dependenciesUsage.get('lodash');
  const zodUsage = dependenciesUsage.get('zod');
  const unusedUsage = dependenciesUsage.get('unused-dep');

  assert(lodashUsage);
  assert.equal(lodashUsage.imports.length, 2);
  assert(zodUsage);
  assert.equal(zodUsage.imports.length, 2);
  assert.equal(unusedUsage, undefined);
  assert.equal(dependenciesUsage.size, 2);
  assert(lodashUsage.imports[0].line > 0);
  assert(lodashUsage.imports[0].col > 0);
  assert(lodashUsage.imports[0].pos > 0);
});
