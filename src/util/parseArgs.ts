import { parseArgs } from 'node:util';

export default parseArgs({
  options: {
    help: { type: 'boolean' },
    config: { type: 'string', short: 'c' },
    tsConfig: { type: 'string', short: 't' },
    dir: { type: 'string' },
    include: { type: 'string', multiple: true },
    exclude: { type: 'string', multiple: true },
    ignore: { type: 'string', multiple: true },
    'no-gitignore': { type: 'boolean' },
    dev: { type: 'boolean' },
    'include-entry-files': { type: 'boolean' },
    'no-progress': { type: 'boolean' },
    'max-issues': { type: 'string' },
    reporter: { type: 'string' },
    'reporter-options': { type: 'string' },
    debug: { type: 'boolean' },
    'debug-level': { type: 'string' },
    performance: { type: 'boolean' },
  },
});
