import type { WalkState } from './walk.ts';

export const isShadowedIn = (s: WalkState, name: string, pos: number): boolean => {
  if (s.shadowScopes.size === 0) return false;
  const ranges = s.shadowScopes.get(name);
  if (!ranges) return false;
  const scope = s.localImportMap.get(name)?.scope;
  if (scope) {
    for (let i = ranges.length - 1; i >= 0; i--) {
      const range = ranges[i];
      if (range[0] < scope[0]) break;
      if (range[0] === scope[0] && range[1] >= scope[1]) continue;
      if (pos >= range[0] && pos < range[1]) return true;
    }
    return false;
  }
  for (const range of ranges) {
    if (pos >= range[0] && pos < range[1]) return true;
  }
  return false;
};
