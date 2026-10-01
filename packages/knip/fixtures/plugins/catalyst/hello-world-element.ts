import { controller } from '@github/catalyst';

@controller
export class HelloWorldElement extends HTMLElement {
  connectedCallback() {
    this.textContent = 'Hello';
  }
}

export const unusedHelper = 1;
