import Route from '@ember/routing/route';
import Model from '@ember-data/model';
import { has } from '@ember/edition-utils';
import fetch from 'fetch';
import { apples } from 'orchard-classic/utils/fruit';
export default class FruitRoute extends Route {
  model = () => [apples, Model, has, fetch];
}
