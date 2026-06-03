function customElement(_tag: string) {
  return (_target: unknown) => {};
}

@customElement('not-lit-element')
export class NotLitElement {}
