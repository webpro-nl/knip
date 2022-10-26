export enum MyEnum {
  A_UsedExternal = 1,
  B_Unused = 1,
  C_UsedInternal = 1,
}

export class MyClass {
  static displayName?: string | undefined;

  constructor() {
    this.bound = this.bound.bind(this);
  }

  private aUnusedPrivate = 1;
  private aUsedPrivate = 1;

  public bPublic = 1;
  public bUsedExternal = 1;
  public bInternal = 1;

  cProp = 1;
  cUsedExternal: MyEnum.C_UsedInternal = 1;

  bound = () => {
    return this.bInternal + this.aUsedPrivate;
  };

  dMember() {}
  dUsedExternal() {}

  static eStatic = 1;
  static eUsedExternal = 1;
}

MyClass.displayName = 'My Class';
