import { FASTElement } from '@microsoft/fast-element';

function Renderable<T>(Base: T): T {
  return Base;
}

export class MixinElement extends Renderable(FASTElement) {}

MixinElement.defineAsync({ name: 'mixin-element' });
