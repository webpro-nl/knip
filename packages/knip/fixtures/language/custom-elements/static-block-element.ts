export class StaticBlockElement extends HTMLElement {
  static {
    customElements.define('static-block-element', this);
  }
}
