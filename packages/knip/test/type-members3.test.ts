import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { main } from '../src/index.js';
import { resolve } from '../src/util/path.js';
import baseArguments from './helpers/baseArguments.js';
import baseCounters from './helpers/baseCounters.js';

const cwd = resolve('fixtures/type-members3');

test('Find unused type and interface members (3)', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
  });

  assert(issues.typeMembers['docs.tsx']['Dog.wings']);
  assert(issues.typeMembers['docs.tsx']['Pet.fins']);
  assert(issues.typeMembers['docs.tsx']['Cat.horn']);
  assert(issues.typeMembers['docs.tsx']['Args.caseB']);
  assert(issues.typeMembers['docs.tsx']['ComponentProps.unusedProp']);
  assert(issues.typeMembers['docs.tsx']['ComponentPropsB.deep.unusedProp']);

  assert.deepEqual(counters, {
    ...baseCounters,
    typeMembers: 6,
    processed: 2,
    total: 2,
  });
});
