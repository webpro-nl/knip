import { MyEnum, TestEnum } from './members';

const a: MyEnum.A_UsedExternal = 1;

const b: TestEnum = { ['']: 'test' };

export enum EntryEnum {
  UnusedMemberInEntryEnum = 1,
}
