export type MyType = {
  usedTypeMember?: boolean;
  usedInUnion?: boolean;
  usedInIntersection?: boolean;

  usedInIntersectionInternal?: boolean;
  usedInUnionInternal?: boolean;

  unusedTypeMember?: boolean;
  'unused-type-quoted'?: boolean;
};

export type WithIntersection = { boolB?: boolean } & Omit<MyType, 'usedInExtends' | 'usedInExtendsInternal'>;
export type WithUnion = { boolC?: boolean } | Omit<MyType, 'usedInExtends' | 'usedInExtendsInternal'>;

const internalIntersectionUsage: WithIntersection = {
  usedInIntersectionInternal: true,
};

const internalUnionUsage: WithUnion = {
  usedInUnionInternal: true,
};

internalIntersectionUsage;
internalUnionUsage;
