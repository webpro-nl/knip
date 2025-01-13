export interface InterfaceWithMembers {
  usedMember: string;
  unusedMember: string;
  /** @public */
  ignoredByTag: string;
}

export interface InterfaceWithMethods {
  usedMethod(): void;
  unusedMethod(): void;
}

export interface InterfaceWithIndexSignature {
  [key: string]: unknown;
  usedProp: string;
  unusedProp: string;
}
