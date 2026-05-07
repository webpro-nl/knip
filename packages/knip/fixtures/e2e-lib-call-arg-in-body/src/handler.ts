export interface UnusedHelperOptions {
  stale: boolean;
}

export interface InternalActionA {
  type: 'a';
}
export interface InternalActionB {
  type: 'b';
}

const reducer = (s: number, a: InternalActionA | InternalActionB): number => {
  void a;
  return s;
};

const applyReducer = <S, A>(r: (s: S, a: A) => S, init: S): void => {
  void r;
  void init;
};

export function increment() {
  applyReducer(reducer, 0);
  return 'ok';
}
