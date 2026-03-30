import defaultA, { usedExportFromLibA } from '@fixtures/workspaces-pnpm__lib-a';
import defaultB, { usedExportFromLibB } from '@fixtures/workspaces-pnpm__lib-b';
import { c } from 'unlisted';

defaultA;
defaultB;
usedExportFromLibA;
usedExportFromLibB;
