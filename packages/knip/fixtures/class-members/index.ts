import { MyClass } from './members';
import { AbstractClassGen, ExtendedClassGen } from './iterator-generator';
import { AbstractClass, ExtendedClass } from './iterator';

AbstractClassGen;
ExtendedClassGen;
AbstractClass;
ExtendedClass;

const instance = new MyClass();

export class Parent {
  instance: MyClass;
  constructor() {
    this.instance = new MyClass();

    // This member reference is only found because `this.instance` is a typed member of Parent
    this.instance.bUsedExternalFromTypedMemberInstance();
  }

  unusedMemberInEntry() {}
}

instance.bUsedExternal;
instance.cUsedExternal;
instance.dUsedExternal();
MyClass.eUsedExternal;
