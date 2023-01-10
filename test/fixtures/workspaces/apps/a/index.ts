import defaultA, { usedExportFromLibA } from '@scoped/lib-a';
import defaultB, { usedExportFromLibB } from '@scoped/lib-b';
import { root } from 'root-dependency';
import { c } from 'used';

console.log(defaultA, defaultB);
console.log(usedExportFromLibA, usedExportFromLibB);
