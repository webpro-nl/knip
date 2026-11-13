import type Transition from '@ember/routing/transition';
export default class FruitRoute {
  beforeModel(transition: Transition) {
    return transition;
  }
}
