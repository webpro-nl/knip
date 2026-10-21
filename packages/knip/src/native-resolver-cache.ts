import { createRequire } from 'node:module';
import { ResolverFactory } from 'oxc-resolver';
import { join } from './util/path.ts';

interface NativeFileResolver {
  resolveFile(specifier: string, containingFile: string): string | null;
}
export interface NativeResolverCache extends NativeFileResolver {
  clear(recording?: boolean): void;
  clearModuleCaches(): void;
  resolvePackageManifestPath(packageName: string, directory: string): string | null;
  createFileResolver(extensions: string[], tsconfig: string | undefined, yarnPnp: boolean): NativeFileResolver;
  readStorePackageName(root: string): { text?: string; json?: string } | null;
}
interface Binding {
  NativeResolverCache: new (
    yarnPnp: boolean,
    pathStringsLossy: boolean,
    hostWindows: boolean,
    wasiResolver: boolean
  ) => NativeResolverCache;
}
const require = createRequire(import.meta.url);
const binding: Binding = require('knip/native');
const wasiResolver = (() => {
  for (const id in require.cache) {
    if (/[\\/]resolver\.wasi\.cjs$/.test(id) && require.cache[id]?.exports?.ResolverFactory === ResolverFactory)
      return true;
  }
  return false;
})();
export const pathStringsLossy = join('\ud800') !== '\ud800';
export const isYarnPnp = () => !!process.versions.pnp || process.env.OXC_RESOLVER_YARN_PNP !== undefined;
export const createNativeResolverCache = () =>
  new binding.NativeResolverCache(isYarnPnp(), pathStringsLossy, process.platform === 'win32', wasiResolver);
export const nativeResolverCache = createNativeResolverCache();
