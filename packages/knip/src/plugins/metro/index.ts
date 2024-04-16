import { join } from '#p/util/path.js';
import { hasDependency, load } from '#p/util/plugin.js';
import ts from 'typescript';
import type { IgnorePatterns } from '#p/types/config.js';
import type { IsPluginEnabled, ModuleResolver, Plugin } from '#p/types/plugins.js';

// https://metrobundler.dev/docs/configuration/
// https://github.com/facebook/metro/tree/main/packages/metro-resolver

const title = 'Metro';

const enablers: IgnorePatterns = ['@react-native/metro-config', '@expo/metro-config'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const getModuleResolvers = async (dir: string) => {
  try {
    // TODO Ugh, hopefully we can infer all of this (example: fixtures/plugins/metro/metro.config.js)
    const { __KNIP_PLATFORMS__ } = await load(join(dir, 'metro.config.js'));

    const createModuleResolver =
      (dirs: string[], extensions: string[]): ModuleResolver =>
      (
        id: string,
        containingFile: string,
        compilerOptions: ts.CompilerOptions,
        sys: typeof ts.sys,
        resolve: typeof ts.resolveModuleName
      ) => {
        for (const dir of dirs) {
          for (const ext of extensions) {
            const mod = resolve(id + dir + ext, containingFile, compilerOptions, sys).resolvedModule;
            if (mod) return mod;
          }
        }
      };

    const moduleResolvers: Record<string, ModuleResolver> = {};

    for (const [key, config] of Object.entries<[string[], string[]]>(__KNIP_PLATFORMS__)) {
      const [dirs, extensions] = config;
      moduleResolvers[key] = createModuleResolver(dirs, extensions);
    }

    return moduleResolvers;
  } catch {
    return {};
  }
};

const entry = ['metro.config.js', 'react-native.config.js'];

export default {
  title,
  enablers,
  isEnabled,
  getModuleResolvers,
  entry,
} satisfies Plugin;
