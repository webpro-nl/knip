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
}
