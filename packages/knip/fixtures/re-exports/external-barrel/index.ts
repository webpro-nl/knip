import { produce } from './aliased-barrel';
import { fruit } from './ambiguous-barrel';
import { fruit as relayed } from './converged-barrel';
import { fruit as viaRelay } from './relayed-barrel';
import { harvest } from './uninstalled-barrel';

console.log(fruit, relayed, viaRelay, produce, harvest);
