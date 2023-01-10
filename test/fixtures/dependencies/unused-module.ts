import { EventEmitter } from 'events';
import once from '@tootallnate/once';

const emitter = new EventEmitter();

setTimeout(() => emitter.emit('foo', 'bar'), 1);

const result = await once(emitter, 'foo');
console.log(result);
