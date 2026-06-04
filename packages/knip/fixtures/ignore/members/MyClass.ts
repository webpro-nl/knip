class BaseClass {
  constructor() {}
  init() {}
  used() {}
  unused() {}
}

export class MyClass extends BaseClass {
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
