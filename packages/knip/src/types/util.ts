type Primitive = null | undefined | string | number | boolean | symbol | bigint;
export type LiteralUnion<LiteralType, BaseType extends Primitive> = LiteralType | (BaseType & Record<never, never>);
