import { type EntryEnum } from './index';

enum UnexportedEnun {
  Member = 1,
}

export enum MyEnum {
  A_UsedExternal = 1,
  B_Unused = 1,
  C_UsedInternal = 1,
  'D-Key' = 'D-Value',
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

export enum Permission {
  Read = 1 << 0,
  Write = 1 << 1,
  ReadWrite = Read | Write,
}
