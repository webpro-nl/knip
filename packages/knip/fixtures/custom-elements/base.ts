export default class BaseElement extends HTMLElement {
  static define(name: string) {
    customElements.define(name, class extends this {});
  }
}
