import { type EntryEnum } from './index';

enum UnexportedEnun {
  Member = 1,
}

export enum MyEnum {
  A_UsedExternal = 1,
  B_Unused = 1,
  C_UsedInternal = 1,
  'D_Key' = 'D_Value',
}

const myNumber: MyEnum.C_UsedInternal = 1;

type Used = EntryEnum;

const U: EntryEnum.UsedMemberInEntryEnum = 1;

export enum TestEnum {
  '' = 'test',
}

export enum Category {
  Ambient = 'Ambient',
  Playback = 'Playback',
}
