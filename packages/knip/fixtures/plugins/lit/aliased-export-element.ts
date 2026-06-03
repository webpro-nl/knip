import { LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';

@customElement('aliased-export-element')
class AliasedExportImpl extends LitElement {}

export { AliasedExportImpl as AliasedExportElement };
