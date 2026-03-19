import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../src/index.ts';
import baseCounters from './helpers/baseCounters.ts';
import { createOptions } from './helpers/create-options.ts';
import { resolve } from './helpers/resolve.ts';

const cwd = resolve('fixtures/ts-namespace');

test('Find unused namespace members', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(issues.namespaceMembers['members.ts']['Fruits.unusedBanana']);
  assert(issues.namespaceMembers['members.ts']['Fruits.Tropical.unusedPapaya']);
  assert(issues.namespaceMembers['members.ts']['Animals.unusedDog']);
  assert(issues.namespaceMembers['members.ts']['Shapes.unusedSquare']);
  assert(issues.namespaceMembers['members.ts']['Standalone.unusedValue']);
  assert(issues.namespaceMembers['types.ts']['Types.UnusedType']);
  assert(issues.namespaceMembers['types.ts']['Types.UnusedInterface']);

  assert(issues.namespaceMembers['merged.ts']['Validator.unusedMinLength']);
  assert(issues.namespaceMembers['merged.ts']['format.unusedPadding']);

  assert(!issues.namespaceMembers['members.ts']?.['Fruits.apple']);
  assert(!issues.namespaceMembers['members.ts']?.['Fruits.Tropical.mango']);
  assert(!issues.namespaceMembers['members.ts']?.['Animals.cat']);
  assert(!issues.namespaceMembers['members.ts']?.['Animals.Birds.eagle']);
  assert(!issues.namespaceMembers['members.ts']?.['Shapes.circle']);
  assert(!issues.namespaceMembers['members.ts']?.['Shapes.Nested.triangle']);
  assert(!issues.namespaceMembers['members.ts']?.['Standalone.value']);
  assert(!issues.namespaceMembers['members.ts']?.['Standalone.Nested.deep']);
  assert(!issues.namespaceMembers['types.ts']?.['Types.UsedType']);
  assert(!issues.namespaceMembers['types.ts']?.['Types.UsedInterface']);
  assert(!issues.namespaceMembers['merged.ts']?.['Validator.maxLength']);
  assert(!issues.namespaceMembers['merged.ts']?.['format.separator']);

  assert(issues.namespaceMembers['modules.ts']['Colors.unusedBlue']);
  assert(issues.namespaceMembers['modules.ts']['Colors.Shades.unusedLight']);
  assert(!issues.namespaceMembers['modules.ts']?.['Colors.red']);
  assert(!issues.namespaceMembers['modules.ts']?.['Colors.Shades.dark']);

  assert(issues.enumMembers['merged.ts']['Status.unusedDefault']);
  assert(!issues.enumMembers['merged.ts']?.['Status.label']);

  assert.deepEqual(counters, {
    ...baseCounters,
    enumMembers: 2,
    namespaceMembers: 11,
    processed: 5,
    total: 5,
  });
});
