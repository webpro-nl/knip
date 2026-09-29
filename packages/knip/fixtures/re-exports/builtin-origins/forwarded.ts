import { readFile as read } from 'fs';
import fsDefault from 'node:fs';
import * as fs from 'node:fs';

export { read as readFile, read as readAlias, fsDefault, fs as fsNamespace };
