import { Component, h } from '@stencil/core';

@Component({ tag: 'my-mode-style', styleUrls: {
    md: './ios.scss',
    ios: './md.scss' 
  }})
export class MyModeStyle {
  render() { return <div class='card'><slot /></div>; }
}
