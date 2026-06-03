import { LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';

export const ScopedBadge = 1;

function registerScoped() {
  @customElement('scoped-badge')
  class ScopedBadge extends LitElement {}
  return ScopedBadge;
}

registerScoped();
