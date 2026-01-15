class BaseClass {
  // biome-ignore lint: complexity/noUselessConstructor
  constructor() {}
  init() {}
  used() {}
  unused() {}
}

export class MyClass extends BaseClass {
  // biome-ignore lint: complexity/noUselessConstructor
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
