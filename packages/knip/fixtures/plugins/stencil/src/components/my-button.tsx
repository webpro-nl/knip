import { Component, h } from '@stencil/core';

@Component({ tag: 'my-button' })
export class MyButton {
  render() { return <button><slot /></button>; }
}