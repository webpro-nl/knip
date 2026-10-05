export namespace Animals {
  export const cat = 'cat';
  export const unusedDog = 'dog';
  export function swim() {}

  export namespace Birds {
    export const eagle = 'eagle';
    export const unusedParrot = 'parrot';
  }
}

export namespace Shapes {
  export abstract class Base {}
  export class Circle extends Base {}

  export namespace Sizes {
    export type Size = number;
    export const small: Size = 1;
  }

  export const area = (size: Sizes.Size) => size;

  export interface Options {
    sides: number;
  }
  export const options: Options = { sides: 4 };

  export function scale(value: number): number;
  export function scale(value: number) {
    return value;
  }
  export const double = () => scale(2);

  export const length = 1;
  export const perimeter = () => [1, 2].length;

  export function spin(): void {
    spin();
  }

  export const width = 1;
  export const height = 2;
  export const depth = 3;
  export function measure() {
    const width = 2;
    {
      var height = 3;
    }
    try {
      return width + height;
    } catch (depth) {
      return depth;
    }
  }
}
