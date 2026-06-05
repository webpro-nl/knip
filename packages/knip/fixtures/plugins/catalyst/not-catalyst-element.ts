function controller<T>(target: T): T {
  return target;
}

@controller
export class NotCatalystElement extends HTMLElement {}
