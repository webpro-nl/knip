export namespace Animals {
  export namespace Mammals {
    export namespace Felines {
      export namespace BigCats {
        export const jaguar = 'jaguar';
        export const leopard = 'leopard';
        export const unusedPanther = 'panther';
      }
    }
  }
}

console.log(Animals.Mammals.Felines.BigCats.leopard);
