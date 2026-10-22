function sealed(value: Function) {
  Object.seal(value);
}

@sealed
export default class {}

export const dd = 1;
