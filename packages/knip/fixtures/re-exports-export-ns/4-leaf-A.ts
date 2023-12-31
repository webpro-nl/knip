import { fnB } from './3-branch';

export function fnA() {
  return fnB();
}

export enum EnumA {
  InternalUsedProp = 1,
  UnusedProp = 2,
}
