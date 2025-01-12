import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { main } from '../src/index.js';
import { resolve } from '../src/util/path.js';
import baseArguments from './helpers/baseArguments.js';
import baseCounters from './helpers/baseCounters.js';

const cwd = resolve('fixtures/type-members');

test('Find unused type and interface members', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
  });

  assert(issues.typeMembers['interfaces.ts']['MyInterface.unusedInterfaceMember']);
  assert(issues.typeMembers['interfaces.ts']['MyInterface.unused-interface-quoted']);
  assert(issues.typeMembers['interfaces.ts']['ExtendedInterface.boolA']);

  assert(issues.typeMembers['types.ts']['MyType.unusedTypeMember']);
  assert(issues.typeMembers['types.ts']['MyType.unused-type-quoted']);
  assert(issues.typeMembers['types.ts']['WithIntersection.boolB']);
  assert(issues.typeMembers['types.ts']['WithUnion.boolC']);

  assert(issues.typeMembers['props.ts']['PropsA.unusedPropA']);
  assert(issues.typeMembers['props.ts']['PropsB.unusedPropB']);
  assert(issues.typeMembers['props.ts']['PropsC.unusedPropC']);
  assert(issues.typeMembers['props.ts']['PropsD.unusedPropD']);
  assert(issues.typeMembers['props.ts']['FnArg.optionB']);

  assert.deepEqual(counters, {
    ...baseCounters,
    typeMembers: 12,
    processed: 4,
    total: 4,
  });
});
