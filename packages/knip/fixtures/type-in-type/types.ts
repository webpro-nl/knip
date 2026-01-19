interface SharedProps {
  foo: string;
}

export type B = SharedProps;

export interface A extends SharedProps {
  transform: () => void;
}

export type Union = A | B;

export type Func = () => void;
