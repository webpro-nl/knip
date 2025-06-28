interface MyInterface {
  musthave: boolean;
  done(): void;
}

// to implement is to use
export class SomeClass implements MyInterface {
  musthave: boolean;
  constructor() {
    this.musthave = true;
  }
  done() {}
}
