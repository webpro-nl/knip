import { parseArgs } from 'node:util';

export default parseArgs({
  options: {
    config: { type: 'string', short: 'c' },
    debug: { type: 'boolean' },
    'debug-file-filter': { type: 'string' },
    'debug-level': { type: 'string' },
    exclude: { type: 'string', multiple: true },
    help: { type: 'boolean', short: 'h' },
    ignore: { type: 'string', multiple: true },
    ignoreBinaries: { type: 'string', multiple: true },
    include: { type: 'string', multiple: true },
    'max-issues': { type: 'string' },
    'no-exit-code': { type: 'boolean' },
    'no-gitignore': { type: 'boolean' },
    'no-progress': { type: 'boolean' },
    performance: { type: 'boolean' },
    production: { type: 'boolean' },
    reporter: { type: 'string' },
    'reporter-options': { type: 'string' },
    strict: { type: 'boolean' },
    tsConfig: { type: 'string', short: 't' },
    workspace: { type: 'string' },
  },
});
