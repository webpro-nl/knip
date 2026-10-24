import picomatch from 'picomatch';
import { DEFAULT_EXTENSIONS, KNIP_CONFIG_LOCATIONS } from '../constants.ts';
import type { MainOptions } from '../util/create-options.ts';
import { extname, isAbsolute, isInNodeModules, toAbsolute, toRelative } from '../util/path.ts';
import type { WatchChange } from '../util/watch.ts';

export class SessionConfigurationChangedError extends Error {
  readonly requiresRestart: boolean;

  constructor(filePath: string, requiresRestart: boolean) {
    super(
      requiresRestart
        ? `Configuration changed (${filePath}); restart Knip in a new process to reload its modules`
        : `Configuration changed (${filePath}); recreate the options and session to reload it`
    );
    this.requiresRestart = requiresRestart;
  }
}

export class ConfigurationFiles {
  paths = new Map<string, boolean>();
  private matchers: Array<(filePath: string) => boolean> = [];

  constructor(options: MainOptions) {
    this.addPatterns(options.cwd, [...KNIP_CONFIG_LOCATIONS, 'pnpm-workspace.yaml', '**/.gitignore']);
    if (options.configFilePath) this.add(options.configFilePath, true);
    for (const filePath of options.preprocessorInputs) {
      if (isAbsolute(filePath)) this.add(filePath, true);
    }
  }

  add(filePath: string, isLoaded = false) {
    this.paths.set(filePath, this.paths.get(filePath) || (isLoaded && DEFAULT_EXTENSIONS.has(extname(filePath))));
  }

  addPatterns(dir: string, patterns: string[]) {
    const included = [];
    const excluded = [];
    for (const pattern of patterns) {
      if (pattern.startsWith('!')) excluded.push(toAbsolute(pattern.slice(1), dir));
      else included.push(toAbsolute(pattern, dir));
    }
    if (included.length > 0) this.matchers.push(picomatch(included, { dot: true, ignore: excluded }));
  }

  getChange(changes: WatchChange[], cwd: string) {
    let error: SessionConfigurationChangedError | undefined;
    for (const change of changes) {
      const filePath = toAbsolute(change.filePath, cwd);
      const restart = this.paths.get(filePath);
      if (restart === undefined && isInNodeModules(filePath)) continue;
      if (restart === undefined && !this.matchers.some(isMatch => isMatch(filePath))) continue;
      if (!error || restart) error = new SessionConfigurationChangedError(toRelative(filePath, cwd), !!restart);
    }
    return error;
  }
}
