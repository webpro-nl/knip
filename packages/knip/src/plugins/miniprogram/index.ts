import { existsSync } from 'node:fs';
import type { IsPluginEnabled, Plugin, ResolveConfig, ResolveEntryPaths } from '../../types/config.js';
import { toDevDependency, toEntry } from '../../util/input.js';
import { _load } from '../../util/loader.js';
import { join } from '../../util/path.js';
import { hasDependency } from '../../util/plugin.js';
import { analyzeMiniprogramProject, isMiniprogramProject } from './utils.js';

const title = 'WeChat Mini Program';

const enablers = ['miniprogram-api-typings'];

const isEnabled: IsPluginEnabled = ({ dependencies, cwd }) => {
  const enabled = isMiniprogramProject(cwd, pkg => hasDependency(dependencies, [pkg]));
  return enabled;
};

// Add config property to specify which files should be processed
const config = ['app.json'];

interface MiniprogramConfig {
  pages?: string[];
  subPackages?: Array<{
    root: string;
    pages: string[];
  }>;
  usingComponents?: Record<string, string>;
}

const resolveEntryPaths: ResolveEntryPaths<MiniprogramConfig> = async (_config, options) => {
  // Load workspace config to get path aliases
  const workspaceConfig = await _load(join(options.configFileDir, 'knip.json'));

  // Analyze the project to get all pages and components
  const result = await analyzeMiniprogramProject(options.cwd, { paths: workspaceConfig.paths });
  const entries: string[] = [];

  // Add default miniprogram files
  entries.push('app.{js,ts}');
  entries.push('app.wxss');
  entries.push('app.json');
  entries.push('plugin.json');
  entries.push('package.json');
  entries.push('sitemap.json');

  // Helper function to add file patterns based on actual file structure
  const addFilePatterns = (basePath: string) => {
    const absolutePath = join(options.cwd, basePath);
    const isDirectory = existsSync(absolutePath) && !existsSync(`${absolutePath}.json`);

    if (isDirectory) {
      // Directory case (e.g. used-counter/index.json)
      entries.push(`${basePath}/index.json`);
      entries.push(`${basePath}/index.{js,ts}`);
      entries.push(`${basePath}/index.wxml`);
      entries.push(`${basePath}/index.wxss`);
    } else {
      // Single file case (e.g. used-counter.json)
      entries.push(`${basePath}.json`);
      entries.push(`${basePath}.{js,ts}`);
      entries.push(`${basePath}.wxml`);
      entries.push(`${basePath}.wxss`);
    }
  };

  // Add all discovered pages
  if (result.pages) {
    for (const page of result.pages) {
      addFilePatterns(page.resolvedPath);
    }
  }

  // Add all discovered components
  if (result.components) {
    for (const component of result.components) {
      addFilePatterns(component.resolvedPath);
    }
  }

  // Add all discovered workers
  if (result.workers) {
    for (const worker of result.workers) {
      entries.push(`${worker.resolvedPath}`);
    }
  }

  // Add all discovered tabBar icons
  if (result.tabBarIcons) {
    for (const icon of result.tabBarIcons) {
      entries.push(icon.resolvedPath);
    }
  }

  return entries.map(toEntry);
};

const resolveConfig: ResolveConfig<MiniprogramConfig> = async (_config, { manifest }) => {
  const inputs = [];

  // Add miniprogram-api-typings as a dev dependency if it exists in manifest
  if (manifest.devDependencies?.['miniprogram-api-typings']) {
    inputs.push(toDevDependency('miniprogram-api-typings'));
  }

  return inputs;
};

export default {
  title,
  enablers,
  isEnabled,
  config,
  resolveEntryPaths,
  resolveConfig,
} satisfies Plugin;
