import { EventEmitter } from 'node:events';
import once from '@tootallnate/once';

const emitter = new EventEmitter();

setTimeout(() => emitter.emit('event', 'name'), 1);

const result = await once(emitter, 'event');
result;
