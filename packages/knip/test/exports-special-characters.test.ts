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

  assert(issues.classMembers['exports.ts']['DollarMembers.$member']);
  assert(issues.classMembers['exports.ts']['DollarMembers.member$']);
  assert(issues.classMembers['exports.ts']['DollarMembers.$method']);
  assert(issues.classMembers['exports.ts']['DollarMembers.method$']);

  assert.deepEqual(counters, {
    ...baseCounters,
    classMembers: 4,
    exports: 4,
    types: 1,
    processed: 2,
    total: 2,
  });
});

test('Handle special characters in named exports and members (nsTypes)', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
    includedIssueTypes: ['nsTypes'],
  });

  assert(issues.exports['exports.ts']['$dollar']);
  assert(issues.exports['exports.ts']['dollar$']);
  assert(issues.exports['exports.ts']['_underscore']);
  assert(issues.exports['exports.ts']['$Dollar']);

  assert(issues.types['exports.ts']['$DollarType']);

  assert(issues.classMembers['exports.ts']['DollarMembers.$member']);
  assert(issues.classMembers['exports.ts']['DollarMembers.member$']);
  assert(issues.classMembers['exports.ts']['DollarMembers.$method']);
  assert(issues.classMembers['exports.ts']['DollarMembers.method$']);

  assert(issues.enumMembers['exports.ts']['Characters.-']);
  assert(issues.enumMembers['exports.ts']['Characters.,']);
  assert(issues.enumMembers['exports.ts']['Characters.:']);
  assert(issues.enumMembers['exports.ts']['Characters.?']);
  assert(issues.enumMembers['exports.ts']['Characters..']);
  assert(issues.enumMembers['exports.ts']['Characters.(']);
  assert(issues.enumMembers['exports.ts']['Characters.)']);
  assert(issues.enumMembers['exports.ts']['Characters.[']);
  assert(issues.enumMembers['exports.ts']['Characters.]']);
  assert(issues.enumMembers['exports.ts']['Characters.{']);
  assert(issues.enumMembers['exports.ts']['Characters.}']);
  assert(issues.enumMembers['exports.ts']['Characters.@']);
  assert(issues.enumMembers['exports.ts']['Characters.*']);
  assert(issues.enumMembers['exports.ts']['Characters./']);
  assert(issues.enumMembers['exports.ts']['Characters.\\\\']);
  assert(issues.enumMembers['exports.ts']['Characters.+']);
  assert(issues.enumMembers['exports.ts']['Characters.|']);
  assert(issues.enumMembers['exports.ts']['Characters.$']);
  assert(issues.enumMembers['exports.ts']['Characters.Slash']);
  assert(issues.enumMembers['exports.ts']['Characters.Space']);

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
