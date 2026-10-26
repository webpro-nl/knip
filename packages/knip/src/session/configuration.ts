import picomatch from 'picomatch';
import { KNIP_CONFIG_LOCATIONS } from '../constants.ts';
import type { MainOptions } from '../util/create-options.ts';
import { isAbsolute, isInNodeModules, join, relative, toAbsolute, toPosix, toRelative } from '../util/path.ts';
import type { WatchChange } from '../util/watch.ts';

export class SessionConfigurationChangedError extends Error {
  constructor(filePath: string) {
    super(`Configuration changed (${filePath})`);
  }
}

export class ConfigurationFiles {
  paths = new Set<string>();
  private matchers: Array<{ dir: string; isMatch: (filePath: string) => boolean }> = [];

  constructor(options: MainOptions) {
    const manifests = [];
    for (const pattern of options.workspaces) manifests.push(join(pattern, 'package.json'));
    this.addPatterns(options.cwd, [...KNIP_CONFIG_LOCATIONS, 'pnpm-workspace.yaml', '**/.gitignore', ...manifests]);
    if (options.configFilePath) this.paths.add(options.configFilePath);
    for (const filePath of options.preprocessorInputs) if (isAbsolute(filePath)) this.paths.add(filePath);
  }

  addPatterns(dir: string, patterns: string[]) {
    const included = [];
    const excluded = [];
    for (const pattern of patterns) {
      if (pattern.startsWith('!')) excluded.push(toRelative(pattern.slice(1), dir));
      else included.push(toRelative(pattern, dir));
    }
    if (included.length > 0) this.matchers.push({ dir, isMatch: picomatch(included, { dot: true, ignore: excluded }) });
  }

  getChange(changes: WatchChange[], cwd: string) {
    for (const change of changes) {
      const filePath = toAbsolute(toPosix(change.filePath), cwd);
      if (
        this.paths.has(filePath) ||
        (!isInNodeModules(filePath) && this.matchers.some(({ dir, isMatch }) => isMatch(relative(dir, filePath))))
      )
        return new SessionConfigurationChangedError(toRelative(filePath, cwd));
    }
  }
}
