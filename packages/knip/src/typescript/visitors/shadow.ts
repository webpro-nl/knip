import type { WalkState } from './walk.ts';

export const isShadowedIn = (s: WalkState, name: string, pos: number): boolean => {
  if (s.shadowScopes.size === 0) return false;
  const ranges = s.shadowScopes.get(name);
  if (!ranges) return false;
  const scope = s.localImportMap.get(name)?.scope;
  if (scope) return pos < scope[0] || pos > scope[1];
  for (const range of ranges) {
    if (pos >= range[0] && pos <= range[1]) return true;
  }
  return false;
};
