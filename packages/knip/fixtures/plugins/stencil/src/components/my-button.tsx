import { Component, h } from '@stencil/core';

@Component({ tag: 'my-button', styleUrl: 'my-button.scss' })
export class MyButton {
  render() { return <button><slot /></button>; }
}