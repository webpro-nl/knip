import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { main } from '../src/index.js';
import { resolve } from '../src/util/path.js';
import baseArguments from './helpers/baseArguments.js';
import baseCounters from './helpers/baseCounters.js';

const cwd = resolve('fixtures/exports-special-characters');

test('Handle special characters in named exports and members', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
  });

  assert(issues.exports['exports.ts']['$dollar']);
  assert(issues.exports['exports.ts']['dollar$']);
  assert(issues.exports['exports.ts']['_underscore']);
  assert(issues.exports['exports.ts']['$Dollar']);

  assert(issues.types['exports.ts']['$DollarType']);

  assert(issues.classMembers['exports.ts']['$member']);
  assert(issues.classMembers['exports.ts']['member$']);
  assert(issues.classMembers['exports.ts']['$method']);
  assert(issues.classMembers['exports.ts']['method$']);

  assert(issues.enumMembers['exports.ts']['-']);
  assert(issues.enumMembers['exports.ts'][',']);
  assert(issues.enumMembers['exports.ts'][':']);
  assert(issues.enumMembers['exports.ts']['?']);
  assert(issues.enumMembers['exports.ts']['.']);
  assert(issues.enumMembers['exports.ts']['(']);
  assert(issues.enumMembers['exports.ts'][')']);
  assert(issues.enumMembers['exports.ts']['[']);
  assert(issues.enumMembers['exports.ts'][']']);
  assert(issues.enumMembers['exports.ts']['{']);
  assert(issues.enumMembers['exports.ts']['}']);
  assert(issues.enumMembers['exports.ts']['@']);
  assert(issues.enumMembers['exports.ts']['*']);
  assert(issues.enumMembers['exports.ts']['/']);
  assert(issues.enumMembers['exports.ts']['\\\\']);
  assert(issues.enumMembers['exports.ts']['+']);
  assert(issues.enumMembers['exports.ts']['|']);
  assert(issues.enumMembers['exports.ts']['$']);
  assert(issues.enumMembers['exports.ts']['Slash']);
  assert(issues.enumMembers['exports.ts']['Space']);

  assert.deepEqual(counters, {
    ...baseCounters,
    classMembers: 4,
    enumMembers: 20,
    exports: 4,
    types: 1,
    processed: 2,
    total: 2,
  });
});
