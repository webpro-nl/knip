import { runtime } from './types.ts';
import { namespaceRuntime } from './namespace-types.ts';

/** Documentation may mention `@import { Missing } from './missing.ts'` without declaring a tag. */

/**
 * @import DefaultType, {
 *   NamedType,
 *   AliasedType as LocalType,
 * } from './types.ts'
 */

/**
 * @import
 * * as types
 * from './namespace-types.ts'
 */

/**
 * @param {DefaultType} defaultType
 * @param {NamedType} namedType
 * @param {LocalType} aliasedType
 * @param {types.NamespaceType} namespaceType
 */
export function useTypes(defaultType, namedType, aliasedType, namespaceType) {
  return { defaultType, namedType, aliasedType, namespaceType, runtime, namespaceRuntime };
}
