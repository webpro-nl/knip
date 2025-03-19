import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { main } from '../../src/index.js';
import { resolve } from '../../src/util/path.js';
import baseArguments from '../helpers/baseArguments.js';
import baseCounters from '../helpers/baseCounters.js';

const cwdEmptyConfig = resolve('fixtures/plugins/sst/empty-config');
const cwdOneHandler = resolve('fixtures/plugins/sst/one-handler');
const cwdOneHandlerInSrcLambdas = resolve('fixtures/plugins/sst/one-handler-in-lambdas');
const cwdOneHandlerInSrcHandlers = resolve('fixtures/plugins/sst/one-handler-in-src');

test('Find dependencies with the sst plugin with empty config', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd: cwdEmptyConfig,
  });

//   console.log('issues', issues);
//   console.log('counters', counters);

  assert.deepEqual(counters, {
    ...baseCounters,
    devDependencies: 1,
    processed: 1,
    total: 1,
  });
});

test('Find dependencies with the sst plugin with one handler', async () => {
    const { issues, counters } = await main({
      ...baseArguments,
      cwd: cwdOneHandler,
    });
  
//    console.log('issues', issues);
    
    assert.partialDeepStrictEqual(issues, {
        unlisted: {
            "sst.config.ts": {
                dependencyFromConfig: {} // an example dependency listed in the config
            },
            "stacks/my-stack.ts": {
                dependencyFromStack: {} // an example dependency listed in the stack
            },
            "handlers/my-handler.ts": {
                dependencyFromHandler: {} // an example dependency listed in the handler
            }
        }
    });
  });

  test('Find dependencies with the sst plugin with one handler in src/handlers folder', async () => {
    const { issues, counters } = await main({
      ...baseArguments,
      cwd: cwdOneHandlerInSrcHandlers,
    });
  
//    console.log('issues', issues);
    
    assert.partialDeepStrictEqual(issues, {
        unlisted: {
            "sst.config.ts": {
                dependencyFromConfig: {} // an example dependency listed in the config
            },
            "src/stacks/my-stack.ts": {
                dependencyFromStack: {} // an example dependency listed in the stack
            },
            "src/handlers/my-handler.ts": {
                dependencyFromHandler: {} // an example dependency listed in the handler
            }
        }
    });
  });

  test('Find dependencies with the sst plugin with one handler in src/lambdas folder', async () => {
    const { issues, counters } = await main({
      ...baseArguments,
      cwd: cwdOneHandlerInSrcLambdas,
    });
  
//    console.log('issues', issues);
    
    assert.partialDeepStrictEqual(issues, {
        unlisted: {
            "sst.config.ts": {
                dependencyFromConfig: {} // an example dependency listed in the config
            },
            "src/stacks/my-stack.ts": {
                dependencyFromStack: {} // an example dependency listed in the stack
            },
            "src/lambdas/my-handler.ts": {
                dependencyFromHandler: {} // an example dependency listed in the handler
            }
        }
    });
  });
