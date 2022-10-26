import { MyClass, MyEnum } from './members';

const instance = new MyClass();

console.log(instance.bUsedExternal);
console.log(instance.cUsedExternal);
console.log(instance.dUsedExternal());
console.log(MyClass.eUsedExternal);

const a: MyEnum.A_UsedExternal = 1;
