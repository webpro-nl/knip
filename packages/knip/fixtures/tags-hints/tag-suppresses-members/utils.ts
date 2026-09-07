import { Level, Settings, StatusCode } from './status.js';

export const isNormal = (code: number) => code === StatusCode.normal;

export const levels = [Level.low, Level.high];

export const timeout = Settings.timeout;
