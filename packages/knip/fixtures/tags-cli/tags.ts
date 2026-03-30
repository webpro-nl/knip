export const UnusedUntagged = 1;

/**
 * @custom
 */
export const UnusedCustom = 1;

/**
 * @internal
 */
export const UnusedInternal = 1;

/**
 * @internal
 * @custom
 */
export const UnusedCustomAndInternal = 1;

/**
 * @internal
 */
export enum MyEnum {
  UsedUntagged = 1,

  UnusedUntagged = 1,

  /**
   * @custom
   */
  UnusedCustom = 1,

  /**
   * @internal
   */
  UnusedInternal = 1,

  /**
   * @internal
   * @custom
   */
  UnusedCustomAndInternal = 1,
}

export class MyClass {
  UnusedUntagged = 1;

  /**
   * @custom
   */
  UnusedCustom = 1;

  /**
   * @internal
   */
  UnusedInternal = 1;

  /**
   * @internal
   * @custom
   */
  UnusedCustomAndInternal = 1;
}

/** @custom */
export class MyCustomClass {}

/** @custom */
export enum MyCustomEnum {}
