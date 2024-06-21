export interface MyInterface {
  _class: MyClass;
  _type: MyType;
  _fn: typeof fn;
  _const: typeof c;
}

export type MyType = {
  key: 1;
};

export class MyClass {}

export function fn() {}

export const c = 1;
