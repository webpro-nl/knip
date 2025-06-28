import _ from 'lodash';
import pc from 'picocolors';

export const used = () => pc.blue('Hello');

export const unusedFunction = () => _.random();
