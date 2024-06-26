export interface MyInterface {
  _class: MyClass;
  _type: MyType;
  _fn: typeof fn;
  _const: typeof myNumber;
}

export type MyType = {
  key: 1;
};

export class MyClass {}

export class NotInExportedType {}

export function fn(n: unknown) {}

export const myNumber = 1;

const instance = new MyClass();

const inst = new NotInExportedType();

const total = myNumber + myNumber;
total;

interface MyInterface2 {
  _class2: NotInExportedType;
}

const x: MyInterface2 = { _class2: 1 };

export const myValue: unknown = {};
export const myResult: unknown = fn(myValue);
