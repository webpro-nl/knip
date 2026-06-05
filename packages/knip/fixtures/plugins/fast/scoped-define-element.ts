import { FASTElement } from '@microsoft/fast-element';

export const ScopedDefine = 1;

function register() {
  class ScopedDefine extends FASTElement {}
  ScopedDefine.define('scoped-define');
}

register();
