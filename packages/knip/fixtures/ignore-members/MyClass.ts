class BaseClass {
  // biome-ignore lint/complexity/noUselessConstructor:  fixture festa
  constructor() {}
  init() {}
  used() {}
  unused() {}
}

export class MyClass extends BaseClass {
  // biome-ignore lint/complexity/noUselessConstructor:  fixture festa
  constructor() {
    super();
  }
  ignored() {}
  init() {
    super.init();
  }
  implemented() {
    this.used();
  }
}
