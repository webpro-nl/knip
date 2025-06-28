export interface Lizard {
  skin: string;
}

export class Reptile {
  skin: string;
}

export const SkinColor = 'green';

export type Bird = {
  ref0: typeof Reptile;
  ref1: () => Lizard;
  ref2: typeof SkinColor;
};

export function logger(s: string) {
  return s;
}

function setLogger(log: typeof logger): void {
  log;
}

const obj = {
  destrRefObj: 1,
};

const arr = [1, 2, 3];

export const { destrRefObj } = obj;

export const [destrRefArr] = arr;

destrRefObj;
destrRefArr;
