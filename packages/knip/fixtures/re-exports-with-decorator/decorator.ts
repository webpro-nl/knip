function MyDeco() {
  return (...args: any[]) => {};
}

@MyDeco()
export class MyDecorated {}
