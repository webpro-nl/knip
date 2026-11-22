import ownDependency from 'own-dependency';
import ownDevDependency from 'own-dev-dependency';
import ownPeerDependency from 'own-peer-dependency';
import type { OwnType } from 'own-type-dev-dependency';
import rootDependency from 'root-dependency';
import { lib } from '@fixtures/strict-workspace__lib';

export const app: OwnType = [ownDependency, ownDevDependency, ownPeerDependency, rootDependency, lib];
