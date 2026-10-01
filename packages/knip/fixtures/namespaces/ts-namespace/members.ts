function useSeasons(): Seasons.Name {
  return Seasons.getName();
}

function paramShadow(Fruits: { unusedBanana: number }) {
  return Fruits.unusedBanana;
}

const arrowShadow = (Animals: { unusedDog: number }) => Animals.unusedDog;

function destructuredShadow({ Shapes }: { Shapes: { unusedSquare: number } }) {
  return Shapes.unusedSquare;
}

for (const Standalone of [{ unusedValue: 1 }]) {
  console.log(Standalone.unusedValue);
}

export namespace Fruits {
  export const apple = 1;
  export const unusedBanana = 2;

  export namespace Tropical {
    export const mango = 3;
    export const unusedPapaya = 4;
  }
}

export namespace Animals {
  export const cat = 1;
  export const unusedDog = 2;

  export namespace Birds {
    export const eagle = 3;
  }
}

export namespace Shapes {
  export const circle = 1;
  export const unusedSquare = 2;

  export namespace Nested {
    export const triangle = 3;
  }
}

export const standalone = 0;
export namespace Standalone {
  export const value = 1;
  export const unusedValue = 2;

  export namespace Nested {
    export const deep = 3;
  }
}

export namespace Seasons {
  export type Name = string;
  export function getName(): string { return 'spring'; }
  export const unusedCount = 0;
}

export namespace Overloads {
  /** @public */
  export function tagged(x: number): number
  /** @public */
  export function tagged(x: string): number
  export function tagged(x: number | string): number { return 1; }

  export function tagOnSecond(x: number): number
  /** @public */
  export function tagOnSecond(x: string): number
  export function tagOnSecond(x: number | string): number { return 1; }

  export function tagOnImpl(x: number): number
  export function tagOnImpl(x: string): number
  /** @public */
  export function tagOnImpl(x: number | string): number { return 1; }

  export function untagged(x: number): number
  export function untagged(x: string): number
  export function untagged(x: number | string): number { return 1; }
}
