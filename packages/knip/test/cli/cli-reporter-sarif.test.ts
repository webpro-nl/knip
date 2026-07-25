import assert from 'node:assert/strict';
import { test } from 'node:test';
import { version } from '../../src/version.ts';
import { exec } from '../helpers/exec.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/resolution/module-resolution-non-std');

test('knip --reporter sarif', () => {
  const report = JSON.parse(exec('knip --reporter sarif', { cwd }).stdout);
  const run = report.runs[0];

  assert.equal(
    report.$schema,
    'https://docs.oasis-open.org/sarif/sarif/v2.1.0/errata01/os/schemas/sarif-schema-2.1.0.json'
  );
  assert.equal(report.version, '2.1.0');
  assert.deepEqual(
    {
      name: run.tool.driver.name,
      version: run.tool.driver.version,
      semanticVersion: run.tool.driver.semanticVersion,
      informationUri: run.tool.driver.informationUri,
    },
    {
      name: 'knip',
      version,
      semanticVersion: version,
      informationUri: 'https://knip.dev',
    }
  );
  assert.deepEqual(
    run.tool.driver.rules.map(
      (rule: {
        id: string;
        name: string;
        helpUri: string;
        defaultConfiguration: { level: string };
        properties: { 'problem.severity': string };
      }) => ({
        id: rule.id,
        name: rule.name,
        helpUri: rule.helpUri,
        level: rule.defaultConfiguration.level,
        problemSeverity: rule.properties['problem.severity'],
      })
    ),
    [
      {
        id: 'knip/files',
        name: 'files',
        helpUri: 'https://knip.dev/reference/issue-types',
        level: 'error',
        problemSeverity: 'error',
      },
      {
        id: 'knip/unlisted',
        name: 'unlisted',
        helpUri: 'https://knip.dev/reference/issue-types',
        level: 'error',
        problemSeverity: 'error',
      },
      {
        id: 'knip/unresolved',
        name: 'unresolved',
        helpUri: 'https://knip.dev/reference/issue-types',
        level: 'error',
        problemSeverity: 'error',
      },
    ]
  );
  assert.deepEqual(
    run.results.map(
      (result: {
        ruleId: string;
        ruleIndex: number;
        level: string;
        message: { text: string };
        locations: unknown[];
      }) => ({
        ruleId: result.ruleId,
        ruleIndex: result.ruleIndex,
        level: result.level,
        message: result.message.text,
        location: result.locations[0],
      })
    ),
    [
      {
        ruleId: 'knip/files',
        ruleIndex: 0,
        level: 'error',
        message: 'Unused file: src/unused.ts',
        location: {
          physicalLocation: {
            artifactLocation: { uri: 'src/unused.ts' },
          },
        },
      },
      {
        ruleId: 'knip/unlisted',
        ruleIndex: 1,
        level: 'error',
        message: 'Unlisted dependency: unresolved',
        location: {
          physicalLocation: {
            artifactLocation: { uri: 'src/index.ts' },
            region: { startLine: 9, startColumn: 27, endColumn: 37 },
          },
        },
      },
      {
        ruleId: 'knip/unlisted',
        ruleIndex: 1,
        level: 'error',
        message: 'Unlisted dependency: @org/unresolved',
        location: {
          physicalLocation: {
            artifactLocation: { uri: 'src/index.ts' },
            region: { startLine: 10, startColumn: 27, endColumn: 42 },
          },
        },
      },
      {
        ruleId: 'knip/unresolved',
        ruleIndex: 2,
        level: 'error',
        message: 'Unresolved import: ./unresolved',
        location: {
          physicalLocation: {
            artifactLocation: { uri: 'src/index.ts' },
            region: { startLine: 8, startColumn: 24, endColumn: 36 },
          },
        },
      },
    ]
  );
});

test('maps warning rules and results to SARIF warning severity', () => {
  const cwd = resolve('fixtures/tags-hints/rules');
  const report = JSON.parse(exec('knip --reporter sarif', { cwd }).stdout);
  const run = report.runs[0];
  const rule = run.tool.driver.rules.find((rule: { id: string }) => rule.id === 'knip/files');
  const result = run.results.find((result: { ruleId: string }) => result.ruleId === 'knip/files');

  assert.deepEqual(
    {
      defaultLevel: rule.defaultConfiguration.level,
      problemSeverity: rule.properties['problem.severity'],
      resultLevel: result.level,
    },
    {
      defaultLevel: 'warning',
      problemSeverity: 'warning',
      resultLevel: 'warning',
    }
  );
});
