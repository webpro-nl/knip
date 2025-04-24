export abstract class AbstractClassGen {
  protected constructor() {}

  public abstract implemented(): AbstractClassGen;

  public abstract unimplemented(): AbstractClassGen;

  public abstract [Symbol.iterator](): Iterator<AbstractClassGen>;
}

export class ExtendedClassGen extends AbstractClassGen {
  public constructor() {
    super();
    this;
  }

  public implemented(): AbstractClassGen {
    return this;
  }

  public *[Symbol.iterator](): Iterator<AbstractClassGen> {
    yield this;
  }
}
