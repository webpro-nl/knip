export class ShadowRootElement extends HTMLElement {}

const root = document.body.attachShadow({ mode: 'open' }) as ShadowRoot & {
  customElements: CustomElementRegistry;
};
root.customElements.define('shadowroot-element', ShadowRootElement);
