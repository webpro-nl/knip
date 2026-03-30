interface SharedProps {
  foo: string;
}

export type B = SharedProps;

export interface A extends SharedProps {
  transform: () => void;
}

export type Union = A | B;

export type Wrapped = Array<A | B>;

export type Mapped = Map<string, A>;

export type Tuple = [A, B];

export type Intersection = A & B;

export type Conditional = A extends B ? A : B;

export type Nested = Set<Array<A>>;

export type Func = () => void;
