import { isHidden } from './format';

export class Model {
  children: Model[] = [];

  get hidden() {
    return isHidden(this.children);
  }
}
