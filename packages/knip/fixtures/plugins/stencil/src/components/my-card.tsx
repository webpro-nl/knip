import { Component, h } from '@stencil/core';

@Component({ tag: 'my-card', styleUrls: ['my-card.scss', 'my-card-rtl.scss'] })
export class MyCard {
  render() { return <div class='card'><slot /></div>; }
}
