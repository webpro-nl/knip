namespace MyNamespace {
  export type Identifier = number;
  export const identifier = 2;
}

type NS_ID = MyNamespace.Identifier;
const ns_id = MyNamespace.identifier;
