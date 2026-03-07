import type { PackageJson } from '../types/package-json.ts';
import { basename, dirname } from './path.ts';

const getPkgName = (parent: string, base: string) => (parent.charAt(0) === '@' ? `${parent}/${base}` : base);

const getName = (dir: string) => (dir ? getPkgName(basename(dirname(dir)), basename(dir)) : undefined);

export function getPackageName(pkg: PackageJson, pathname: string) {
  const { name } = pkg;
  return name || getName(pathname);
}
