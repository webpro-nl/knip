import { existsSync, readFileSync } from 'node:fs';
import type { HasDependency } from '../../compilers/types.js';
import { join } from '../../util/path.js';
import { parseConfig } from './parser.js';
import type { AppConfig, ComponentConfig, MiniprogramAnalysisResult } from './types.js';

/**
 * Check if a directory contains a valid Mini Program project
 */
export const isMiniprogramProject = (cwd: string, hasDependency: HasDependency): boolean => {
  // Check for plugin.json
  if (existsSync(join(cwd, 'plugin.json'))) {
    return true;
  }

  // Check for app.json with pages array
  try {
    const appConfig = JSON.parse(readFileSync(join(cwd, 'app.json'), 'utf8'));
    if (Array.isArray(appConfig.pages)) {
      return true;
    }
  } catch {}

  // Check for miniprogram-api-typings dependency
  return hasDependency('miniprogram-api-typings');
};

/**
 * Resolves a Mini Program path to its absolute path based on the project root and path aliases.
 * Handles three types of paths:
 * 1. Absolute paths (starting with '/') - resolved relative to project root
 * 2. Alias paths (matching configured aliases) - resolved using the first target path
 * 3. Relative paths - resolved relative to project root
 * 
 * @param path - The path to resolve (can be absolute, aliased, or relative)
 * @param cwd - The project root directory
 * @param paths - Optional path alias configuration mapping aliases to target paths
 * @returns The resolved absolute path
 */
const resolveMiniprogramPath = (path: string, cwd: string, paths?: Record<string, string[]>): string => {
  // Handle absolute paths
  if (path.startsWith('/')) {
    return join(cwd, path);
  }

  // Handle alias paths
  if (paths) {
    for (const [alias, targets] of Object.entries(paths)) {
      // Strip wildcard from alias and target
      const baseAlias = alias.endsWith('/*') ? alias.slice(0, -2) : alias;
      const baseTarget = targets[0].endsWith('/*') ? targets[0].slice(0, -2) : targets[0];

      if (path.startsWith(baseAlias)) {
        const relativePath = path.slice(baseAlias.length + (path[baseAlias.length] === '/' ? 1 : 0));
        return join(cwd, baseTarget, relativePath);
      }
    }
  }

  // Handle built-in alias paths (starting with @ or ~)
  if (path.startsWith('@components/')) {
    return join(cwd, 'components', path.slice('@components/'.length));
  }
  if (path.startsWith('~/')) {
    return join(cwd, path.slice(2));
  }

  // Handle relative paths
  return join(cwd, path);
};

interface MiniprogramAnalysisOptions {
  paths?: Record<string, string[]>;
}

/**
 * Analyze a Mini Program project starting from app.json
 * Returns all pages, components, and other assets used in the project
 * 
 * File structure:
 * - Components:
 *   Required:
 *   - .json (must have "component": true)
 *   - .js (component logic)
 *   - .wxml (component template)
 *   Optional:
 *   - .wxss (component styles)
 * 
 * - Pages:
 *   Required:
 *   - .json (page config)
 *   - .js (page logic)
 *   - .wxml (page template)
 *   Optional:
 *   - .wxss (page styles)
 */
export const analyzeMiniprogramProject = (cwd: string, options: MiniprogramAnalysisOptions = {}): MiniprogramAnalysisResult => {
  const result: MiniprogramAnalysisResult = {
    pages: [],
    components: [],
    subPackagePages: [],
    workers: [],
    tabBarIcons: []
  };

  // Read and parse app.json
  try {
    const appJsonPath = join(cwd, 'app.json');
    const appConfig = parseConfig<AppConfig>(appJsonPath);
    
    if (!appConfig || typeof appConfig !== 'object') {
      console.error('Invalid app.json config', appJsonPath);
      return result;
    }

    // Add main pages
    if (Array.isArray(appConfig.pages)) {
      result.pages.push(...appConfig.pages.map(page => ({
        specifier: page,
        resolvedPath: resolveMiniprogramPath(page, cwd, options.paths),
        containingFile: appJsonPath
      })));
    }

    // Add global components
    if (appConfig.usingComponents) {
      result.components.push(...Object.values(appConfig.usingComponents).map(component => ({
        specifier: component,
        resolvedPath: resolveMiniprogramPath(component, cwd, options.paths),
        containingFile: appJsonPath
      })));
    }

    // Add worker
    if (appConfig.workers) {
      result.workers?.push({
        specifier: appConfig.workers,
        resolvedPath: resolveMiniprogramPath(appConfig.workers, cwd, options.paths),
        containingFile: appJsonPath
      });
    }

    // Add tabBar icons
    if (appConfig.tabBar?.list) {
      for (const tab of appConfig.tabBar.list) {
        if (tab.iconPath) {
          result.tabBarIcons?.push({
            specifier: tab.iconPath,
            resolvedPath: resolveMiniprogramPath(tab.iconPath, cwd, options.paths),
            containingFile: appJsonPath
          });
        }
        if (tab.selectedIconPath) {
          result.tabBarIcons?.push({
            specifier: tab.selectedIconPath,
            resolvedPath: resolveMiniprogramPath(tab.selectedIconPath, cwd, options.paths),
            containingFile: appJsonPath
          });
        }
      }
    }

    // Analyze components used in pages
    const processedPaths = new Set<string>();
    const findComponents = (filePath: string, _containingFile: string) => {
      if (processedPaths.has(filePath)) {
        return;
      }
      processedPaths.add(filePath);

      try {
        // If filePath is already absolute, use it directly
        const configPath = filePath.startsWith('/') ? `${filePath}.json` : join(cwd, `${filePath}.json`);
        const config = parseConfig<ComponentConfig>(configPath);
        
        if (config?.usingComponents) {
          const components = Object.values(config.usingComponents);
          result.components.push(...components.map(component => ({
            specifier: component,
            resolvedPath: resolveMiniprogramPath(component, cwd, options.paths),
            containingFile: configPath
          })));
          
          // Recursively process components
          for (const component of components) {
            const resolvedPath = resolveMiniprogramPath(component, cwd, options.paths);
            findComponents(resolvedPath, configPath);
          }
        }
      } catch (error) {
        console.error('Error reading component config:', error);
      }
    };

    // Process all pages and their components
    for (const page of result.pages) {
      findComponents(page.resolvedPath, page.containingFile);
    }


  } catch (error) {
    console.error('Error analyzing Mini Program project:', error);
  }

  return result;
};