import type { InterfaceWithMembers, InterfaceWithMethods, InterfaceWithIndexSignature } from './interfaces';
import type { TypeWithMembers, TypeWithUnion, TypeWithIntersection } from './types';

// Using type members
const typeRef: TypeWithMembers = {
  usedMember: 'string',
};

const unionRef: TypeWithUnion = {
  usedUnionMember: 'string',
};

const intersectionRef: TypeWithIntersection = {
  usedIntersectionMember: { prop: 'string' },
};

// Using interface members
const interfaceRef: InterfaceWithMembers = {
  usedMember: 'string',
};

const methodRef: InterfaceWithMethods = {
  usedMethod() {},
};

const indexRef: InterfaceWithIndexSignature = {
  usedProp: 'string',
};
