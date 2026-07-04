declare module 'listed-lib' {
  export interface Payload extends Base {
    listed: number;
  }
}

declare module 'transitive-lib' {
  export interface Payload extends Base {
    transitive: number;
  }
}

export {};
