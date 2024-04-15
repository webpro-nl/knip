import type { PackageJson } from '../types/package-json.js';
import { dirname, basename } from './path.js';

const getName2 = (parent: string, base: string) => (parent.charAt(0) === '@' ? `${parent}/${base}` : base);

const getName = (dir: string) => (dir ? getName2(basename(dirname(dir)), basename(dir)) : undefined);

export function getPackageName(pkg: PackageJson, pathname: string) {
  const { name } = pkg;
  return name || getName(pathname);
}
