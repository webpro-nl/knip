import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/plugins/eve');

test('Find dependencies with the eve plugin', async () => {
  const options = await createOptions({ cwd });
  const { counters, issues } = await main(options);

  assert('agent/lib/unused.ts' in issues.files);
  assert('agent/subagents/researcher/channels/slack.ts' in issues.files);
  assert('agent/subagents/researcher/instrumentation.ts' in issues.files);
  assert('agent/subagents/researcher/schedules/daily.ts' in issues.files);
  assert(!('agent/instructions.ts' in issues.files));
  assert(!('agent/instrumentation.ts' in issues.files));
  assert(!('agent/skills/summarize.ts' in issues.files));
  assert(!('agent/tools/get_weather.ts' in issues.files));
  assert(!('agent/channels/slack.ts' in issues.files));
  assert(!('agent/connections/search.ts' in issues.files));
  assert(!('agent/subagents/researcher/connections/search.ts' in issues.files));
  assert(!('agent/subagents/researcher/hooks/log.ts' in issues.files));
  assert(!('agent/subagents/researcher/instructions.ts' in issues.files));
  assert(!('agent/subagents/researcher/sandbox/sandbox.ts' in issues.files));
  assert(!('agent/subagents/researcher/skills/summarize.ts' in issues.files));
  assert(!('agent/subagents/researcher/tools/search.ts' in issues.files));
  assert(!issues.exports['agent/lib/weather.ts']?.getWeather);
  assert(!issues.dependencies['package.json']?.eve);
  assert(!issues.dependencies['package.json']?.['weather-client']);
  assert(!issues.dependencies['package.json']?.['channel-credentials']);

  assert.deepEqual(counters, {
    ...baseCounters,
    files: 4,
    processed: 22,
    total: 22,
  });
});
