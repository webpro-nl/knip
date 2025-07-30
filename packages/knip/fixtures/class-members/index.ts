import { SomeClass } from './implements';
import { MyClass } from './members';
import { AbstractClassGen, ExtendedClassGen } from './iterator-generator';
import { AbstractClass, ExtendedClass } from './iterator';

AbstractClass;

const instance = new MyClass();
const some = new SomeClass();
const instance2 = new ExtendedClass();
const instance3: AbstractClassGen = new ExtendedClassGen();

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
instance2.implemented;
instance3.implemented;
