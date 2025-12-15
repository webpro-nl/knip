import { Component } from 'react';
import { Parent } from './index';

const parent = new Parent();

class UnexportedClass {
  prop;
  public publicProp;
  public publicMethod() {}
}

export class MyClass {
  static displayName = 1;
  unused() {}
}

export class MyComponentClass extends Component {
  constructor() {
    this.bound = this.bound.bind(this);
    this.writeOnly();
    this.cWriteOnlyPublic = 2;
  }

  private aUnusedPrivate = 1;
  private aUsedPrivate = 1;
  private aWriteOnlyPrivate = 1;

  public bUnusedPublic = 1;
  public bWriteOnlyPublic = 1;
  public bUsedExternal = 1;
  public bUsedExternalFromTypedMemberInstance() {}
  public bInternal = 1;
  cWriteOnlyPublic = 1;

  cUnusedProp = 1;
  cUsedExternal: MyEnum.C_UsedInternal = 1;

  bound = () => {
    return this.bInternal + this.aUsedPrivate;
  };

  writeOnly() {
    this.aWriteOnlyPrivate = 2;
    this.bWriteOnlyPublic = 2;
  }

  dUnusedMember() {}
  dUsedExternal() {
    const value = this.usedGetter;
    this.usedSetter = value;
  }

  static eUnusedStatic = 1;
  static eUsedExternal = 1;

  public get usedGetter(): string {
    return 'usedGetter';
  }

  public set usedSetter(value: string) {
    value;
  }

  public get unusedGetter(): string {
    return 'unusedGetter';
  }

  public set unusedSetter(value: string) {
    value;
  }

  componentDidMount() {}

  render() {
    return null;
  }
}

MyComponentClass.displayName = 'My Component Class';
