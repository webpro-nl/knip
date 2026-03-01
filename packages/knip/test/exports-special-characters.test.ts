import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../src/index.ts';
import baseCounters from './helpers/baseCounters.ts';
import { createOptions } from './helpers/create-options.ts';
import { resolve } from './helpers/resolve.ts';

const cwd = resolve('fixtures/exports-special-characters');

test('Handle special characters in named exports and members', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(issues.exports['exports.ts']['$dollar']);
  assert(issues.exports['exports.ts']['dollar$']);
  assert(issues.exports['exports.ts']['_underscore']);
  assert(issues.exports['exports.ts']['__underscores']);
  assert(issues.exports['exports.ts']['$Dollar']);

  assert(issues.types['exports.ts']['$DollarType']);

  assert(issues.classMembers['exports.ts']['DollarMembers.$member']);
  assert(issues.classMembers['exports.ts']['DollarMembers.member$']);
  assert(issues.classMembers['exports.ts']['DollarMembers.$method']);
  assert(issues.classMembers['exports.ts']['DollarMembers.method$']);

  assert.deepEqual(counters, {
    ...baseCounters,
    classMembers: 4,
    exports: 5,
    types: 1,
    processed: 2,
    total: 2,
  });
});

test('Handle special characters in named exports and members (nsTypes)', async () => {
  const options = await createOptions({ cwd, includedIssueTypes: ['nsTypes'] });
  const { issues, counters } = await main(options);

  assert(issues.exports['exports.ts']['$dollar']);
  assert(issues.exports['exports.ts']['dollar$']);
  assert(issues.exports['exports.ts']['_underscore']);
  assert(issues.exports['exports.ts']['__underscores']);
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
  assert(issues.enumMembers['exports.ts']['Characters. ']);

  assert.deepEqual(counters, {
    ...baseCounters,
    classMembers: 4,
    enumMembers: 21,
    exports: 5,
    types: 1,
    processed: 2,
    total: 2,
  });
});
