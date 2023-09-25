import { timerify } from '../../util/Performance.js';
import { toEntryPattern } from '../../util/protocols.js';
import type { IsPluginEnabledCallback, GenericPluginCallback } from '../../types/plugins.js';

// https://nodejs.dev/en/api/test/

export const NAME = 'Node.js Test Runner';

/** @public */
export const ENABLERS = [''];

export const isEnabled: IsPluginEnabledCallback = ({ manifest }) => {
  // TODO Better to scan the entry files until the first `node:test` import, but that's expensive
  return Boolean(manifest.scripts?.test && /node.+--test/.test(manifest.scripts?.test));
};

export const ENTRY_FILE_PATTERNS = [
  '**/test.{js,cjs,mjs}',
  '**/test-*.{js,cjs,mjs}',
  '**/*{.,-,_}test.{js,cjs,mjs}',
  '**/test/**/*.{js,cjs,mjs}',
];

const findNodeTestRunnerDependencies: GenericPluginCallback = async () => {
  return ENTRY_FILE_PATTERNS.map(toEntryPattern);
};

export const findDependencies = timerify(findNodeTestRunnerDependencies);
