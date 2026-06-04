export class NativeElement extends HTMLElement {
  connectedCallback() {}
}
customElements.define('native-element', NativeElement);

export const unusedHelper = 1;
