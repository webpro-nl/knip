import { test } from 'bun:test';
import assert from 'node:assert/strict';
import baseCounters from 'helpers/baseCounters.js';
import { main } from '../src/index.js';
import { resolve } from '../src/util/path.js';
import baseArguments from './helpers/baseArguments.js';

const cwd = resolve('fixtures/react-component');

test('Find unused component props', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
  });

  const totalErrors = 5;
  assert.equal(Object.keys(issues.componentProps['components.tsx']).length, totalErrors);
  // Using an interface
  assert(issues.componentProps['components.tsx']['ComponentInterfaceFC.unused']);
  // Using a type
  assert(issues.componentProps['components.tsx']['ComponentTypeFC.unused']);
  // Using an imported type
  assert(issues.componentProps['components.tsx']['ComponentFunction.unused']);
  // Using destructured props
  assert(issues.componentProps['components.tsx']['ComponentFunctionDestructured.unused']);
  // Using a class
  assert(issues.componentProps['components.tsx']['ComponentClass.unused']);

  assert.deepEqual(counters, {
    ...baseCounters,
    processed: 3,
    total: 3,
    types: 1,
    componentProps: totalErrors,
  });
});
