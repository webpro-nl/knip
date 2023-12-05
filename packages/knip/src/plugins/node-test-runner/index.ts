import { timerify } from '../../util/Performance.js';
import { toEntryPattern } from '../../util/protocols.js';
import type { IsPluginEnabledCallback, GenericPluginCallback } from '../../types/plugins.js';

// https://nodejs.dev/en/api/test/

export const NAME = 'Node.js Test Runner';

/** @public */
export const ENABLERS = 'This plugin is enabled when any script in `package.json` includes `node --test`';

// TODO Better to scan the entry files until the first `node:test` import, but that's expensive
export const isEnabled: IsPluginEnabledCallback = ({ manifest }) =>
  Object.keys(manifest.scripts ?? {}).some(
    script => manifest.scripts && /(?<=^|\s)node (.*)--test/.test(manifest.scripts[script])
  );

/** @public */
export const ENTRY_FILE_PATTERNS = [
  '**/*{.,-,_}test.?(c|m)js',
  '**/test-*.?(c|m)js',
  '**/test.?(c|m)js',
  '**/test/**/*.?(c|m)js',
];

const findNodeTestRunnerDependencies: GenericPluginCallback = async (configFilePath, options) => {
  return (options.config?.entry ?? ENTRY_FILE_PATTERNS).map(toEntryPattern);
};

export const findDependencies = timerify(findNodeTestRunnerDependencies);
