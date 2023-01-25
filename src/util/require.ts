import { createRequire } from 'node:module';

export const require = createRequire(process.cwd());

export const tryResolve = (specifier: string) => {
  try {
    return require.resolve(specifier);
  } catch (error) {
    // Intentionally ignored, exceptions are thrown for specifiers being packages (e.g. `node --loader tsx index.ts`)
  }
};
