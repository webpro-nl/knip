export const ROOT_WORKSPACE_NAME = '.';

export const IMPORT_STAR = '*';

export const KNIP_CONFIG_LOCATIONS = [
  'knip.json',
  'knip.jsonc',
  '.knip.json',
  '.knip.jsonc',
  'knip.ts',
  'knip.js',
  'knip.config.ts',
  'knip.config.js',
];

export const DEFAULT_EXTENSIONS = new Set(['.js', '.mjs', '.cjs', '.jsx', '.ts', '.tsx', '.mts', '.cts']);

export const DTS_EXTENSIONS = ['.d.ts', '.d.mts', '.d.cts'];

export const IS_DTS = /\.d\.(c|m)?ts$/;

export const GLOBAL_IGNORE_PATTERNS: readonly string[] = ['**/node_modules', '.git/!(hooks)'];

export const PUBLIC_TAG = '@public';
export const INTERNAL_TAG = '@internal';
export const BETA_TAG = '@beta';
export const ALIAS_TAG = '@alias';

export const DT_SCOPE = '@types';

export const PROTOCOL_VIRTUAL = 'virtual:';
export const PROTOCOL_CLOUDFLARE = 'cloudflare:';

/**
 * Binaries that are expected to be globally available. The package at
 * https://www.npmjs.com/package/[name] might exist, but is not expected to be
 * listed in package.json because last npm publish was >6 years ago OR weekly
 * downloads <5_000 OR it doesn't even provide a bin of that name (so the package
 * can't be the source of the binary)
 */
export const IGNORED_GLOBAL_BINARIES = new Set([
  'alias',
  'amplify',
  'aws',
  'az',
  'base64',
  'basename',
  'bash',
  'bg',
  'bind',
  'break',
  'builtin',
  'bun',
  'bundle',
  'bunx',
  'cargo',
  'cat',
  'cd',
  'chgrp',
  'chmod',
  'chown',
  'cksum',
  'claude',
  'clear',
  'cmd',
  'cmd.exe',
  'cmp',
  'code',
  'code-insiders',
  'codesign',
  'comm',
  'command',
  'continue',
  'corepack',
  'cp',
  'curl',
  'cut',
  'date',
  'dd',
  'declare',
  'defaults',
  'deno',
  'devtunnel',
  'df',
  'dir',
  'dirname',
  'docker',
  'dotnet',
  'du',
  'echo',
  'env',
  'eval',
  'exec',
  'exit',
  'expand',
  'export',
  'expr',
  'factor',
  'false',
  'fg',
  'find',
  'fuser',
  'gem',
  'getconf',
  'getopts',
  'gh',
  'git',
  'grep',
  'groups',
  'gunzip',
  'gzip',
  'hash',
  'head',
  'hg',
  'hostname',
  'id',
  'jobs',
  'join',
  'kill',
  'killall',
  'launchctl',
  'ln',
  'local',
  'logname',
  'ls',
  'lsof',
  'md5sum',
  'mkdir',
  'mknod',
  'mktemp',
  'mv',
  'nc',
  'nice',
  'nl',
  'node',
  'nohup',
  'npm',
  'nproc',
  'npx',
  'nub',
  'nubx',
  'open',
  'osascript',
  'paste',
  'pgrep',
  'pkill',
  'pnpm',
  'pnpx',
  'powershell',
  'powershell.exe',
  'pr',
  'printenv',
  'printf',
  'ps',
  'pulumi',
  'pwd',
  'python',
  'python3',
  'raft',
  'railway',
  'read',
  'readlink',
  'realpath',
  'return',
  'rm',
  'rmdir',
  'rsync',
  'scp',
  'security',
  'sed',
  'seq',
  'set',
  'sftp',
  'sh',
  'sha1sum',
  'sha512sum',
  'shift',
  'shred',
  'shuf',
  'sleep',
  'sort',
  'split',
  'ssh',
  'ssh-add',
  'ssh-agent',
  'ssh-keygen',
  'ssh-keyscan',
  'stat',
  'stty',
  'sudo',
  'sw_vers',
  'sync',
  'sysctl',
  'systemctl',
  'tac',
  'tail',
  'tar',
  'taskkill',
  'tee',
  'test', // exception (node built-in module)
  'time',
  'timeout',
  'tmux',
  'tmuxinator',
  'touch',
  'trap',
  'tr',
  'true',
  'tsort',
  'tty',
  'type',
  'ulimit',
  'umask',
  'unalias',
  'uname',
  'unexpand',
  'uniq',
  'unset',
  'unzip',
  'wait',
  'wc',
  'which',
  'who',
  'whoami',
  'xargs',
  'xcodebuild',
  'xcrun',
  'xvfb-run',
  'yarn',
  'yes',
  'zip',
  'zsh',
  'zstd',
]);

export const IGNORED_DEPENDENCIES = new Set(['knip', 'typescript']);

export const IGNORED_RUNTIME_DEPENDENCIES = new Set(['node', 'bun', 'deno']);

export const FOREIGN_FILE_EXTENSIONS = new Set([
  '.avif',
  '.css',
  '.eot',
  '.gif',
  '.html',
  '.ico',
  '.jpeg',
  '.jpg',
  '.less',
  '.mp3',
  '.otf',
  '.png',
  '.sass',
  '.scss',
  '.sh',
  '.styl',
  '.stylus',
  '.svg',
  '.ttf',
  '.webp',
  '.woff',
  '.woff2',
  '.yaml',
  '.yml',
]);

export const IGNORE_DEFINITELY_TYPED = new Set([
  // The `@types/node` dependency does not require the `node` dependency
  'node',
  'bun',
  // Packages that confusingly include `package.json#types` but also recommend to install DT pkg
  'jest',
]);

export const ISSUE_TYPES = [
  'files',
  'subpaths',
  'dependencies',
  'devDependencies',
  'optionalPeerDependencies',
  'unlisted',
  'binaries',
  'unresolved',
  'exports',
  'nsExports',
  'types',
  'nsTypes',
  'enumMembers',
  'namespaceMembers',
  'duplicates',
  'catalog',
  'catalogReferences',
  'cycles',
] as const;

export const ISSUE_TYPE_TITLE = {
  files: 'Unused files',
  subpaths: 'Unused subpaths',
  dependencies: 'Unused dependencies',
  devDependencies: 'Unused devDependencies',
  optionalPeerDependencies: 'Referenced optional peerDependencies',
  unlisted: 'Unlisted dependencies',
  binaries: 'Unlisted binaries',
  unresolved: 'Unresolved imports',
  exports: 'Unused exports',
  nsExports: 'Exports in used namespace',
  types: 'Unused exported types',
  nsTypes: 'Exported types in used namespace',
  enumMembers: 'Unused exported enum members',
  namespaceMembers: 'Unused exported namespace members',
  duplicates: 'Duplicate exports',
  catalog: 'Unused catalog entries',
  catalogReferences: 'Unresolved catalog references',
  cycles: 'Circular dependencies',
} as const;

export const SYMBOL_TYPE = {
  CLASS: 'class',
  ENUM: 'enum',
  FUNCTION: 'function',
  INTERFACE: 'interface',
  MEMBER: 'member',
  NAMESPACE: 'namespace',
  TYPE: 'type',
  UNKNOWN: 'unknown',
  VARIABLE: 'variable',
} as const;

export const FIX_FLAGS = {
  NONE: 0,
  OBJECT_BINDING: 1 << 0, // remove next comma
  EMPTY_DECLARATION: 1 << 1, // remove declaration if empty
  WITH_NEWLINE: 1 << 2, // remove with newline
} as const;

export const SIDE_EFFECTS = '__side-effects';

export const OPAQUE = '__opaque';

export const LOADER_DEFAULT = '__loader-default';

export const SCRIPT_INTERPOLATION = '$__knip__';

export const IMPORT_FLAGS = {
  NONE: 0,
  RE_EXPORT: 1 << 0,
  TYPE_ONLY: 1 << 1,
  ENTRY: 1 << 2, // entry path, ignore exports
  BRIDGE: 1 << 3, // add require() target in ts module to program
  OPTIONAL: 1 << 4, // no error if not resolved
  SIDE_EFFECTS: 1 << 5,
  OPAQUE: 1 << 6,
  AUGMENT: 1 << 7, // module augmentation ref, attribute only if it resolves internally
  DYNAMIC: 1 << 8, // dynamic import(), excluded from cycle detection
  LOADER: 1 << 9, // inline arrow loader in call args: consumes default export only, if the target has one
  CAUGHT: 1 << 10, // dynamic import() rejection is caught by an enclosing try/catch
} as const;
