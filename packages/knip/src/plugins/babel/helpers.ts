import { isAbsolute, isInternal } from '#p/util/path.js';

export const resolveName = (identifier: string, namespace: 'preset' | 'plugin') => {
  if (isAbsolute(identifier) || isInternal(identifier)) return identifier;
  if (identifier.startsWith('module:')) return identifier.replace(/^module:/, '');
  if (identifier.startsWith('@')) {
    const [scope, name, ...rest] = identifier.split('/');
    if (rest.length > 0) return identifier;
    if (scope) {
      if (!name) return [scope, `babel-${namespace}`].join('/');
      if (scope === '@babel') {
        if (name.startsWith(namespace)) return identifier;
        return `@babel/${namespace}-${name}`;
      }
      if (name.includes(`babel-${namespace}`)) return identifier;
      return [scope, `babel-${namespace}-${name}`].join('/');
    }
  }
  const [name, ...rest] = identifier.split('/');
  if (rest.length > 0) return identifier;
  if (name.startsWith(`babel-${namespace}`)) return identifier;
  return `babel-${namespace}-${name}`;
};

const cacheFn = () => void 0;
cacheFn.forever = () => cacheFn;
cacheFn.never = () => cacheFn;
cacheFn.using = () => cacheFn;
cacheFn.invalidate = () => cacheFn;

export const api = {
  assertVersion: () => true,
  cache: cacheFn,
  caller: () => true,
  env: () => true,
  version: '0.0.0',
};
