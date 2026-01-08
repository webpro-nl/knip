// Tests importsForExport.importAs: `import { foo as bar }`
import { resolvers as myResolvers } from './resolvers.js';

export function useAliasedResolvers() {
  return myResolvers;
}
