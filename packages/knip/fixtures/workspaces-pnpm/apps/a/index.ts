import defaultA, { usedExportFromLibA } from '@workspaces-pnpm/lib-a';
import defaultB, { usedExportFromLibB } from '@workspaces-pnpm/lib-b';
import { c } from 'unlisted';

defaultA;
defaultB;
usedExportFromLibA;
usedExportFromLibB;
