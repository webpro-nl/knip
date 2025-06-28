export abstract class AbstractClass {
  public abstract implemented(): AbstractClass;
  public abstract [Symbol.toStringTag](): AbstractClass;
}

export class ExtendedClass extends AbstractClass {
  public implemented(): AbstractClass {
    return this;
  }
}
