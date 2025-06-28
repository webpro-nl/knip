import { MyEnum, TestEnum, Category } from './members';

const a: MyEnum.A_UsedExternal = 1;

const b: TestEnum = { ['']: 'test' };

export enum EntryEnum {
  UsedMemberInEntryEnum = 1,
  UnusedMemberInEntryEnum = 1,
}

function setCategory(cat: Category) {}
