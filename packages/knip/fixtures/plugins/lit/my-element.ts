import { LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';

@customElement('my-element')
export class MyElement extends LitElement {
  render() {
    return null;
  }
}

export const unusedHelper = 1;
