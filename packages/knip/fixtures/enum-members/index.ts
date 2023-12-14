import { MyEnum } from './members';

const a: MyEnum.A_UsedExternal = 1;

export enum EntryEnum {
  UnusedMemberInEntryEnum = 1,
}
