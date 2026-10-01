export const used = 1;
export const unused = 1;

export type UsedType = unknown;
export type UnusedType = unknown;

export default used;

export class MyClass {
  unused: 1;
}

export enum MyEnum {
  used = 1,
  unused = 1,
}
