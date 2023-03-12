import defaultA, { usedExportFromLibA } from '@workspaces/lib-a';
import defaultB, { usedExportFromLibB } from '@workspaces/lib-b';
import { root } from 'root-dependency';
import { c } from 'used';

defaultA;
defaultB;
usedExportFromLibA;
usedExportFromLibB;
