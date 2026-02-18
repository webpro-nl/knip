import type { ResolveHook } from 'node:module';
import path from 'node:path';

const tsExts = new Set(['.ts', '.tsx', '.mts', '.cts']);

export const resolve: ResolveHook = async function resolve(specifier, context, nextResolve) {
  const ext = path.extname(specifier);

  if (ext === '.js') {
    for (const tsExt of tsExts) {
      const specifierWithExtReplaced = specifier.replace(/\.js$/, tsExt);

      try {
        return await nextResolve(specifierWithExtReplaced, context);
      } catch {}
    }
  }

  return nextResolve(specifier, context);
};
