import defaultA, { usedExportFromLibA } from '@scoped/lib-a';
import defaultB, { usedExportFromLibB } from '@scoped/lib-b';
import { c } from 'unlisted';

console.log(defaultA, defaultB);
console.log(usedExportFromLibA, usedExportFromLibB);
