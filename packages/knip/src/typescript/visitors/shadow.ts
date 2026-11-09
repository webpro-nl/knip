import type { WalkState } from './walk.ts';

export const isShadowedIn = (s: WalkState, name: string, pos: number): boolean => {
  if (s.shadowScopes.size === 0) return false;
  const ranges = s.shadowScopes.get(name);
  if (!ranges) return false;
  if (s.localImportMap.get(name)?.isDynamicImport) return false;
  for (const range of ranges) {
    if (pos >= range[0] && pos <= range[1]) return true;
  }
  return false;
};
