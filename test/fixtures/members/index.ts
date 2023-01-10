import { MyClass, MyEnum } from './members';

const instance = new MyClass();

class Parent {
  instance: MyClass;
  constructor() {
    this.instance = new MyClass();

    // This member reference is only found because `this.instance` is a typed member of Parent
    this.instance.bUsedExternalFromTypedMemberInstance();
  }
}

const parent = new Parent();

console.log(instance.bUsedExternal);
console.log(instance.cUsedExternal);
console.log(instance.dUsedExternal());
console.log(MyClass.eUsedExternal);
console.log(parent);

const a: MyEnum.A_UsedExternal = 1;
