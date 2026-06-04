export type ElementConfig = { mode: string };

export class DtsChainElement extends HTMLElement {
  configure(config: ElementConfig) {
    return config;
  }
}
customElements.define('dts-chain-element', DtsChainElement);
