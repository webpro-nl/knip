import { NamedKey, NumberLikeKey, NumericKey } from './codes';
import * as codes from './codes';

export function lookups() {
  return [
    NamedKey['used'],
    NumericKey['2000'],
    NumberLikeKey['Infinity'],
    NumberLikeKey['0x10'],
    NumberLikeKey['1e3'],
    codes.NamespaceNamedKey['used'],
  ];
}
