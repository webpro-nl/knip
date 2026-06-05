export class ScopedRegistryElement extends HTMLElement {}

const registry = new CustomElementRegistry();
registry.define('scoped-registry-element', ScopedRegistryElement);
