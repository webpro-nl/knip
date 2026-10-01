import './events.augmentation.js';
import './events.meta-augmentation.js';
import type { EventBusEvents } from './events.js';

export const handled: (keyof EventBusEvents)[] = [];
