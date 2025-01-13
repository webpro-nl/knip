export type TypeWithMembers = {
  usedMember: string;
  unusedMember: string;
  /** @public */
  ignoredByTag: string;
};

export type TypeWithUnion = {
  usedUnionMember: string | number;
  unusedUnionMember: boolean | null;
};

export type TypeWithIntersection = {
  usedIntersectionMember: string & { prop: string };
  unusedIntersectionMember: number & { val: number };
};
