import { AliasedAccess as Aliased, LocalAliasAccess, NumericLiteralAccess } from './codes';
import * as codes from './codes';
import { ReExportedAccess, RenamedAccess, StarReExportAccess } from './barrel';

export function lookups(key: number) {
  const localAlias = LocalAliasAccess;
  return [
    Aliased[key],
    codes.NamespaceAccess[key],
    localAlias[key],
    NumericLiteralAccess['2000'],
    ReExportedAccess[key],
    RenamedAccess[key],
    StarReExportAccess[key],
  ];
}
