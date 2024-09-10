import { x } from 'tinyexec';
import { createHead } from 'unhead';

export const used = () => createHead();

export const unusedFunction = () => x;
