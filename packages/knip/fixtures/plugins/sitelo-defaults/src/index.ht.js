import { island } from 'sitelo/islands';

import { layout } from './lib/layout.js';

export default () => layout(`<h1>Orchard</h1>${island('harvest-clock')}`);
