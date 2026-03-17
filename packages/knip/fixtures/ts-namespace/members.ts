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
