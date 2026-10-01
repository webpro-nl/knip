function customElement(_tag: string) {
  return (_target: unknown) => {};
}

@customElement('not-fast-element')
export class NotFastElement {}
