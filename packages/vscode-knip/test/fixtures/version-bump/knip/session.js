import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const { version } = JSON.parse(readFileSync(new URL('package.json', import.meta.url), 'utf8'));

export const createOptions = async ({ cwd }) => ({ cwd, rules: { exports: 'warn' } });

export const createSession = async options => {
  const symbol = `knip-version-${version}`;
  const getIssues = () => ({
    issues: {
      exports: {
        'index.js': {
          [symbol]: {
            type: 'exports',
            filePath: join(options.cwd, 'index.js'),
            workspace: '',
            symbol,
            fixes: [],
          },
        },
      },
    },
    counters: {},
    tagHints: new Set(),
    configurationHints: [],
  });

  return {
    handleFileChanges: async () => undefined,
    getIssues,
    getResults: getIssues,
    describeFile: () => undefined,
    describePackageJson: () => ({ dependenciesUsage: new Map() }),
  };
};
